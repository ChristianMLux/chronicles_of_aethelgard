import { BuildingConfig, BuildingKey, ResourceKey } from "@/types";

export const BUILDING_CONFIG: BuildingConfig = {
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

export const BASE_BUILDING_COST: Record<
  BuildingKey,
  Partial<Record<ResourceKey, number>>
> = {
  quarry: { stone: 60, wood: 30 },
  sawmill: { wood: 60, stone: 30 },
  farm: { food: 60, wood: 30 },
  manamine: { mana: 60, stone: 40 },
  barracks: { stone: 80, wood: 80, food: 60 },
};
