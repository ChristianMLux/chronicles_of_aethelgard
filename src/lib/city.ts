import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import { CityData, RawCityData, TimestampField } from "@/types";

export async function getCityData(
  userId: string,
  cityId: string
): Promise<RawCityData | null> {
  const adminApp = getAdminApp();
  const adminDb = getFirestore(adminApp);

  const cityRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("cities")
    .doc(cityId);
  const cityDoc = await cityRef.get();

  if (!cityDoc.exists) {
    return null;
  }

  const cityData = {
    id: cityDoc.id,
    ownerId: userId,
    ...cityDoc.data(),
  } as RawCityData;

  const continentPromise = cityData.location?.continent
    ? adminDb.collection("continents").doc(cityData.location.continent).get()
    : Promise.resolve(null);

  const territoryPromise = cityData.location?.territory
    ? adminDb.collection("regions").doc(cityData.location.territory).get()
    : Promise.resolve(null);

  const [continentDoc, territoryDoc] = await Promise.all([
    continentPromise,
    territoryPromise,
  ]);

  if (cityData.location) {
    cityData.location.continentName =
      continentDoc?.data()?.name || "Unknown Continent";
    cityData.location.territoryName =
      territoryDoc?.data()?.name || "Unknown Territory";
  }

  return cityData;
}

export function serializeCityData(cityData: RawCityData): CityData {
  const convertTimestamp = (field: TimestampField): string | undefined => {
    if (!field) return undefined;

    if (field && typeof field === "object" && "_seconds" in field) {
      return new Date(field._seconds * 1000).toISOString();
    }

    if (typeof field === "string") {
      return field;
    }

    if (field instanceof Date) {
      return field.toISOString();
    }

    if (
      field &&
      typeof field === "object" &&
      "toDate" in field &&
      typeof field.toDate === "function"
    ) {
      try {
        return field.toDate().toISOString();
      } catch (e) {
        console.warn(e);
      }
    }

    return undefined;
  };

  return {
    ...cityData,
    createdAt: convertTimestamp(cityData.createdAt),
    updatedAt: convertTimestamp(cityData.updatedAt),
    lastTickAt: convertTimestamp(cityData.lastTickAt),

    resources: {
      stone: cityData.resources?.stone || 0,
      wood: cityData.resources?.wood || 0,
      food: cityData.resources?.food || 0,
      mana: cityData.resources?.mana || 0,
    },

    buildings: cityData.buildings
      ? {
          farm: cityData.buildings.farm || 0,
          manamine: cityData.buildings.manamine || 0,
          quarry: cityData.buildings.quarry || 0,
          sawmill: cityData.buildings.sawmill || 0,
        }
      : undefined,

    buildQueue: cityData.buildQueue || undefined,
  } as CityData;
}
