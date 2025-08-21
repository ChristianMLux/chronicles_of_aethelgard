import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/user";
import { getCities } from "@/lib/city";
import { getAdminApp } from "@/lib/firebase-admin";
import { Tile } from "@/types";

/**
 * API handler to settle a player's first city on the world map.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tileId, cityId } = await req.json();
    if (!tileId || !cityId) {
      return NextResponse.json(
        { error: "Missing tileId or cityId in request body." },
        { status: 400 }
      );
    }

    getAdminApp();
    const db = getFirestore();

    // 1. Validate that the user owns the city and doesn't have a settled city yet
    const playerCities = await getCities(user.uid);
    const cityToSettle = playerCities.find((c) => c.id === cityId);

    if (!cityToSettle) {
      return NextResponse.json(
        { error: "City not found or does not belong to the user." },
        { status: 403 }
      );
    }

    const hasAlreadySettled = playerCities.some((c) => c.tileId);
    if (hasAlreadySettled) {
      return NextResponse.json(
        { error: "You have already settled a city on the map." },
        { status: 403 }
      );
    }

    // 2. Use a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const worldTileRef = db.collection("world").doc(tileId);
      const cityRef = db
        .collection("users")
        .doc(user.uid)
        .collection("cities")
        .doc(cityId);

      const worldTileDoc = await transaction.get(worldTileRef);

      if (!worldTileDoc.exists) {
        throw new Error("Target tile does not exist.");
      }

      const tileData = worldTileDoc.data() as Tile;

      // 3. Final validation inside the transaction
      if (tileData.type !== "empty") {
        throw new Error("Tile is not empty and cannot be settled.");
      }

      // 4. Perform the updates
      transaction.update(worldTileRef, {
        type: "city",
        ownerId: user.uid,
        cityId: cityId,
      });

      transaction.update(cityRef, {
        tileId: tileId,
      });
    });

    return NextResponse.json(
      { message: "City settled successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error settling city:", error);
    if (
      (error as Error).message === "Tile is not empty and cannot be settled."
    ) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
