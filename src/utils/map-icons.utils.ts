import L from "leaflet";
import {
  MAP_ICON_CONFIG,
  RESOURCE_ICON_CONFIG,
} from "@/config/map-icons.config";
import { ResourceType, Tile } from "@/types";

export const cityIcon = L.icon(MAP_ICON_CONFIG.city);
export const enemyIcon = L.icon(MAP_ICON_CONFIG.enemy);

export const resourceIcons: Record<ResourceType, L.Icon> = Object.entries(
  RESOURCE_ICON_CONFIG
).reduce((acc, [key, config]) => {
  acc[key as ResourceType] = L.icon(config);
  return acc;
}, {} as Record<ResourceType, L.Icon>);

export const createMapIcons = () => ({
  cityIcon: L.icon(MAP_ICON_CONFIG.city),
  enemyIcon: L.icon(MAP_ICON_CONFIG.enemy),
  resourceIcons: Object.entries(RESOURCE_ICON_CONFIG).reduce(
    (acc, [key, config]) => {
      acc[key as ResourceType] = L.icon(config);
      return acc;
    },
    {} as Record<ResourceType, L.Icon>
  ),
});

export const getIconForTile = (tile: Tile) => {
  switch (tile.type) {
    case "city":
      return cityIcon;
    case "npc_camp":
      return enemyIcon;
    case "resource":
      return tile.resourceType ? resourceIcons[tile.resourceType] : null;
    default:
      return null;
  }
};
