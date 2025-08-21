import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { getCities } from "@/lib/city";
import { City } from "@/types";

/**
 * API handler to fetch all cities for the currently authenticated user.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cities: City[] = await getCities(user.uid);

    return NextResponse.json(cities, { status: 200 });
  } catch (error) {
    console.error("Error fetching user cities:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
