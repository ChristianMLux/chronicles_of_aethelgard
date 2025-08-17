import { cookies } from "next/headers";
import { getAdminApp } from "@/lib/firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";

export async function getCurrentUserId(): Promise<string | null> {
  const sessionCookie = (await cookies()).get("session")?.value || "";
  if (!sessionCookie) {
    return null;
  }
  try {
    const adminApp = getAdminApp();
    const auth = adminApp.auth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

export async function getCurrentUser(): Promise<DecodedIdToken | null> {
  const sessionCookie = (await cookies()).get("session")?.value || "";
  if (!sessionCookie) {
    return null;
  }
  try {
    const adminApp = getAdminApp();
    const auth = adminApp.auth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}
