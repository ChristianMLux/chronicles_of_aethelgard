import { NextRequest, NextResponse } from "next/server";
import { City, ResourceKey, TrainingQueueItem, UnitKey } from "@/types";
import { getGameConfig } from "@/lib/game";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/user";
import { getCity, updateCity } from "@/lib/city";

export async function POST(req: NextRequest) {
  try {
    const {
      cityId,
      unitId,
      amount,
    }: { cityId: string; unitId: UnitKey; amount: number } = await req.json();

    const user = await getCurrentUser();
    const gameConfig = await getGameConfig();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!cityId || !unitId || !amount || amount < 1) {
      return NextResponse.json(
        { error: "Missing or invalid cityId, unitId, or amount" },
        { status: 400 }
      );
    }

    const city = (await getCity(cityId)) as City;

    if (!city || (city.userId !== user.uid && city.ownerId !== user.uid)) {
      return NextResponse.json(
        { error: "City not found or access denied" },
        { status: 404 }
      );
    }

    const unitData = gameConfig.units[unitId as UnitKey]?.[1];

    if (!unitData) {
      return NextResponse.json(
        { error: "Unit data not found or invalid" },
        { status: 400 }
      );
    }

    if (city.trainingQueue && city.trainingQueue.length > 0) {
      return NextResponse.json(
        { error: "There is already a unit in training." },
        { status: 409 }
      );
    }

    const hasEnoughResources = Object.entries(unitData.costs).every(
      ([resource, cost]) => {
        const totalCost = (cost as number) * amount;
        return city.resources[resource as ResourceKey] >= totalCost;
      }
    );

    if (!hasEnoughResources) {
      return NextResponse.json(
        { error: "Not enough resources" },
        { status: 400 }
      );
    }

    const resourceUpdates: { [key: string]: FieldValue } = {};
    for (const [resource, cost] of Object.entries(unitData.costs)) {
      const totalCost = (cost as number) * amount;
      resourceUpdates[`resources.${resource}`] = FieldValue.increment(
        -totalCost
      );
    }

    const recruitTimeSec = unitData.recruitTime * amount;
    const startTime = Timestamp.now();
    const endTime = Timestamp.fromMillis(
      startTime.toMillis() + recruitTimeSec * 1000
    );

    const newQueueItem: TrainingQueueItem = {
      id: `${unitId}-${amount}-${startTime.toMillis()}`,
      unitId: unitId as UnitKey,
      amount: amount,
      startTime: startTime,
      endTime: endTime,
    };

    await updateCity(cityId, {
      ...resourceUpdates,
      trainingQueue: FieldValue.arrayUnion(newQueueItem),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updatedCity = await getCity(cityId);

    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error("Error starting training: ", error);
    return NextResponse.json(
      { error: "Internal Server Error in Training Route" },
      { status: 500 }
    );
  }
}
