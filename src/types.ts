import { Timestamp } from "firebase-admin/firestore";

export interface Location {
  region: string;
  continent: string;
  territory: string;
  continentName: string;
  territoryName: string;
}

export interface Buildings {
  farm: number;
  manamine: number;
  quarry: number;
  sawmill: number;
}

export interface Queue {
  name: string;
  duration: number;
  startedAt: number;
  targetLevel: number;
}

export interface BuildingQueue {
  quarry?: Queue;
  sawmill?: Queue;
  farm?: Queue;
  manamine?: Queue;
}

export interface Resources {
  stone: number;
  wood: number;
  food: number;
  mana: number;
}

export interface CityData {
  id: string;
  name: string;
  ownerId: string;
  location: Location;
  resources: Resources;

  createdAt?: string;
  updatedAt?: string;
  lastTickAt?: string;

  buildingSlots?: number;
  defense?: number;
  workforce?: number;
  capacity?: number;

  buildings?: Buildings;
  buildQueue?: BuildingQueue;

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
  location: {
    continent: string;
    territory: string;
    continentName: string;
    territoryName: string;
  };
  resources?: Partial<Resources>;
  createdAt?: TimestampField;
  updatedAt?: TimestampField;
  lastTickAt?: TimestampField;
  buildingSlots?: number;
  defense?: number;
  workforce?: number;
  capacity?: number;
  buildings?: Partial<Buildings>;
  buildQueue?: BuildingQueue;
  [key: string]: unknown;
}
