import { Timestamp } from "firebase-admin/firestore";
import { UNITS } from "./config/units.config";

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

export type UnitKey = keyof typeof UNITS;

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
  tileId?: string;
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
  tileId?: string;
  [key: string]: unknown;
}

export interface UnitConfig {
  name: string;
  description: string;
  costs: Resources;
  recruitTime: number; // in seconds
  attack: number;
  defense: number;
  speed: number;
  capacity: number;
  counter: UnitKey;
  spyPower?: number;
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

export type TerrainType =
  | "plains"
  | "forest"
  | "mountains"
  | "water"
  | "desert";
export type TileType = "empty" | "city" | "resource" | "npc_camp" | "ruins";
export type ZoneType = "outer" | "middle" | "center";
export type ResourceType = "food" | "wood" | "stone" | "mana";

export interface Tile {
  id: string;
  coords: { x: number; y: number };
  location: Location;
  type: TileType;
  terrain: TerrainType;
  zone: ZoneType;
  ownerId?: string;
  cityId?: string;
  npcCampId?: string;
  resourceType?: ResourceType;
  activeMissionId?: string;
  resourceAmount?: number;
  npcLevel?: number;
  npcTroops?: {
    swordsman: number;
    archer: number;
    knight: number;
  };
}

export type WorldMissionAction = "ATTACK" | "SPY" | "GATHER" | "SEND_RSS";
export type WorldMissionStatus =
  | "outgoing"
  | "arrived"
  | "returning"
  | "completed";

export interface WorldMission {
  id: string;
  ownerId: string;
  originCityId: string;
  originCoords: { x: number; y: number };
  targetTileId: string;
  targetCoords: { x: number; y: number };
  targetOwnerId?: string;
  actionType: WorldMissionAction;
  army: Record<UnitKey, number>;
  resources?: Partial<Resources>;
  startTime: number;
  arrivalTime: number;
  returnTime: number;
  status: WorldMissionStatus;
  ownerName: string;
  targetName?: string;
}

export interface StartWorldMissionRequest {
  originCityId: string;
  targetTileId: string;
  actionType: WorldMissionAction;
  army: Record<UnitKey, number>;
  resources?: Partial<Resources>;
}

export interface BattleReport {
  attackerId: string;
  defenderId: string;
  attackerArmy: Record<UnitKey, number>;
  defenderArmy: Record<UnitKey, number>;
  rounds: BattleReportRound[];
  winner: "attacker" | "defender" | "draw";
  survivors: {
    attacker: Record<UnitKey, number>;
    defender: Record<UnitKey, number>;
  };
}

export interface BattleReportRound {
  round: number;
  attackerDamage: number;
  defenderDamage: number;
  attackerLosses: Record<UnitKey, number>;
  defenderLosses: Record<UnitKey, number>;
}

export interface MissionReport {
  id: string;
  actionType: "ATTACK" | "GATHER" | "SPY" | "DEFENSE" | "RESOURCE_TRANSFER";
  timestamp: Timestamp;
  read: boolean;
  targetCoords: { x: number; y: number };
  battleDetails?: BattleReport;
  spyDetails?: SpyReport;
  gatheredResources?: Partial<Record<ResourceKey, number>>;
}

export const resourceIcons: Record<ResourceKey, string> = {
  food: "/assets/icons/resources/food.png",
  mana: "/assets/icons/resources/mana.png",
  stone: "/assets/icons/resources/stone.png",
  wood: "/assets/icons/resources/wood.png",
};

export interface SpyReport {
  success: boolean;
  detectionChance: number;
  spiesLost: number;
  targetResources?: Partial<Record<ResourceKey, number>>;
  targetArmy?: Record<UnitKey, number>;
  targetBuildings?: Partial<Buildings>;
  targetResearch?: Partial<Research>;
  targetCityCount?: number;
}

export interface ResourceTransferReport {
  success: boolean;
  resources: Partial<Record<ResourceKey, number>>;
  senderCityId: string;
  receiverCityId: string;
  senderName?: string;
  receiverName?: string;
  timestamp?: Timestamp;
}

export interface UnitTransportInfo {
  unitType: UnitKey;
  count: number;
  capacityPerUnit: number;
  totalCapacity: number;
}

export interface MissionValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  transportInfo?: {
    totalCapacity: number;
    usedCapacity: number;
    remainingCapacity: number;
    units: UnitTransportInfo[];
  };
}
