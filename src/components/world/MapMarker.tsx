"use client";

import { useState, useEffect } from "react";
import { Marker, Tooltip } from "react-leaflet";
import { useMap } from "react-leaflet/hooks";
import { Tile } from "@/types";
import L, { LatLngBounds } from "leaflet";
import { getIconForTile } from "@/utils/map-icons.utils";

export default function MapMarkers({
  tiles,
  onTileClick,
}: {
  tiles: Tile[];
  onTileClick: (tile: Tile) => void;
}) {
  const map = useMap();
  const [visibleMarkers, setVisibleMarkers] = useState<Tile[]>([]);
  const [iconSize, setIconSize] = useState(32);

  useEffect(() => {
    const updateMarkers = () => {
      const center = map.getCenter();
      const point1 = map.latLngToContainerPoint(center);
      const point2 = map.latLngToContainerPoint({
        lat: center.lat,
        lng: center.lng + 1,
      });
      const size = Math.abs(point2.x - point1.x) * 0.95;

      const clampedSize = Math.max(12, Math.min(size, 48));
      setIconSize(clampedSize);

      if (!tiles || tiles.length === 0) {
        setVisibleMarkers([]);
        return;
      }
      const bounds = map.getBounds();
      const paddedBounds = bounds.pad(0.2);

      const newVisibleMarkers = tiles.filter((tile) => {
        if (tile.type === "empty") return false;

        const tileBounds = new LatLngBounds(
          [-tile.coords.y - 1, tile.coords.x],
          [-tile.coords.y, tile.coords.x + 1]
        );
        return paddedBounds.intersects(tileBounds);
      });
      setVisibleMarkers(newVisibleMarkers);
    };

    map.on("zoomend", updateMarkers);
    map.on("moveend", updateMarkers);

    updateMarkers();

    return () => {
      map.off("zoomend", updateMarkers);
      map.off("moveend", updateMarkers);
    };
  }, [map, tiles]);

  return (
    <>
      {visibleMarkers.map((tile) => {
        const baseIcon = getIconForTile(tile);
        if (!baseIcon) return null;

        const scaledIcon = L.icon({
          ...baseIcon.options,
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize / 2, iconSize / 2],
        });

        const position: [number, number] = [
          -tile.coords.y - 0.5,
          tile.coords.x + 0.5,
        ];

        return (
          <Marker
            key={`${tile.id}-marker`}
            position={position}
            icon={scaledIcon}
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
