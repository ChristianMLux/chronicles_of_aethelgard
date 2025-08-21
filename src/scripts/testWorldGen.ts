import { generateWorld } from "./generateWorld.ts";

/**
 * This is our test runner. It generates the world in memory
 * and provides detailed statistics without touching the database.
 */
function runWorldGenerationTest() {
  console.log("🚀 Starting world generation test...");

  // 1. Generate the world data
  const { tiles } = generateWorld();
  const flatTiles = tiles.flat();

  // 2. Prepare statistics objects
  const stats = {
    total: flatTiles.length,
    types: {
      empty: 0,
      resource: 0,
      npc_camp: 0,
      city: 0,
      ruins: 0,
    },
    terrains: {
      plains: 0,
      forest: 0,
      mountains: 0,
      water: 0,
      desert: 0,
    },
    zones: {
      outer: { total: 0, resources: 0, npcs: 0 },
      middle: { total: 0, resources: 0, npcs: 0 },
      center: { total: 0, resources: 0, npcs: 0 },
    },
    resources: {
      food: 0,
      wood: 0,
      stone: 0,
      mana: 0,
    },
  };

  // 3. Analyze every single tile
  for (const tile of flatTiles) {
    stats.types[tile.type]++;
    stats.terrains[tile.terrain]++;
    stats.zones[tile.zone].total++;

    if (tile.type === "resource") {
      stats.zones[tile.zone].resources++;
      if (tile.resourceType) {
        stats.resources[tile.resourceType]++;
      }
    }
    if (tile.type === "npc_camp") {
      stats.zones[tile.zone].npcs++;
    }
  }

  // 4. Display the results in a readable format
  console.log("\n✅ Test complete. Here are the results:\n");

  console.log("--- General Distribution ---");
  console.table(stats.types);

  console.log("--- Terrain Distribution ---");
  console.table(stats.terrains);

  console.log("--- Resource Type Distribution ---");
  console.table(stats.resources);

  console.log("--- Zone Analysis ---");
  console.table(stats.zones);

  // 5. Show some example tiles for verification
  console.log("\n--- Example Tiles ---");
  const resourceExample = flatTiles.find((t) => t.type === "resource");
  const npcExample = flatTiles.find((t) => t.type === "npc_camp");

  console.log("\nResource Tile Example:");
  console.log(resourceExample || "No resource tiles found.");

  console.log("\nNPC Camp Example:");
  console.log(npcExample || "No NPC camps found.");

  console.log(
    "\n\n💡 To change the distribution, edit WORLD_CONFIG in `generateWorld.ts` and run this test again."
  );
}

runWorldGenerationTest();
