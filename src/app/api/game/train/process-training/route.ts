import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase-admin";
import { City, TrainingQueueItem } from "@/types";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { auth } from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const adminAuth = auth(adminApp);
    const db = adminApp.firestore();

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

    if (!city.trainingQueue || city.trainingQueue.length === 0) {
      return NextResponse.json(city);
    }

    const now = Date.now();
    const completedTraining: TrainingQueueItem[] = [];
    const ongoingTraining: TrainingQueueItem[] = [];

    city.trainingQueue.forEach((item) => {
      const endTimeMs = item.endTime.toMillis();
      if (endTimeMs <= now) {
        completedTraining.push(item);
      } else {
        ongoingTraining.push(item);
      }
    });

    if (completedTraining.length === 0) {
      return NextResponse.json(city);
    }

    await db.runTransaction(async (transaction) => {
      const currentCityDoc = await transaction.get(cityRef);
      if (!currentCityDoc.exists) {
        throw new Error("City does not exist!");
      }
      const armyUpdates: { [key: string]: FieldValue } = {};

      completedTraining.forEach((training) => {
        const amountToAdd = training.amount;
        if (
          training.unitId &&
          typeof amountToAdd === "number" &&
          amountToAdd > 0
        ) {
          const fieldPath = `army.${training.unitId}`;
          armyUpdates[fieldPath] = FieldValue.increment(amountToAdd);
        } else {
          console.warn(
            "Ungültiger Rekrutierungsauftrag übersprungen: ",
            training
          );
        }
      });

      transaction.update(cityRef, {
        ...armyUpdates,
        trainingQueue: ongoingTraining,
        updatedAt: Timestamp.now(),
      });
    });

    const updatedCityDoc = await cityRef.get();
    const updatedCity = updatedCityDoc.data();

    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error("Fehler beim Verarbeiten der Trainings-Aufträge:", error);
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
