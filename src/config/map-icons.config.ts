import { ResourceType } from "@/types";

export const MAP_ICON_CONFIG = {
  city: {
    iconUrl: "/assets/icons/world/city/city_world_map_icon.png",
    iconSize: [40, 40] as [number, number],
    iconAnchor: [20, 20] as [number, number],
  },
  enemy: {
    iconUrl: "/assets/icons/world/enemy/enemy_camp_icon.png",
    iconSize: [32, 32] as [number, number],
    iconAnchor: [16, 16] as [number, number],
  },
};

export const RESOURCE_ICON_CONFIG: Record<
  ResourceType,
  {
    iconUrl: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
  }
> = {
  food: {
    iconUrl: "/assets/icons/resources/food.png",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  },
  wood: {
    iconUrl: "/assets/icons/resources/wood.png",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  },
  stone: {
    iconUrl: "/assets/icons/resources/stone.png",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  },
  mana: {
    iconUrl: "/assets/icons/resources/mana.png",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  },
};
