import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { City, ResearchQueueItem } from "@/types";
import { auth } from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const adminAuth = auth(adminApp);

    const session = req.cookies.get("session")?.value || "";
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const { cityId } = await req.json();
    if (!cityId || typeof cityId !== "string") {
      return NextResponse.json(
        { error: "CityId is missing or invalid." },
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
      return NextResponse.json({ error: "City not found." }, { status: 404 });
    }

    const city = cityDoc.data() as City;

    if (!city.researchQueue || city.researchQueue.length === 0) {
      return NextResponse.json(city);
    }

    const now = Timestamp.now();
    const completedResearch: ResearchQueueItem[] = [];
    const ongoingResearch: ResearchQueueItem[] = [];

    city.researchQueue.forEach((item) => {
      const endTime = item.endTime as Timestamp;
      if (endTime <= now) {
        completedResearch.push(item);
      } else {
        ongoingResearch.push(item);
      }
    });

    if (completedResearch.length === 0) {
      return NextResponse.json(city);
    }

    const researchUpdates: { [key: string]: number } = {};
    completedResearch.forEach((research) => {
      researchUpdates[`research.${research.researchId}`] = research.targetLevel;
    });

    await cityRef.update({
      ...researchUpdates,
      researchQueue: ongoingResearch,
      updatedAt: Timestamp.now(),
    });

    const updatedCityDoc = await cityRef.get();
    const updatedCity = updatedCityDoc.data();

    return NextResponse.json(updatedCity);
  } catch (error) {
    console.error("Error processing research queue:", error);
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "auth/session-cookie-expired"
    ) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
