import { auth } from "firebase-admin";
import { cookies } from "next/headers";

export async function getCurrentUserId(): Promise<string | null> {
  const sessionCookie = (await cookies()).get("session")?.value || "";
  if (!sessionCookie) {
    return null;
  }
  try {
    const decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}
