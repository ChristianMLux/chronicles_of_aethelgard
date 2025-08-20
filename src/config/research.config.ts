import { ResearchKey } from "@/types";

export interface ResearchLevelDetails {
  level: number;
  cost: {
    wood: number;
    stone: number;
    food: number;
    mana: number;
  };
  researchTime: number;
  description?: string;
}

export interface ResearchTypeConfig {
  name: string;
  description: string;
  icon: string;
  levels: Record<number, ResearchLevelDetails>;
}

export const RESEARCH_CONFIG: Record<ResearchKey, ResearchTypeConfig> = {
  blacksmithing: {
    name: "Schmiedehandwerk",
    description: "Verbessert den Angriff deiner Truppen.",
    icon: "/assets/icons/research/blacksmithing.png",
    levels: {
      1: {
        level: 1,
        cost: { wood: 50, stone: 50, food: 20, mana: 100 },
        researchTime: 60,
      },
      2: {
        level: 2,
        cost: { wood: 120, stone: 120, food: 50, mana: 250 },
        researchTime: 150,
      },
    },
  },
  armorsmithing: {
    name: "Rüstungsschmied",
    description: "Verbessert die Verteidigung deiner Truppen.",
    icon: "/assets/icons/research/armorsmithing.png",
    levels: {
      1: {
        level: 1,
        cost: { wood: 60, stone: 80, food: 10, mana: 100 },
        researchTime: 70,
      },
      2: {
        level: 2,
        cost: { wood: 150, stone: 200, food: 30, mana: 250 },
        researchTime: 180,
      },
    },
  },
  enchanting: {
    name: "Zauberkunst",
    description: "Beschleunigt zukünftige Forschungen.",
    icon: "/assets/icons/research/enchanting.png",
    levels: {
      1: {
        level: 1,
        cost: { wood: 20, stone: 20, food: 80, mana: 150 },
        researchTime: 120,
      },
    },
  },
  logistics: {
    name: "Logistik",
    description: "Erhöht die Marschgeschwindigkeit deiner Armeen.",
    icon: "/assets/icons/research/logistics.png",
    levels: {
      1: {
        level: 1,
        cost: { wood: 100, stone: 40, food: 100, mana: 50 },
        researchTime: 90,
      },
    },
  },
  espionage: {
    name: "Spionage",
    description: "Verbessert die Effektivität deiner Spione.",
    icon: "/assets/icons/research/espionage.png",
    levels: {
      1: {
        level: 1,
        cost: { wood: 50, stone: 20, food: 120, mana: 120 },
        researchTime: 100,
      },
    },
  },
  administration: {
    name: "Administration",
    description: "Beschleunigt den Bau von Gebäuden.",
    icon: "/assets/icons/research/administration.png",
    levels: {
      1: {
        level: 1,
        cost: { wood: 150, stone: 150, food: 150, mana: 150 },
        researchTime: 200,
      },
    },
  },
};
export const RESEARCH_LIST: ResearchKey[] = [
  "blacksmithing",
  "armorsmithing",
  "enchanting",
  "logistics",
  "espionage",
  "administration",
];
