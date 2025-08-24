import { getAdminApp } from "@/lib/firebase-admin";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { WorldMission, Tile, City } from "@/types";
import { getCurrentUser } from "@/lib/user";
import { redirect } from "next/navigation";
import { serialize } from "@/lib/serializer";

async function getDashboardData(userId: string) {
  const adminApp = getAdminApp();
  const db = adminApp.firestore();

  // Fetch cities with tile information
  const citiesRef = db.collection("users").doc(userId).collection("cities");
  const citiesSnapshot = await citiesRef.get();

  const citiesData: City[] = [];
  const tileIds: string[] = [];

  citiesSnapshot.docs.forEach((doc) => {
    const cityData = doc.data() as City;
    citiesData.push({ ...cityData, id: doc.id });
    if (cityData.tileId) {
      tileIds.push(cityData.tileId);
    }
  });

  const tiles: { [key: string]: Tile } = {};
  if (tileIds.length > 0) {
    const tileChunks = [];
    for (let i = 0; i < tileIds.length; i += 10) {
      const chunk = tileIds.slice(i, i + 10);
      const tilesRef = db.collection("world").where("id", "in", chunk);
      tileChunks.push(tilesRef.get());
    }
    const tileSnapshots = await Promise.all(tileChunks);
    tileSnapshots.forEach((snapshot) => {
      snapshot.forEach((doc) => {
        tiles[doc.id] = doc.data() as Tile;
      });
    });
  }

  const cities = citiesData.map((city) => {
    const tile = city.tileId ? tiles[city.tileId] : undefined;

    if (!tile && city.tileId) {
      console.warn(
        `Warning: Tile with ID '${city.tileId}' not found for city '${city.name}' (${city.id}). This may indicate inconsistent data.`
      );
    }

    const actualLocation = tile
      ? {
          continent: tile.location.continentName,
          zone: tile.zone,
          coords: tile.coords,
        }
      : null;

    return {
      ...city,
      location: tile ? tile.location : city.location,
      actualLocation: actualLocation,
    };
  });

  const missionsRef = db
    .collection("worldMissions")
    .where("ownerId", "==", userId);
  const missionsSnapshot = await missionsRef.get();
  const missions: WorldMission[] = missionsSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as WorldMission)
  );

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

  missions.forEach((mission) => {
    totalArmy.swordsman += mission.army?.swordsman || 0;
    totalArmy.archer += mission.army?.archer || 0;
    totalArmy.knight += mission.army?.knight || 0;
  });

  totalArmy.swordsman = Math.round(totalArmy.swordsman);
  totalArmy.archer = Math.round(totalArmy.archer);
  totalArmy.knight = Math.round(totalArmy.knight);

  const serializableCities = serialize(cities);
  const serializableMissions = serialize(missions);

  return {
    cities: serializableCities,
    missions: serializableMissions,
    stats: {
      totalCities: cities.length,
      totalArmy,
      totalResources,
    },
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  const { cities, missions, stats } = await getDashboardData(user.uid);

  return <DashboardClient initialData={{ cities, missions, stats }} />;
}
