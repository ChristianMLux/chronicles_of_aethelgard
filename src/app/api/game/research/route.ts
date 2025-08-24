import { NextRequest, NextResponse } from "next/server";
import { ResearchKey, ResearchQueueItem, ResourceKey } from "@/types";
import { getGameConfig } from "@/lib/game";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/user";
import { getCity, updateCity } from "@/lib/city";

export async function POST(req: NextRequest) {
  try {
    const { cityId, researchId }: { cityId: string; researchId: ResearchKey } =
      await req.json();

    const user = await getCurrentUser();
    const gameConfig = await getGameConfig();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!cityId || !researchId) {
      return NextResponse.json(
        { error: "Missing cityId or researchId" },
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

    if (city.researchQueue && city.researchQueue.length > 0) {
      return NextResponse.json(
        { error: "Another research is already in progress." },
        { status: 409 }
      );
    }

    if (!researchId) {
      console.log("no research id");
    }

    if (!city.research) {
      city.research = {
        blacksmithing: 1,
        armorsmithing: 1,
        enchanting: 1,
        logistics: 1,
        espionage: 1,
        administration: 1,
      };
    }
    const typedResearchId = researchId as ResearchKey;
    const currentLevel = city.research[typedResearchId] || 0;
    const nextLevel = currentLevel + 1;
    const researchData = gameConfig.research[typedResearchId]?.[nextLevel];

    if (!researchData) {
      return NextResponse.json(
        { error: "Research at max level or invalid" },
        { status: 400 }
      );
    }

    const hasEnoughResources = Object.entries(researchData.costs).every(
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
    for (const [resource, amount] of Object.entries(researchData.costs)) {
      const resourceAmount = amount as number;
      resourceUpdates[`resources.${resource}`] = FieldValue.increment(
        -resourceAmount
      );
    }

    const researchTimeSec = researchData.researchTime;
    const startTime = Timestamp.now();
    const endTime = Timestamp.fromMillis(
      startTime.toMillis() + researchTimeSec * 1000
    );

    const newQueueItem: ResearchQueueItem = {
      id: `${researchId}-${nextLevel}-${startTime.toMillis()}`,
      researchId: typedResearchId,
      targetLevel: nextLevel,
      startTime: startTime,
      endTime: endTime,
    };

    await updateCity(cityId, {
      ...resourceUpdates,
      researchQueue: FieldValue.arrayUnion(newQueueItem),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updatedCity = await getCity(cityId);
    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error("Error starting research:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
