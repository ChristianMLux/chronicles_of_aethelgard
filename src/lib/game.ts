export type ResourceKey = "stone" | "wood" | "food" | "mana";

export type BuildingKey =
  | "Steinbruch"
  | "Holzfällerlager"
  | "Farmen"
  | "Manamine";

export const BUILDING_LIST: BuildingKey[] = [
  "Steinbruch",
  "Holzfällerlager",
  "Farmen",
  "Manamine",
];

// Building icon mapping
export const BUILDING_ICONS: Record<BuildingKey, string> = {
  Steinbruch: "/assets/icons/buildings/quarry.png",
  Holzfällerlager: "/assets/icons/buildings/sawmill.png",
  Farmen: "/assets/icons/buildings/farm.png",
  Manamine: "/assets/icons/buildings/manamine.png",
};

// Base costs for level 1, escalates with factor per level
const BASE_BUILDING_COST: Record<BuildingKey, Partial<Record<ResourceKey, number>>> = {
  Steinbruch: { stone: 60, wood: 30 },
  Holzfällerlager: { wood: 60, stone: 30 },
  Farmen: { food: 60, wood: 30 },
  Manamine: { mana: 60, stone: 40 },
};

const COST_GROWTH_FACTOR = 1.5;

export function getBuildingUpgradeCost(
  building: BuildingKey,
  currentLevel: number,
): Record<ResourceKey, number> {
  const nextLevel = Math.max(1, currentLevel + 1);
  const base = BASE_BUILDING_COST[building];
  const cost: Record<ResourceKey, number> = { stone: 0, wood: 0, food: 0, mana: 0 };
  (Object.keys(base) as ResourceKey[]).forEach((k) => {
    const baseVal = base[k] ?? 0;
    cost[k] = Math.floor(baseVal * Math.pow(COST_GROWTH_FACTOR, nextLevel - 1));
  });
  return cost;
}

export function canAfford(
  available: Record<ResourceKey, number>,
  cost: Record<ResourceKey, number>,
): boolean {
  return (Object.keys(cost) as ResourceKey[]).every((k) => (available[k] ?? 0) >= (cost[k] ?? 0));
}

// Production increments per level upgrade (per hour)
export function getProductionDelta(building: BuildingKey): { Stein?: number; Holz?: number; Nahrung?: number; Mana?: number } {
  switch (building) {
    case "Steinbruch":
      return { Stein: 10 };
    case "Holzfällerlager":
      return { Holz: 10 };
    case "Farmen":
      return { Nahrung: 8 };
    case "Manamine":
      return { Mana: 2 };
    default:
      return {};
  }
}

export type ResearchKey =
  | "Schmiedekunst"
  | "Rüstungsschmiedekunst"
  | "Verzauberungskunst"
  | "Logistik"
  | "Spionage"
  | "Verwaltung";

export const RESEARCH_LIST: ResearchKey[] = [
  "Schmiedekunst",
  "Rüstungsschmiedekunst",
  "Verzauberungskunst",
  "Logistik",
  "Spionage",
  "Verwaltung",
];

const BASE_RESEARCH_COST_MANA = 100;
const RESEARCH_GROWTH_FACTOR = 1.6;

export function getResearchUpgradeCost(nextLevel: number): number {
  return Math.floor(BASE_RESEARCH_COST_MANA * Math.pow(RESEARCH_GROWTH_FACTOR, Math.max(0, nextLevel - 1)));
}

// Simple time models (seconds)
export function getBuildTimeSeconds(building: BuildingKey, targetLevel: number): number {
  const level = Math.max(1, targetLevel);
  const base = 20; // seconds baseline
  const factor = 1.25;
  return Math.round(base * Math.pow(factor, level - 1));
}

export function getResearchTimeSeconds(targetLevel: number): number {
  const base = 40; // seconds baseline
  const factor = 1.3;
  return Math.round(base * Math.pow(factor, Math.max(0, targetLevel - 1)));
}

export const numberFmt = new Intl.NumberFormat("de-DE");



