import { generateWorld } from "./generateWorld.ts";
import * as fs from "fs";
import * as path from "path";

/**
 * generates the world in memory,
 * provides detailed statistics,
 * and creates a visual HTML map preview
 * without touching the database.
 */
function runWorldGenerationTest() {
  console.log("🚀 Starting world generation test...");

  // 1. Generate the world data
  const { tiles } = generateWorld();
  const flatTiles = tiles.flat();

  // 2. Prepare statistics objects
  const stats = {
    total: flatTiles.length,
    types: { empty: 0, resource: 0, npc_camp: 0, city: 0, ruins: 0 },
    terrains: { plains: 0, forest: 0, mountains: 0, water: 0, desert: 0 },
    zones: {
      outer: { total: 0, resources: 0, npcs: 0 },
      middle: { total: 0, resources: 0, npcs: 0 },
      center: { total: 0, resources: 0, npcs: 0 },
    },
    resources: { food: 0, wood: 0, stone: 0, mana: 0 },
  };

  // 3. Analyze every single tile
  for (const tile of flatTiles) {
    stats.types[tile.type]++;
    stats.terrains[tile.terrain]++;
    stats.zones[tile.zone].total++;
    if (tile.type === "resource" && tile.resourceType) {
      stats.zones[tile.zone].resources++;
      stats.resources[tile.resourceType]++;
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
  console.log("--- Zone Analysis ---");
  console.table(stats.zones);

  console.log("\n--- Generating Visual Map Preview ---");

  const htmlContent = generateMapHtml(tiles);
  const outputPath = path.resolve(process.cwd(), "map.html");

  try {
    fs.writeFileSync(outputPath, htmlContent);
    console.log(`\n✅ HTML map generated successfully!`);
    console.log(`   Please open the file: ${outputPath}`);
  } catch (error) {
    console.error("\n❌ Error generating HTML map:", error);
  }

  console.log(
    "\n\n💡 To change the distribution, edit WORLD_CONFIG in `generateWorld.ts` and run this test again."
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateMapHtml(tiles: any[][]): string {
  const worldSize = tiles.length;
  const tileSize = 10;

  const terrainColors: { [key: string]: string } = {
    plains: "#8db600",
    forest: "#228b22",
    mountains: "#8b4513",
    water: "#4682b4",
    desert: "#f0e68c",
  };

  let mapHtml = "";
  for (let y = 0; y < worldSize; y++) {
    for (let x = 0; x < worldSize; x++) {
      const tile = tiles[y][x];
      const color = terrainColors[tile.terrain] || "#ffffff";
      let content = "";
      if (tile.type === "npc_camp") {
        content = "C";
      } else if (tile.type === "resource") {
        content = "R";
      }

      mapHtml += `<div class="tile" style="background-color: ${color}; top: ${
        y * tileSize
      }px; left: ${x * tileSize}px;">${content}</div>`;
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Aethelgard - World Map Preview</title>
        <style>
            body { 
                background-color: #1a1a1a; 
                margin: 0; 
                overflow: hidden;
                font-family: sans-serif;
            }
            #map-container {
                width: 100vw;
                height: 100vh;
                position: relative;
                transform-origin: 0 0;
            }
            .tile {
                width: ${tileSize}px;
                height: ${tileSize}px;
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                color: white;
                font-weight: bold;
                text-shadow: 1px 1px 1px black;
                box-sizing: border-box;
                border: 1px solid rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <div id="map-container">
            ${mapHtml}
        </div>
        <script>
            const container = document.getElementById('map-container');
            let scale = 1;
            let panning = false;
            let pointX = 0;
            let pointY = 0;
            let start = { x: 0, y: 0 };

            function setTransform() {
                container.style.transform = \`translate(\${pointX}px, \${pointY}px) scale(\${scale})\`;
            }

            container.onmousedown = function (e) {
                e.preventDefault();
                start = { x: e.clientX - pointX, y: e.clientY - pointY };
                panning = true;
            };

            container.onmouseup = function () {
                panning = false;
            };

            container.onmousemove = function (e) {
                if (!panning) return;
                pointX = e.clientX - start.x;
                pointY = e.clientY - start.y;
                setTransform();
            };

            container.onwheel = function (e) {
                e.preventDefault();
                const xs = (e.clientX - pointX) / scale;
                const ys = (e.clientY - pointY) / scale;
                const delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);
                (delta > 0) ? (scale *= 1.2) : (scale /= 1.2);
                pointX = e.clientX - xs * scale;
                pointY = e.clientY - ys * scale;
                setTransform();
            };
        </script>
    </body>
    </html>
  `;
}

runWorldGenerationTest();
