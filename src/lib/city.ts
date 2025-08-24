import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import {
  City,
  RawCityData,
  TimestampField,
  Buildings,
  BuildingQueueItem,
  TrainingQueueItem,
  ResearchQueueItem,
} from "@/types";
import { getCurrentUser } from "./user";

function getDb() {
  return getFirestore(getAdminApp());
}

/**
 * Fetches a single city document from Firestore for the currently authenticated user.
 * This function ensures the returned data is fully serialized and safe to pass from
 * Server Components to Client Components.
 * @param cityId The ID of the city to fetch.
 * @returns A promise that resolves to the serialized City object or null if not found.
 */
export async function getCity(cityId: string): Promise<City | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const adminDb = getDb();
  const cityRef = adminDb
    .collection("users")
    .doc(user.uid)
    .collection("cities")
    .doc(cityId);

  const cityDoc = await cityRef.get();

  if (!cityDoc.exists) {
    return null;
  }

  const rawData = {
    id: cityDoc.id,
    ownerId: user.uid,
    ...cityDoc.data(),
  } as unknown as RawCityData;

  return serverSerializeCityData(rawData);
}

/**
 * Fetches all city documents for a given user.
 * @param userId The ID of the user whose cities to fetch.
 * @returns A promise that resolves to an array of serialized City objects.
 */
export async function getCities(userId: string): Promise<City[]> {
  const adminDb = getDb();
  const citiesRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("cities");

  const snapshot = await citiesRef.get();

  if (snapshot.empty) {
    return [];
  }

  const cities = snapshot.docs.map((doc) => {
    const rawData = {
      id: doc.id,
      ownerId: userId,
      ...doc.data(),
    } as unknown as RawCityData;
    return serverSerializeCityData(rawData);
  });

  return cities;
}

/**
 * Updates a city document in Firestore.
 * @param cityId The ID of the city to update.
 * @param data An object containing the fields to update.
 */
export async function updateCity(
  cityId: string,
  data: Record<string, unknown>
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: No user is signed in.");
  }

  const adminDb = getDb();
  const cityRef = adminDb
    .collection("users")
    .doc(user.uid)
    .collection("cities")
    .doc(cityId);

  await cityRef.update(data);
}

/**
 * Serializes raw Firestore city data into a format safe for Client Components.
 * It converts all Timestamp objects to ISO date strings.
 * @param cityData The raw city data from Firestore.
 * @returns A fully serializable City object.
 */
function serverSerializeCityData(cityData: RawCityData): City {
  const defaultBuildings: Buildings = {
    farm: 0,
    manamine: 0,
    quarry: 0,
    sawmill: 0,
  };

  const toTimestamp = (field: TimestampField): Timestamp | undefined => {
    if (!field) return undefined;
    if (field instanceof Timestamp) return field;
    if (field instanceof Date) return Timestamp.fromDate(field);
    if (typeof field === "string") return Timestamp.fromDate(new Date(field));

    if (typeof field === "object") {
      const obj = field as {
        toDate?: () => Date;
        _seconds?: number;
        _nanoseconds?: number;
      };
      if (typeof obj.toDate === "function") {
        return Timestamp.fromDate(obj.toDate());
      }
      if (typeof obj._seconds === "number") {
        return new Timestamp(obj._seconds, obj._nanoseconds || 0);
      }
    }
    return undefined;
  };

  const serializeQueueItem = <
    T extends BuildingQueueItem | TrainingQueueItem | ResearchQueueItem
  >(
    item: T
  ): T => {
    const startTime =
      toTimestamp(item.startTime as unknown as TimestampField) ||
      Timestamp.now();
    const endTime =
      toTimestamp(item.endTime as unknown as TimestampField) || Timestamp.now();

    return {
      ...item,
      startTime: startTime.toDate().toISOString(),
      endTime: endTime.toDate().toISOString(),
    } as T;
  };

  return {
    id: cityData.id,
    userId: cityData.ownerId,
    ownerId: cityData.ownerId,
    name: cityData.name || "Unnamed City",
    location: cityData.location,
    resources: {
      stone: cityData.resources?.stone || 0,
      wood: cityData.resources?.wood || 0,
      food: cityData.resources?.food || 0,
      mana: cityData.resources?.mana || 0,
    },
    buildings: { ...defaultBuildings, ...cityData.buildings },

    buildingQueue: (cityData.buildingQueue || []).map(serializeQueueItem),
    trainingQueue: (cityData.trainingQueue || []).map(serializeQueueItem),
    researchQueue: (cityData.researchQueue || []).map(serializeQueueItem),

    buildingSlots: cityData.buildingSlots,
    army: {
      swordsman: cityData.army?.swordsman || 0,
      archer: cityData.army?.archer || 0,
      knight: cityData.army?.knight || 0,
      spy: cityData.army?.spy || 0,
    },
    research: {
      blacksmithing: cityData.research?.blacksmithing || 1,
      armorsmithing: cityData.research?.armorsmithing || 1,
      enchanting: cityData.research?.enchanting || 1,
      administration: cityData.research?.administration || 1,
      logistics: cityData.research?.logistics || 1,
      espionage: cityData.research?.espionage || 1,
    },
    defense: cityData.defense,
    workforce: cityData.workforce,
    capacity: cityData.capacity,
    tileId: cityData.tileId,

    createdAt: toTimestamp(cityData.createdAt)?.toDate().toISOString(),
    updatedAt: toTimestamp(cityData.updatedAt)?.toDate().toISOString(),
    lastTickAt: toTimestamp(cityData.lastTickAt)?.toDate().toISOString(),
  };
}
