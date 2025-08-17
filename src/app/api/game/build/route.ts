import { getCity, updateCity } from "@/lib/city";
import { getGameConfig } from "@/lib/game";
import { getCurrentUser } from "@/lib/user";
import { BuildingKey, BuildingQueueItem, ResourceKey } from "@/types";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { cityId, buildingId } = await request.json();
    const user = await getCurrentUser();
    const gameConfig = await getGameConfig();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!cityId || !buildingId) {
      return NextResponse.json(
        { error: "Missing cityId or buildingId" },
        { status: 400 }
      );
    }

    const city = await getCity(cityId);

    if (!city || (city.userId !== user.uid && city.ownerId !== user.uid)) {
      return NextResponse.json(
        { error: "City not found or access denied" },
        { status: 404 }
      );
    }

    const typedBuildingId = buildingId as BuildingKey;
    const buildingLevel = city.buildings[typedBuildingId] || 0;
    const nextLevel = buildingLevel + 1;
    const buildingData = gameConfig.buildings[typedBuildingId]?.[nextLevel];

    if (!buildingData) {
      return NextResponse.json(
        { error: "Building at max level or invalid" },
        { status: 400 }
      );
    }

    const isAlreadyInQueue = city.buildingQueue?.some(
      (item) => item.buildingId === buildingId
    );

    if (isAlreadyInQueue) {
      return NextResponse.json(
        { error: "This building is already being upgraded." },
        { status: 409 }
      );
    }

    const hasEnoughResources = Object.entries(buildingData.cost).every(
      ([resource, amount]) => {
        const resourceAmount = amount as number;
        return city.resources[resource as ResourceKey] >= resourceAmount;
      }
    );

    if (!hasEnoughResources) {
      return NextResponse.json(
        { error: "Not enough resources" },
        { status: 400 }
      );
    }

    const resourceUpdates: { [key: string]: FieldValue } = {};
    for (const [resource, amount] of Object.entries(buildingData.cost)) {
      const resourceAmount = amount as number;
      resourceUpdates[`resources.${resource}`] = FieldValue.increment(
        -resourceAmount
      );
    }

    // *** HIER IST DIE KORREKTUR ***
    // Wir verwenden jetzt Firestore Timestamps, um Typsicherheit zu gewährleisten.
    const constructionTimeSec = buildingData.constructionTime;
    const startTime = Timestamp.now();
    const endTime = Timestamp.fromMillis(
      startTime.toMillis() + constructionTimeSec * 1000
    );

    const newQueueItem: BuildingQueueItem = {
      id: `${buildingId}-${nextLevel}-${startTime.toMillis()}`,
      buildingId: typedBuildingId,
      targetLevel: nextLevel, // Konsistent 'targetLevel' verwenden
      startTime: startTime,
      endTime: endTime,
    };

    await updateCity(cityId, {
      ...resourceUpdates,
      buildingQueue: FieldValue.arrayUnion(newQueueItem),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updatedCity = await getCity(cityId);

    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error("Error starting build:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
