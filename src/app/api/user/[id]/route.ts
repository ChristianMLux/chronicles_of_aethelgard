import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";

/**
 * API handler to fetch a user's public profile.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    getAdminApp();
    const db = getFirestore();
    console.log("GET DOCS");
    const userDoc = await db.collection("users").doc(id).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData) {
      console.warn("BLABLABLA");
    }
    console.log("userdata", userData);
    const publicProfile = {
      username: userData?.name || "Unknown Player",
    };

    return NextResponse.json(publicProfile, { status: 200 });
  } catch (error) {
    console.error(
      `Error fetching user profile for ID ${(await params).id}:`,
      error
    );
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
