import { UnitKey, UnitConfig } from "@/types";

export const UNIT_CONFIG: Record<
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

export const UNIT_DETAILS_CONFIG: Record<
  UnitKey,
  { name: string; description: string }
> = {
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

export const UNIT_LIST: UnitKey[] = ["swordsman", "archer", "knight"];
