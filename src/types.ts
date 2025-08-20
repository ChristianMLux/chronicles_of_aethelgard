import { Timestamp } from "firebase-admin/firestore";

export interface Location {
  region: string;
  continent: string;
  territory: string;
  continentName: string;
  territoryName: string;
}

export interface UserProfile {
  username: string;
  email: string;
  createdAt: Timestamp;
}

export type BuildingKey =
  | "sawmill"
  | "manamine"
  | "farm"
  | "quarry"
  | "barracks";

export type ResourceKey = "stone" | "wood" | "food" | "mana";

export type UnitKey = "swordsman" | "archer" | "knight";

export type ResearchKey =
  | "blacksmithing"
  | "armorsmithing"
  | "enchanting"
  | "logistics"
  | "espionage"
  | "administration";

export type level = number;

export interface Buildings {
  farm: level;
  manamine: level;
  quarry: level;
  sawmill: level;
  barracks?: level;
}

export interface Research {
  blacksmithing: level;
  armorsmithing: level;
  enchanting: level;
  logistics: level;
  espionage: level;
  administration: level;
}

export interface BuildingQueueItem {
  id: string;
  buildingId: BuildingKey;
  targetLevel: number;
  startTime: Timestamp;
  endTime: Timestamp;
}

export interface TrainingQueueItem {
  id: string;
  unitId: UnitKey;
  amount: number;
  startTime: Timestamp;
  endTime: Timestamp;
}

export interface ResearchQueueItem {
  id: string;
  researchId: ResearchKey;
  targetLevel: number;
  startTime: Timestamp;
  endTime: Timestamp;
}

export interface Resources {
  [key: string]: number;
  stone: number;
  wood: number;
  food: number;
  mana: number;
}

export interface City {
  id: string;
  userId: string;
  ownerId: string;
  name: string;
  location: Location;
  resources: Resources;
  research: Research;
  researchQueue: ResearchQueueItem[];
  buildings: Buildings;
  buildingQueue: BuildingQueueItem[];
  buildingSlots?: number;
  army: Record<UnitKey, number>;
  trainingQueue: TrainingQueueItem[];
  defense?: number;
  workforce?: number;
  capacity?: number;

  createdAt?: string;
  updatedAt?: string;
  lastTickAt?: string;
  [key: string]: unknown;
}

interface FirestoreTimestampLike {
  _seconds: number;
  _nanoseconds?: number;
}

export type TimestampField =
  | string
  | Date
  | Timestamp
  | FirestoreTimestampLike
  | { toDate: () => Date }
  | null
  | undefined;

export interface RawCityData {
  id: string;
  name: string;
  ownerId: string;
  location: Location;
  resources?: Partial<Resources>;
  createdAt?: TimestampField;
  updatedAt?: TimestampField;
  lastTickAt?: TimestampField;
  buildingSlots?: number;
  defense?: number;
  workforce?: number;
  capacity?: number;
  buildings?: Partial<Buildings>;
  buildingQueue?: BuildingQueueItem[];
  army?: Record<UnitKey, number>;
  trainingQueue?: TrainingQueueItem[];
  research?: Research;
  researchQueue?: ResearchQueueItem[];
  [key: string]: unknown;
}

export interface UnitConfig {
  name: string;
  description: string;
  costs: Resources;
  recruitTime: number; // in seconds
  attack: number;
  defense: number;
}

export interface ResearchConfig {
  name: string;
  description: string;
  costs: Resources;
  researchTime: number;
  //TODO: Add effects here
}

export interface GameConfig {
  buildings: {
    [key in BuildingKey]: {
      [level: number]: BuildingLevelConfig;
    };
  };
  units: {
    [key in UnitKey]: {
      [level: number]: UnitConfig;
    };
  };
  research: {
    [key in ResearchKey]: {
      [level: number]: ResearchConfig;
    };
  };
}

export interface BuildingLevelConfig {
  level: number;
  cost: Partial<Record<ResourceKey, number>>;
  constructionTime: number; // in seconds
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
