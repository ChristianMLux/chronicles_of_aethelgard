import "dotenv/config";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import { resolve } from "path";
import { getFirestore, WriteBatch } from "firebase-admin/firestore";

// ==================== CONFIGURATION ====================
const WORLD_CONFIG = {
  worldSize: 40,
  continentId: "aethelgard",
  continentName: "Aethelgard",
  zones: {
    outer: {
      radiusPercent: 0.6,
      resourceDensity: 0.3,
      npcLevel: [1, 3],
      npcDensity: 0.05,
    },
    middle: {
      radiusPercent: 0.3,
      resourceDensity: 0.4,
      npcLevel: [4, 6],
      npcDensity: 0.1,
    },
    center: {
      radiusPercent: 0.1,
      resourceDensity: 0.5,
      npcLevel: [7, 10],
      npcDensity: 0.15,
    },
  },
  terrain: {
    weights: {
      plains: 60,
      forest: 40,
      mountains: 0,
      water: 0,
      desert: 0,
    },
    waterBodies: {
      count: 1,
      minSize: 5,
      maxSize: 15,
    },
    mountainRanges: {
      count: 1,
      minSize: 4,
      maxSize: 10,
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

export interface Location {
  region: string;
  continent: string;
  territory: string;
  continentName: string;
  territoryName: string;
}

interface Tile {
  id: string;
  coords: { x: number; y: number };
  location: Location;
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
    if (random < weights[key as T]) return key as T;
    random -= weights[key as T];
  }
  return Object.keys(weights)[0] as T;
};
const getRegion = (
  x: number,
  y: number,
  centerX: number,
  centerY: number
): string => {
  if (x >= centerX && y < centerY) return "North-East";
  if (x < centerX && y < centerY) return "North-West";
  if (x < centerX && y >= centerY) return "South-West";
  return "South-East";
};
async function clearFirestoreCollection(
  db: admin.firestore.Firestore,
  collectionPath: string,
  batchSize = 400
) {
  const collectionRef = db.collection(collectionPath);
  const querySnapshot = await collectionRef.get();

  if (querySnapshot.size === 0) {
    console.log(`Collection '${collectionPath}' is already empty.`);
    return;
  }

  console.log(
    `Deleting ${querySnapshot.size} documents from '${collectionPath}'...`
  );

  const batchArray: WriteBatch[] = [];
  batchArray.push(db.batch());
  let operationCount = 0;

  querySnapshot.forEach((doc) => {
    batchArray[batchArray.length - 1].delete(doc.ref);
    operationCount++;

    if (operationCount === batchSize) {
      batchArray.push(db.batch());
      operationCount = 0;
    }
  });

  await Promise.all(batchArray.map((batch) => batch.commit()));
  console.log(`✅ Collection '${collectionPath}' has been cleared.`);
}

async function resetCityLocations(db: admin.firestore.Firestore) {
  const citiesRef = db.collection("cities");
  const snapshot = await citiesRef.get();

  if (snapshot.empty) {
    console.log("No cities found to reset.");
    return;
  }

  console.log(`Resetting location for ${snapshot.size} cities...`);
  const batch = db.batch();
  snapshot.forEach((cityDoc) => {
    const cityData = cityDoc.data();
    delete cityData.tileId;
    batch.set(cityDoc.ref, cityData);
  });

  await batch.commit();
  console.log("✅ All city locations have been reset.");
}

async function clearPreviousWorldData(db: admin.firestore.Firestore) {
  console.log("\n--- Starting World Data Reset ---");
  await clearFirestoreCollection(db, "world");
  await clearFirestoreCollection(db, "worldMissions");
  await resetCityLocations(db);
  console.log("--- ✅ World Data Reset Complete ---\n");
}

// ==================== WORLD FEATURE GENERATION ====================
function placeOrganicFeatures(
  tiles: Tile[][],
  featureType: "water" | "mountains"
) {
  const { worldSize } = WORLD_CONFIG;
  const config =
    featureType === "water"
      ? WORLD_CONFIG.terrain.waterBodies
      : WORLD_CONFIG.terrain.mountainRanges;

  for (let i = 0; i < config.count; i++) {
    const centerX = getRandomInt(10, worldSize - 10);
    const centerY = getRandomInt(10, worldSize - 10);
    const targetSize = getRandomInt(config.minSize, config.maxSize);

    const queue = [{ x: centerX, y: centerY, distance: 0 }];
    const visited = new Set<string>();
    let placed = 0;

    while (queue.length > 0 && placed < targetSize) {
      const idx = Math.floor(Math.random() * Math.min(5, queue.length));
      const { x, y, distance } = queue.splice(idx, 1)[0];
      const key = `${x},${y}`;

      if (visited.has(key) || distance > 15) continue;
      visited.add(key);

      const placeProbability = Math.exp(-distance * 0.2);

      const canPlace =
        featureType === "water"
          ? tiles[y][x].terrain !== "mountains"
          : tiles[y][x].terrain === "plains" ||
            tiles[y][x].terrain === "forest";

      if (Math.random() < placeProbability && canPlace) {
        tiles[y][x].terrain = featureType;
        tiles[y][x].type = "empty";
        placed++;

        const neighbors = [
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, 0],
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
        ];

        for (const [dx, dy] of neighbors) {
          const nx = x + dx,
            ny = y + dy;
          if (nx >= 0 && nx < worldSize && ny >= 0 && ny < worldSize) {
            const neighborKey = `${nx},${ny}`;
            if (!visited.has(neighborKey)) {
              queue.push({ x: nx, y: ny, distance: distance + 1 });
            }
          }
        }
      }
    }
  }
}

// ==================== CORE GENERATION LOGIC ====================
export function generateWorld() {
  const { worldSize } = WORLD_CONFIG;
  const center = { x: Math.floor(worldSize / 2), y: Math.floor(worldSize / 2) };
  const tiles: Tile[][] = Array(worldSize)
    .fill(null)
    .map(() => Array(worldSize).fill(null));
  const validStartPositions: { x: number; y: number }[] = [];

  // PASS 1: Initialize all Base Tiles
  for (let y = 0; y < worldSize; y++) {
    for (let x = 0; x < worldSize; x++) {
      const zone: ZoneType = "outer";
      const location: Location = {
        region: getRegion(x, y, center.x, center.y),
        continent: WORLD_CONFIG.continentId,
        territory: zone,
        continentName: WORLD_CONFIG.continentName,
        territoryName: zone.charAt(0).toUpperCase() + zone.slice(1),
      };
      tiles[y][x] = {
        id: getTileId(x, y),
        coords: { x, y },
        location,
        terrain: "plains",
        type: "empty",
        zone,
      };
    }
  }

  // PASS 2: Place mountain-ranges
  placeOrganicFeatures(tiles, "mountains");

  // PASS 3: Place water-features
  placeOrganicFeatures(tiles, "water");

  // PASS 4: fill all other tiles
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
      tiles[y][x].zone = zone;
      tiles[y][x].location.territory = zone;
      tiles[y][x].location.territoryName =
        zone.charAt(0).toUpperCase() + zone.slice(1);

      if (
        tiles[y][x].terrain === "water" ||
        tiles[y][x].terrain === "mountains"
      ) {
        continue;
      }

      tiles[y][x].terrain = getWeightedRandom(WORLD_CONFIG.terrain.weights);

      if (Math.random() < zoneConfig.npcDensity) {
        const npcLevel = getRandomInt(
          zoneConfig.npcLevel[0],
          zoneConfig.npcLevel[1]
        ) as keyof typeof WORLD_CONFIG.npcTroops;
        tiles[y][x] = {
          ...tiles[y][x],
          type: "npc_camp",
          npcLevel,
          npcTroops: WORLD_CONFIG.npcTroops[npcLevel],
        };
      } else if (Math.random() < zoneConfig.resourceDensity) {
        tiles[y][x] = {
          ...tiles[y][x],
          type: "resource",
          resourceType: getWeightedRandom(WORLD_CONFIG.resources.weights),
          resourceAmount: getRandomInt(
            WORLD_CONFIG.resources.amountRange[0],
            WORLD_CONFIG.resources.amountRange[1]
          ),
        };
      } else {
        if (zone === "outer") {
          validStartPositions.push({ x, y });
        }
      }
    }
  }

  return { tiles, validStartPositions };
}

// ==================== FIRESTORE UPLOAD ====================
async function uploadWorldToFirestore(
  db: admin.firestore.Firestore,
  tiles: Tile[][]
) {
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

// ==================== SCRIPT EXECUTION (AKTUALISIERT) ====================
async function main() {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.error(
      "Firebase Admin credentials not found in environment variables."
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
  const db = getFirestore();

  console.log(
    "\n⚠️  WARNING: This will DELETE ALL existing world data (tiles, missions, city locations) and generate a new world!"
  );
  console.log("This action cannot be undone.");
  console.log("Press Ctrl+C to cancel, or wait 10 seconds to continue...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  await clearPreviousWorldData(db);

  console.log("Starting new world generation...");
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

  await uploadWorldToFirestore(db, tiles);
}

const isMainModule = (url: string, argv1: string) => {
  const mainModulePath = resolve(process.cwd(), argv1);
  const currentModulePath = fileURLToPath(url);
  return mainModulePath === currentModulePath;
};

if (isMainModule(import.meta.url, process.argv[1])) {
  main().catch(console.error);
}
