import { Tile } from "@/types";
import { getIconForTile } from "@/utils/map-icons.utils";
import { Marker, Tooltip } from "react-leaflet";

export default function MapMarkers({
  tiles,
  onTileClick,
}: {
  tiles: Tile[];
  onTileClick: (tile: Tile) => void;
}) {
  return (
    <>
      {tiles.map((tile) => {
        const icon = getIconForTile(tile);
        if (!icon) return null;

        const position: [number, number] = [
          -tile.coords.y - 0.5,
          tile.coords.x + 0.5,
        ];

        return (
          <Marker
            key={`${tile.id}-marker`}
            position={position}
            icon={icon}
            eventHandlers={{ click: () => onTileClick(tile) }}
          >
            <Tooltip>
              {tile.type === "npc_camp" && `NPC Camp (Lvl ${tile.npcLevel})`}
              {tile.type === "resource" &&
                `${tile.resourceType} (${tile.resourceAmount})`}
              {tile.type === "city" && `City`}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
