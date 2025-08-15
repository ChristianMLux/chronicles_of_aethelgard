import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/user";
import { NextResponse } from "next/server";
import {
  getBuildingUpgradeCost,
  canAfford,
  BuildingKey,
  getBuildTimeSeconds,
} from "@/lib/game";
import { RawCityData, Resources } from "@/types";

export async function POST(req: Request) {
  const adminDb = getFirestore(getAdminApp());

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { cityId, building } = (await req.json()) as {
      cityId: string;
      building: BuildingKey;
    };

    if (!cityId || !building) {
      return new NextResponse("Missing cityId or building", { status: 400 });
    }

    const cityRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("cities")
      .doc(cityId);

    await adminDb.runTransaction(async (transaction) => {
      const cityDoc = await transaction.get(cityRef);
      if (!cityDoc) {
        throw new Error("City not found");
      }

      const city = cityDoc.data() as RawCityData;
      const currentLevel = city.buildings?.[building] || 0;
      const cost = getBuildingUpgradeCost(building, currentLevel);

      if (!city.resources) {
        throw new Error("City resources are missing or not loaded.");
      }

      const availableResources: Resources = {
        stone: city.resources.stone || 0,
        wood: city.resources.wood || 0,
        food: city.resources.food || 0,
        mana: city.resources.mana || 0,
      };

      if (!canAfford(availableResources, cost)) {
        throw new Error("Not enough resources");
      }

      if (city.buildQueue && Object.keys(city.buildQueue).length > 0) {
        throw new Error("Build queue is full");
      }

      const resourceUpdates: { [key: string]: FieldValue } = {};
      for (const [resource, amount] of Object.entries(cost)) {
        if (amount > 0) {
          resourceUpdates[`resources.${resource}`] = FieldValue.increment(
            -amount
          );
        }
      }

      const buildTime = getBuildTimeSeconds(building, currentLevel + 1);
      const queueEntry = {
        name: building,
        duration: buildTime,
        startedAt: FieldValue.serverTimestamp(),
        targetLevel: currentLevel + 1,
      };

      transaction.update(cityRef, {
        ...resourceUpdates,
        [`buildQueue.${building}`]: queueEntry,
      });
    });

    return NextResponse.json({ message: "Build started successfully" });
  } catch (error) {
    console.error("Build error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(errorMessage, { status: 500 });
  }
}
