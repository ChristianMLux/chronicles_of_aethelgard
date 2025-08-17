import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import { City, RawCityData, TimestampField, Buildings } from "@/types";
import { getCurrentUser } from "./user";

function getDb() {
  return getFirestore(getAdminApp());
}

/**
 * Fetches a single city document from Firestore for the currently authenticated user.
 * @param cityId The ID of the city to fetch.
 * @returns A promise that resolves to the City object or null if not found.
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
    buildingQueue: Array.isArray(cityData.buildingQueue)
      ? cityData.buildingQueue.map((item) => ({
          ...item,
          startTime: toTimestamp(item.startTime) || Timestamp.now(),
          endTime: toTimestamp(item.endTime) || Timestamp.now(),
        }))
      : [],
    buildingSlots: cityData.buildingSlots,
    defense: cityData.defense,
    workforce: cityData.workforce,
    capacity: cityData.capacity,
    createdAt: toTimestamp(cityData.createdAt)?.toDate().toISOString(),
    updatedAt: toTimestamp(cityData.updatedAt)?.toDate().toISOString(),
    lastTickAt: toTimestamp(cityData.lastTickAt)?.toDate().toISOString(),
  };
}
