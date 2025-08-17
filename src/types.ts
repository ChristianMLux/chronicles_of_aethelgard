import { Timestamp } from "firebase-admin/firestore";

export interface Location {
  region: string;
  continent: string;
  territory: string;
  continentName: string;
  territoryName: string;
}

export type BuildingKey = "sawmill" | "manamine" | "farm" | "quarry";
export type ResourceKey = "stone" | "wood" | "food" | "mana";

export type level = number;

export interface Buildings {
  farm: level;
  manamine: level;
  quarry: level;
  sawmill: level;
}

export interface BuildingQueueItem {
  id: string;
  buildingId: BuildingKey;
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

  buildings: Buildings;
  buildingQueue: BuildingQueueItem[];
  buildingSlots?: number;
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
  [key: string]: unknown;
}

export interface BuildingLevelConfig {
  level: number;
  cost: Partial<Record<ResourceKey, number>>;
  constructionTime: number; // in seconds
}

export interface GameConfig {
  buildings: {
    [key in BuildingKey]: {
      [level: number]: BuildingLevelConfig;
    };
  };
}
