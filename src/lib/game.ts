import { GameConfig, UnitConfig, UnitKey } from "@/types";

export type ResourceKey = "stone" | "wood" | "food" | "mana";

export type BuildingKey =
  | "sawmill"
  | "manamine"
  | "farm"
  | "quarry"
  | "barracks";

export const BUILDING_LIST: BuildingKey[] = [
  "quarry",
  "sawmill",
  "farm",
  "manamine",
  "barracks",
];

export const BUILDING_ICONS: Record<BuildingKey, string> = {
  quarry: "/assets/icons/buildings/quarry.png",
  sawmill: "/assets/icons/buildings/sawmill.png",
  farm: "/assets/icons/buildings/farm.png",
  manamine: "/assets/icons/buildings/manamine.png",
  barracks: "/assets/icons/buildings/barracks.png",
};

const BASE_BUILDING_COST: Record<
  BuildingKey,
  Partial<Record<ResourceKey, number>>
> = {
  quarry: { stone: 60, wood: 30 },
  sawmill: { wood: 60, stone: 30 },
  farm: { food: 60, wood: 30 },
  manamine: { mana: 60, stone: 40 },
  barracks: { stone: 80, wood: 80, food: 60 },
};

const unitBaseConfig: Record<
  UnitKey,
  Omit<UnitConfig, "name" | "description">
> = {
  swordsman: {
    costs: { wood: 20, food: 30, stone: 0, mana: 0 },
    recruitTime: 10,
    attack: 5,
    defense: 10,
  },
  archer: {
    costs: { wood: 30, food: 20, stone: 0, mana: 0 },
    recruitTime: 12,
    attack: 10,
    defense: 5,
  },
  knight: {
    costs: { wood: 50, food: 80, stone: 100, mana: 0 },
    recruitTime: 30,
    attack: 20,
    defense: 20,
  },
};
const unitDetails: Record<UnitKey, { name: string; description: string }> = {
  swordsman: {
    name: "Schwertkämpfer",
    description: "Eine solide Infanterieeinheit.",
  },
  archer: { name: "Bogenschütze", description: "Greift aus der Ferne an." },
  knight: {
    name: "Ritter",
    description: "Eine starke und teure Kavallerieeinheit.",
  },
};

const COST_GROWTH_FACTOR = 1.5;
const BASE_BUILD_TIME_SECONDS = 20;
const BUILD_TIME_GROWTH_FACTOR = 1.25;

export async function getGameConfig(): Promise<GameConfig> {
  const config: GameConfig = {
    buildings: {
      quarry: {},
      sawmill: {},
      farm: {},
      manamine: {},
      barracks: {},
    },
    units: {
      swordsman: {},
      archer: {},
      knight: {},
    },
  };

  const buildingKeys: BuildingKey[] = [
    "quarry",
    "sawmill",
    "farm",
    "manamine",
    "barracks",
  ];

  for (const building of buildingKeys) {
    for (let level = 1; level <= 20; level++) {
      const baseCost = BASE_BUILDING_COST[building];
      const cost: Partial<Record<ResourceKey, number>> = {};

      (Object.keys(baseCost) as ResourceKey[]).forEach((resource) => {
        const baseVal = baseCost[resource] ?? 0;
        cost[resource] = Math.floor(
          baseVal * Math.pow(COST_GROWTH_FACTOR, level - 1)
        );
      });

      config.buildings[building][level] = {
        level: level,
        cost: cost,
        constructionTime: Math.round(
          BASE_BUILD_TIME_SECONDS *
            Math.pow(BUILD_TIME_GROWTH_FACTOR, level - 1)
        ),
      };
    }
  }

  const unitKeys: UnitKey[] = ["swordsman", "archer", "knight"];
  for (const unit of unitKeys) {
    config.units[unit][1] = {
      ...unitBaseConfig[unit],
      ...unitDetails[unit],
    };
  }

  return config;
}

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
    cost[k] = Math.floor(baseVal * Math.pow(COST_GROWTH_FACTOR, nextLevel - 1));
  });
  return cost;
}

export function canAfford(
  available: Record<ResourceKey, number>,
  cost: Record<ResourceKey, number>
): boolean {
  return (Object.keys(cost) as ResourceKey[]).every(
    (k) => (available[k] ?? 0) >= (cost[k] ?? 0)
  );
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

export type ResearchKey =
  | "Blacksmithing"
  | "Armorsmithing"
  | "Enchanting"
  | "Logistics"
  | "Espionage"
  | "Administration";

export const RESEARCH_LIST: ResearchKey[] = [
  "Blacksmithing",
  "Armorsmithing",
  "Enchanting",
  "Logistics",
  "Espionage",
  "Administration",
];

const BASE_RESEARCH_COST_MANA = 100;
const RESEARCH_GROWTH_FACTOR = 1.6;

export function getResearchUpgradeCost(nextLevel: number): number {
  return Math.floor(
    BASE_RESEARCH_COST_MANA *
      Math.pow(RESEARCH_GROWTH_FACTOR, Math.max(0, nextLevel - 1))
  );
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

export function getResearchTimeSeconds(targetLevel: number): number {
  const base = 40;
  const factor = 1.3;
  return Math.round(base * Math.pow(factor, Math.max(0, targetLevel - 1)));
}

export interface BuildingLevelDetails {
  level: number;
  cost: Partial<Record<ResourceKey, number>>;
  buildTime: number; // in seconds
  description?: string;
}

export interface BuildingTypeConfig {
  name: string;
  icon: string;
  levels: Record<number, BuildingLevelDetails>;
}

export type BuildingConfig = Record<BuildingKey, BuildingTypeConfig>;

export const buildingConfig: BuildingConfig = {
  sawmill: {
    name: "Sägemühle",
    icon: "/assets/icons/buildings/sawmill.png",
    levels: {
      1: {
        level: 1,
        cost: { wood: 50, stone: 20 },
        buildTime: 25,
        description: "Produziert Holz.",
      },
      2: { level: 2, cost: { wood: 120, stone: 60 }, buildTime: 60 },
      3: { level: 3, cost: { wood: 250, stone: 150 }, buildTime: 150 },
    },
  },
  manamine: {
    name: "Manamine",
    icon: "/assets/icons/buildings/manamine.png",
    levels: {
      1: {
        level: 1,
        cost: { mana: 50, stone: 30 },
        buildTime: 30,
        description: "Fördert Mana.",
      },
      2: { level: 2, cost: { mana: 130, stone: 80 }, buildTime: 75 },
      3: { level: 3, cost: { mana: 280, stone: 180 }, buildTime: 180 },
    },
  },
  farm: {
    name: "Farm",
    icon: "/assets/icons/buildings/farm.png",
    levels: {
      1: {
        level: 1,
        cost: { food: 40, wood: 25 },
        buildTime: 20,
        description: "Erzeugt Nahrung.",
      },
      2: { level: 2, cost: { food: 100, wood: 70 }, buildTime: 50 },
      3: { level: 3, cost: { food: 220, wood: 160 }, buildTime: 130 },
    },
  },
  quarry: {
    name: "Steinbruch",
    icon: "/assets/icons/buildings/quarry.png",
    levels: {
      1: {
        level: 1,
        cost: { stone: 50, wood: 20 },
        buildTime: 25,
        description: "Baut Stein ab.",
      },
      2: { level: 2, cost: { stone: 120, wood: 60 }, buildTime: 60 },
      3: { level: 3, cost: { stone: 250, wood: 150 }, buildTime: 150 },
    },
  },
  barracks: {
    name: "Kaserne",
    icon: "/assets/icons/buildings/barracks.png",
    levels: {
      1: {
        level: 1,
        cost: { wood: 100, stone: 80 },
        buildTime: 60,
        description: "Ermöglicht die Rekrutierung von Einheiten.",
      },
      2: { level: 2, cost: { wood: 220, stone: 180 }, buildTime: 150 },
    },
  },
};
