import { UnitKey } from "@/types";

export const UNITS = {
  swordsman: {
    name: "Swordsman",
    description: "A basic melee unit.",
    attack: 5,
    defense: 10,
    speed: 50,
    capacity: 100,
    costs: {
      wood: 20,
      food: 30,
      stone: 0,
      mana: 0,
    },
    recruitTime: 10, // in seconds
    roles: ["combat", "defense"],
    counter: "knight",
  },
  archer: {
    name: "Archer",
    description: "A ranged unit, good for defense.",
    attack: 10,
    defense: 5,
    speed: 75,
    capacity: 50,
    costs: {
      wood: 30,
      food: 20,
      stone: 0,
      mana: 0,
    },
    recruitTime: 12,
    roles: ["combat", "defense"],
    counter: "swordsman",
  },
  knight: {
    name: "Knight",
    description: "A strong cavalry unit.",
    attack: 20,
    defense: 20,
    speed: 100,
    capacity: 25,
    costs: {
      wood: 50,
      food: 80,
      stone: 100,
      mana: 0,
    },
    recruitTime: 30,
    roles: ["combat"],
    counter: "archer",
  },
  spy: {
    name: "Spy",
    description: "Gathers information about other players.",
    attack: 1,
    defense: 1,
    speed: 150,
    capacity: 25,
    costs: {
      wood: 50,
      food: 80,
      stone: 40,
      mana: 100,
    },
    recruitTime: 120,
    roles: ["espionage"],
    counter: "knight",
  },
} as const;

export const UNIT_LIST: UnitKey[] = ["swordsman", "archer", "knight", "spy"];
