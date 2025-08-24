/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getAdminApp } from "@/lib/firebase-admin";
import { City, WorldMission, Tile } from "@/types";
import { serialize } from "@/lib/serializer";

interface DashboardData {
  cities: EnhancedCity[];
  missions: WorldMission[];
  stats: {
    totalCities: number;
    totalArmy: {
      swordsman: number;
      archer: number;
      knight: number;
    };
    totalResources: {
      stone: number;
      wood: number;
      food: number;
      mana: number;
    };
  };
}

interface EnhancedCity extends City {
  actualLocation?: {
    continent: string;
    zone: string;
    coords: { x: number; y: number };
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminApp = getAdminApp();
    const db = adminApp.firestore();

    const citiesRef = db.collection("users").doc(user.uid).collection("cities");
    const citiesSnapshot = await citiesRef.get();

    const cities: EnhancedCity[] = [];
    const tileIds: string[] = [];

    citiesSnapshot.docs.forEach((doc) => {
      const cityData = doc.data();
      const city: EnhancedCity = {
        id: doc.id,
        userId: user.uid,
        ownerId: user.uid,
        name: cityData.name || "Unnamed City",
        location: cityData.location || {
          region: "Unknown",
          continent: "Unknown",
          territory: "Unknown",
        },
        resources: cityData.resources || {
          stone: 0,
          wood: 0,
          food: 0,
          mana: 0,
        },
        buildings: cityData.buildings || {},
        buildingQueue: (cityData.buildingQueue || []).map((item: any) => ({
          ...item,
          startTime: serialize(item.startTime),
          endTime: serialize(item.endTime),
        })),
        trainingQueue: (cityData.trainingQueue || []).map((item: any) => ({
          ...item,
          startTime: serialize(item.startTime),
          endTime: serialize(item.endTime),
        })),
        researchQueue: (cityData.researchQueue || []).map((item: any) => ({
          ...item,
          startTime: serialize(item.startTime),
          endTime: serialize(item.endTime),
        })),
        research: cityData.research || {
          blacksmithing: 1,
          armorsmithing: 1,
          enchanting: 1,
          administration: 1,
          logistics: 1,
          espionage: 1,
        },
        army: cityData.army || { swordsman: 0, archer: 0, knight: 0 },
        buildingSlots: cityData.buildingSlots,
        defense: cityData.defense,
        workforce: cityData.workforce,
        capacity: cityData.capacity,
        tileId: cityData.tileId,
        createdAt: serialize(cityData.createdAt),
        updatedAt: serialize(cityData.updatedAt),
        lastTickAt: serialize(cityData.lastTickAt),
      };

      cities.push(city);
      if (city.tileId) {
        tileIds.push(city.tileId);
      }
    });

    // 2. Fetch tile information for cities with tileIds
    if (tileIds.length > 0) {
      const tilesSnapshot = await db
        .collection("world")
        .where("id", "in", tileIds)
        .get();

      const tileMap = new Map<string, Tile>();
      tilesSnapshot.docs.forEach((doc) => {
        const tileData = doc.data() as Tile;
        tileMap.set(tileData.id, tileData);
      });

      cities.forEach((city) => {
        if (city.tileId) {
          const tile = tileMap.get(city.tileId);
          if (tile) {
            city.actualLocation = {
              continent: "Aethelgard",
              zone: tile.zone,
              coords: tile.coords,
            };
          }
        }
      });
    }

    // 3. Fetch active missions
    const missionsSnapshot = await db
      .collection("worldMissions")
      .where("ownerId", "==", user.uid)
      .where("status", "in", ["outgoing", "returning"])
      .orderBy("arrivalTime", "asc")
      .get();

    const missions: WorldMission[] = missionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerId: data.ownerId,
        originCityId: data.originCityId,
        originCoords: data.originCoords,
        targetTileId: data.targetTileId,
        targetCoords: data.targetCoords,
        targetOwnerId: data.targetOwnerId,
        actionType: data.actionType,
        army: data.army,
        resources: data.resources,
        startTime: data.startTime,
        arrivalTime: data.arrivalTime,
        returnTime: data.returnTime,
        status: data.status,
      } as WorldMission;
    });

    // 4. Calculate aggregated stats
    const totalArmy = cities.reduce(
      (acc, city) => ({
        swordsman: acc.swordsman + (city.army?.swordsman || 0),
        archer: acc.archer + (city.army?.archer || 0),
        knight: acc.knight + (city.army?.knight || 0),
      }),
      { swordsman: 0, archer: 0, knight: 0 }
    );

    const totalResources = cities.reduce(
      (acc, city) => ({
        stone: acc.stone + (city.resources?.stone || 0),
        wood: acc.wood + (city.resources?.wood || 0),
        food: acc.food + (city.resources?.food || 0),
        mana: acc.mana + (city.resources?.mana || 0),
      }),
      { stone: 0, wood: 0, food: 0, mana: 0 }
    );

    // Add troops in missions to total army count
    missions.forEach((mission) => {
      totalArmy.swordsman += mission.army?.swordsman || 0;
      totalArmy.archer += mission.army?.archer || 0;
      totalArmy.knight += mission.army?.knight || 0;
    });

    const dashboardData: DashboardData = {
      cities,
      missions,
      stats: {
        totalCities: cities.length,
        totalArmy,
        totalResources,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
