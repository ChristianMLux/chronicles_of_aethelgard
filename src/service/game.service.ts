import { BASE_BUILDING_COST } from "@/config/buildings.config";
import { GAME_CONSTANTS } from "@/config/game.constants";
import { BuildingKey, ResourceKey } from "@/types";

export function getBuildingUpgradeCost(
  building: BuildingKey,
  currentLevel: number
): Record<ResourceKey, number> {
  const nextLevel = Math.max(1, currentLevel + 1);
  const base = BASE_BUILDING_COST[building];
  const cost: Record<ResourceKey, number> = {
    stone: 0,
    wood: 0,
    food: 0,
    mana: 0,
  };
  (Object.keys(base) as ResourceKey[]).forEach((k) => {
    const baseVal = base[k] ?? 0;
    cost[k] = Math.floor(
      baseVal * Math.pow(GAME_CONSTANTS.COST_GROWTH_FACTOR, nextLevel - 1)
    );
  });
  return cost;
}

export function getProductionDelta(building: BuildingKey): {
  Stein?: number;
  Holz?: number;
  Nahrung?: number;
  Mana?: number;
} {
  switch (building) {
    case "quarry":
      return { Stein: 10 };
    case "sawmill":
      return { Holz: 10 };
    case "farm":
      return { Nahrung: 8 };
    case "manamine":
      return { Mana: 2 };
    default:
      return {};
  }
}

export function getBuildTimeSeconds(
  building: BuildingKey,
  targetLevel: number
): number {
  const level = Math.max(1, targetLevel);
  const base = 20;
  const factor = 1.25;
  return Math.round(base * Math.pow(factor, level - 1));
}
