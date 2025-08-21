import "dotenv/config";

import admin from "firebase-admin";
import { fileURLToPath } from "url";
import { resolve } from "path";

// ==================== CONFIGURATION ====================
const WORLD_CONFIG = {
  worldSize: 20,
  // --------------------------
  continentId: "aethelgard",
  continentName: "Aethelgard",
  zones: {
    outer: {
      radiusPercent: 0.6, // 60% of radius = outer zone
      resourceDensity: 0.3,
      npcLevel: [1, 3],
      npcDensity: 0.05,
    },
    middle: {
      radiusPercent: 0.3, // 30% = middle zone
      resourceDensity: 0.4,
      npcLevel: [4, 6],
      npcDensity: 0.1,
    },
    center: {
      radiusPercent: 0.1, // 10% = center zone
      resourceDensity: 0.5,
      npcLevel: [7, 10],
      npcDensity: 0.15,
    },
  },
  terrain: {
    weights: {
      plains: 60,
      forest: 25,
      mountains: 10,
      water: 5,
      desert: 0,
    },
  },
  resources: {
    weights: {
      food: 40,
      wood: 30,
      stone: 20,
      mana: 10,
    },
    amountRange: [500, 2000],
  },
  npcTroops: {
    1: { swordsman: 10, archer: 5, knight: 0 },
    2: { swordsman: 20, archer: 10, knight: 0 },
    3: { swordsman: 40, archer: 20, knight: 5 },
    4: { swordsman: 80, archer: 40, knight: 10 },
    5: { swordsman: 120, archer: 60, knight: 20 },
    6: { swordsman: 180, archer: 90, knight: 30 },
    7: { swordsman: 250, archer: 125, knight: 50 },
    8: { swordsman: 350, archer: 175, knight: 75 },
    9: { swordsman: 500, archer: 250, knight: 100 },
    10: { swordsman: 700, archer: 350, knight: 150 },
  },
};

// ==================== TYPE DEFINITIONS ====================
type TerrainType = "plains" | "forest" | "mountains" | "water" | "desert";
type TileType = "empty" | "city" | "resource" | "npc_camp" | "ruins";
type ZoneType = "outer" | "middle" | "center";
type ResourceType = "food" | "wood" | "stone" | "mana";

interface Tile {
  id: string;
  coords: { x: number; y: number };
  type: TileType;
  terrain: TerrainType;
  zone: ZoneType;
  ownerId?: string;
  cityId?: string;
  npcCampId?: string;
  resourceType?: ResourceType;
  resourceAmount?: number;
  npcLevel?: number;
  npcTroops?: {
    swordsman: number;
    archer: number;
    knight: number;
  };
}

// ==================== HELPER FUNCTIONS ====================
const getTileId = (x: number, y: number) =>
  `${WORLD_CONFIG.continentId}_${x.toString().padStart(3, "0")}_${y
    .toString()
    .padStart(3, "0")}`;

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getWeightedRandom = <T extends string>(weights: Record<T, number>): T => {
  const totalWeight = (Object.values(weights) as number[]).reduce(
    (sum, w) => sum + w,
    0
  );
  let random = Math.random() * totalWeight;
  for (const key in weights) {
    if (random < weights[key as T]) {
      return key as T;
    }
    random -= weights[key as T];
  }
  return Object.keys(weights)[0] as T; // Fallback
};

// ==================== CORE GENERATION LOGIC ====================
export function generateWorld() {
  const { worldSize } = WORLD_CONFIG;
  const center = { x: Math.floor(worldSize / 2), y: Math.floor(worldSize / 2) };
  const tiles: Tile[][] = Array(worldSize)
    .fill(null)
    .map(() => Array(worldSize).fill(null));

  const validStartPositions: { x: number; y: number }[] = [];

  for (let y = 0; y < worldSize; y++) {
    for (let x = 0; x < worldSize; x++) {
      const distanceToCenter = Math.sqrt(
        (x - center.x) ** 2 + (y - center.y) ** 2
      );
      const radiusPercent = distanceToCenter / (worldSize / 2);

      let zone: ZoneType;
      let zoneConfig;

      if (radiusPercent <= WORLD_CONFIG.zones.center.radiusPercent) {
        zone = "center";
        zoneConfig = WORLD_CONFIG.zones.center;
      } else if (radiusPercent <= WORLD_CONFIG.zones.middle.radiusPercent) {
        zone = "middle";
        zoneConfig = WORLD_CONFIG.zones.middle;
      } else {
        zone = "outer";
        zoneConfig = WORLD_CONFIG.zones.outer;
      }

      const baseTile: Omit<Tile, "type"> = {
        id: getTileId(x, y),
        coords: { x, y },
        terrain: getWeightedRandom(WORLD_CONFIG.terrain.weights),
        zone,
      };

      if (baseTile.terrain === "mountains" || baseTile.terrain === "water") {
        tiles[y][x] = { ...baseTile, type: "empty" };
        continue;
      }

      if (Math.random() < zoneConfig.npcDensity) {
        const npcLevel = getRandomInt(
          zoneConfig.npcLevel[0],
          zoneConfig.npcLevel[1]
        ) as keyof typeof WORLD_CONFIG.npcTroops;
        tiles[y][x] = {
          ...baseTile,
          type: "npc_camp",
          npcLevel,
          npcTroops: WORLD_CONFIG.npcTroops[npcLevel],
        };
      } else if (Math.random() < zoneConfig.resourceDensity) {
        tiles[y][x] = {
          ...baseTile,
          type: "resource",
          resourceType: getWeightedRandom(WORLD_CONFIG.resources.weights),
          resourceAmount: getRandomInt(
            WORLD_CONFIG.resources.amountRange[0],
            WORLD_CONFIG.resources.amountRange[1]
          ),
        };
      } else {
        tiles[y][x] = { ...baseTile, type: "empty" };
        if (zone === "outer") {
          validStartPositions.push({ x, y });
        }
      }
    }
  }

  return {
    tiles,
    validStartPositions,
  };
}

// ==================== FIRESTORE UPLOAD ====================
async function uploadWorldToFirestore(tiles: Tile[][]) {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.error(
      "Firebase Admin credentials not found in environment variables. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
    );
    return;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  const db = admin.firestore();
  const batchSize = 400;
  const flatTiles = tiles.flat();

  console.log(`Starting Firestore upload of ${flatTiles.length} tiles...`);

  for (let i = 0; i < flatTiles.length; i += batchSize) {
    const batch = db.batch();
    const chunk = flatTiles.slice(i, i + batchSize);

    chunk.forEach((tile) => {
      const docRef = db.collection("world").doc(tile.id);
      batch.set(docRef, tile);
    });

    await batch.commit();
    console.log(
      `Uploaded batch ${i / batchSize + 1} of ${Math.ceil(
        flatTiles.length / batchSize
      )}`
    );
  }

  console.log("✅ Firestore upload complete!");
}

// ==================== SCRIPT EXECUTION (for direct run) ====================
async function main() {
  console.log("Starting world generation...");
  const { tiles, validStartPositions } = generateWorld();

  console.log("✨ World generation complete!");
  console.log(`📊 Statistics:`);
  console.log(
    `  - Total tiles: ${WORLD_CONFIG.worldSize * WORLD_CONFIG.worldSize}`
  );
  console.log(
    `  - Resource tiles: ${
      tiles.flat().filter((t) => t.type === "resource").length
    }`
  );
  console.log(
    `  - NPC camps: ${tiles.flat().filter((t) => t.type === "npc_camp").length}`
  );
  console.log(`  - Valid start positions: ${validStartPositions.length}`);

  console.log(
    "\n⚠️  WARNING: This will upload the generated world to Firestore!"
  );
  console.log("This will overwrite existing data in the 'world' collection.");
  console.log("Press Ctrl+C to cancel, or wait 10 seconds to continue...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  await uploadWorldToFirestore(tiles);
}

const isMainModule = (importMetaUrl: string, argv1: string) => {
  const mainModulePath = resolve(process.cwd(), argv1);
  const currentModulePath = fileURLToPath(importMetaUrl);
  return mainModulePath === currentModulePath;
};

if (isMainModule(import.meta.url, process.argv[1])) {
  main().catch(console.error);
}
