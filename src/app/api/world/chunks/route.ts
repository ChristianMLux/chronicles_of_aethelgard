import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import { Tile } from "@/types";
import { GAME_CONSTANTS } from "@/config/game.constants";

/**
 * API handler to fetch a "chunk" of the world map.
 * A chunk is a square grid of tiles (e.g., 20x20).
 * @param req - The Next.js API request object.
 * Expects query parameters `x` and `y` for the chunk coordinates.
 */
export async function GET(req: NextRequest) {
  try {
    getAdminApp();
    const db = getFirestore();

    // 1. Get and validate query parameters
    const { searchParams } = req.nextUrl;
    const chunkXStr = searchParams.get("x");
    const chunkYStr = searchParams.get("y");

    if (chunkXStr === null || chunkYStr === null) {
      return NextResponse.json(
        { error: "Missing chunk coordinates x and y." },
        { status: 400 }
      );
    }

    const chunkX = parseInt(chunkXStr, 10);
    const chunkY = parseInt(chunkYStr, 10);

    if (isNaN(chunkX) || isNaN(chunkY)) {
      return NextResponse.json(
        { error: "Invalid chunk coordinates. Must be numbers." },
        { status: 400 }
      );
    }

    // 2. Calculate the tile coordinate range for the query
    const startX = chunkX * GAME_CONSTANTS.CHUNK_SIZE;
    const endX = startX + GAME_CONSTANTS.CHUNK_SIZE;
    const startY = chunkY * GAME_CONSTANTS.CHUNK_SIZE;
    const endY = startY + GAME_CONSTANTS.CHUNK_SIZE;

    // 3. Construct and execute the Firestore query
    const worldCollection = db.collection("world");
    const query = worldCollection
      .where("coords.x", ">=", startX)
      .where("coords.x", "<", endX)
      .where("coords.y", ">=", startY)
      .where("coords.y", "<", endY);

    const snapshot = await query.get();

    if (snapshot.empty) {
      // It's not an error if a chunk is empty, just return an empty array
      return NextResponse.json([], { status: 200 });
    }

    // 4. Map the documents to a Tile array
    const tiles = snapshot.docs.map((doc) => doc.data() as Tile);

    // 5. Return the chunk data
    return NextResponse.json(tiles, { status: 200 });
  } catch (error) {
    console.error("Error fetching world chunk:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
