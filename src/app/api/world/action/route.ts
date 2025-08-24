import { NextRequest, NextResponse } from "next/server";
import { StartWorldMissionRequest, WorldMission, Tile, City } from "@/types";
import { z } from "zod";
import { getCurrentUser } from "@/lib/user";
import { getAdminApp } from "@/lib/firebase-admin";
import { FieldValue, Transaction } from "firebase-admin/firestore";
import { UNITS, UNIT_LIST } from "@/config/units.config";
import * as admin from "firebase-admin";
import { calculateDistance } from "@/utils/map.utils";

getAdminApp();
const db = admin.firestore();

const startMissionSchema = z.object({
  originCityId: z.string().min(1),
  targetTileId: z.string().min(1),
  actionType: z.enum(["ATTACK", "SPY", "GATHER", "SEND_RSS"]),
  army: z
    .record(z.enum(UNIT_LIST), z.number().int().min(0))
    .refine((army) => Object.values(army).some((count) => count > 0), {
      message: "You must send at least one unit.",
    }),
  resources: z
    .object({
      food: z.number().int().min(0).optional(),
      wood: z.number().int().min(0).optional(),
      stone: z.number().int().min(0).optional(),
      mana: z.number().int().min(0).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.uid;

    const body = await req.json();

    const validation = startMissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error },
        { status: 400 }
      );
    }

    const missionData: StartWorldMissionRequest = validation.data;
    const { originCityId, targetTileId, actionType, army } = missionData;

    const missionId = db.collection("worldMissions").doc().id;

    await db.runTransaction(async (transaction: Transaction) => {
      const cityRef = db
        .collection("users")
        .doc(userId)
        .collection("cities")
        .doc(originCityId);
      const cityDoc = await transaction.get(cityRef);

      if (!cityDoc.exists) {
        throw new Error("Origin city not found or you do not own it.");
      }
      const city = cityDoc.data() as City;

      // Check Origin Units
      const unitUpdates: { [key: string]: FieldValue } = {};
      for (const unitType in army) {
        const requestedAmount = army[unitType as keyof typeof army];
        const availableAmount =
          city.army?.[unitType as keyof typeof city.army] ?? 0;
        if (availableAmount < requestedAmount) {
          throw new Error(
            `Not enough ${unitType} in the city. Available: ${availableAmount}, Requested: ${requestedAmount}`
          );
        }
        unitUpdates[`army.${unitType}`] = FieldValue.increment(
          -requestedAmount
        );
      }

      const originTileId = city.tileId;
      if (!originTileId) {
        throw new Error("City has no associated tile ID");
      }

      const originTileRef = db.collection("world").doc(originTileId);
      const originTileDoc = await transaction.get(originTileRef);

      if (!originTileDoc.exists) {
        throw new Error("Origin tile not found");
      }
      const originTile = originTileDoc.data() as Tile;
      const originCoords = originTile.coords;

      // Check Target Tile
      const targetTileRef = db.collection("world").doc(targetTileId);
      const targetTileDoc = await transaction.get(targetTileRef);

      if (!targetTileDoc.exists) {
        throw new Error("Target tile not found.");
      }
      const targetTile = targetTileDoc.data() as Tile;
      const targetCoords = targetTile.coords;

      if (
        actionType === "GATHER" &&
        (targetTile.type !== "resource" || targetTile.activeMissionId)
      ) {
        throw new Error(
          "Cannot gather from this tile. It is not a resource tile or it is already being gathered from."
        );
      }
      if (
        actionType === "ATTACK" &&
        !["city", "npc_camp"].includes(targetTile.type)
      ) {
        throw new Error("You can only attack cities and NPC camps.");
      }

      const distance = calculateDistance(originCoords, targetCoords);

      let slowestSpeed = Infinity;
      Object.keys(army).forEach((unitId) => {
        const unitDetails = UNITS[unitId as keyof typeof UNITS];
        if (unitDetails && unitDetails.speed < slowestSpeed) {
          slowestSpeed = unitDetails.speed;
        }
      });
      if (slowestSpeed === Infinity) {
        throw new Error("Could not determine army speed.");
      }

      const marchDurationMs = (distance / slowestSpeed) * 60 * 60 * 1000;
      const now = Date.now();
      const arrivalTime = now + marchDurationMs;
      const returnTime = arrivalTime + marchDurationMs;

      const newMission: WorldMission = {
        id: missionId,
        ownerId: userId,
        originCityId,
        originCoords,
        targetTileId,
        targetCoords,
        actionType,
        army,
        startTime: now,
        arrivalTime,
        returnTime,
        status: "outgoing",
      };

      if (targetTile.ownerId) {
        newMission.targetOwnerId = targetTile.ownerId;
      }
      if (missionData.resources) {
        newMission.resources = missionData.resources;
      }

      const missionRef = db.collection("worldMissions").doc(missionId);

      transaction.set(missionRef, newMission);
      transaction.update(cityRef, unitUpdates);

      if (actionType === "GATHER") {
        transaction.update(targetTileRef, { activeMissionId: missionId });
      }
    });

    return NextResponse.json(
      { message: "Mission started successfully", data: { missionId } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error starting mission:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
