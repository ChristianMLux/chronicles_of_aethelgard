import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { City, BuildingQueueItem } from "@/types";
import { auth } from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const adminAuth = auth(adminApp);

    const session = req.cookies.get("session")?.value || "";
    if (!session) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 401 }
      );
    }
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const { cityId } = await req.json();
    if (!cityId || typeof cityId !== "string") {
      return NextResponse.json(
        { error: "CityId fehlt oder ist ungültig." },
        { status: 400 }
      );
    }

    const cityRef = db
      .collection("users")
      .doc(userId)
      .collection("cities")
      .doc(cityId);
    const cityDoc = await cityRef.get();

    if (!cityDoc.exists) {
      return NextResponse.json(
        { error: "Stadt nicht gefunden." },
        { status: 404 }
      );
    }

    const city = cityDoc.data() as City;

    if (!city.buildingQueue || city.buildingQueue.length === 0) {
      return NextResponse.json(city);
    }

    const now = Timestamp.now();
    const completedBuilds: BuildingQueueItem[] = [];
    const ongoingBuilds: BuildingQueueItem[] = [];

    city.buildingQueue.forEach((item) => {
      let endTime: Timestamp;
      const rawEndTime = item.endTime as Timestamp;

      if (rawEndTime && typeof rawEndTime.toDate === "function") {
        endTime = rawEndTime;
      } else if (rawEndTime && typeof rawEndTime.seconds === "number") {
        endTime = new Timestamp(
          rawEndTime.seconds,
          rawEndTime.nanoseconds || 0
        );
      } else if (typeof rawEndTime === "string") {
        endTime = Timestamp.fromDate(new Date(rawEndTime));
      } else {
        console.warn("Unbekanntes Zeitformat in der Bauwarteschlange:", item);
        ongoingBuilds.push(item);
        return;
      }

      if (endTime <= now) {
        completedBuilds.push(item);
      } else {
        ongoingBuilds.push(item);
      }
    });

    if (completedBuilds.length === 0) {
      return NextResponse.json(city);
    }

    const updatedBuildings = { ...city.buildings };
    completedBuilds.forEach((build) => {
      const targetLevel =
        (build as BuildingQueueItem).targetLevel || build.targetLevel;

      if (
        build.buildingId &&
        typeof targetLevel === "number" &&
        targetLevel > 0
      ) {
        updatedBuildings[build.buildingId] = targetLevel;
      } else {
        console.warn("Ungültiger Bauauftrag übersprungen:", build);
      }
    });

    await cityRef.update({
      buildings: updatedBuildings,
      buildingQueue: ongoingBuilds,
      updatedAt: Timestamp.now(),
    });

    const updatedCity: City = {
      ...city,
      buildings: updatedBuildings,
      buildingQueue: ongoingBuilds,
    };

    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error("Fehler beim Verarbeiten der Bauaufträge:", error);
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "auth/session-cookie-expired"
    ) {
      return NextResponse.json(
        { error: "Sitzung abgelaufen. Bitte neu anmelden." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Ein interner Serverfehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
