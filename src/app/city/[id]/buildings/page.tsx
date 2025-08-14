import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminApp } from "../../../../lib/firebase-admin";
import CityBuildingsClient from "@/components/CityBuildingsClient";

// Helper-Funktion zur serverseitigen Authentifizierung
async function getCurrentUserId(): Promise<string | null> {
    const sessionCookie = (await cookies()).get("session")?.value || "";
    if (!sessionCookie) return null;
    try {
        const adminApp = getAdminApp();
        const auth = adminApp.auth();
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        return decodedClaims.uid;
    } catch (error) {
        return null;
    }
}

export default async function CityBuildingsPage({ params }: { params: { id: string } }) {
    const userId = await getCurrentUserId();
    if (!userId) {
        redirect('/auth/signin');
    }
    return <CityBuildingsClient cityId={params.id} userId={userId} />;
}
