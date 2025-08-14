import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CityClient from "../../../components/CityClient";
import { getAdminApp } from "../../../lib/firebase-admin";

async function getCurrentUserId(): Promise<string | null> {

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


type Props = { params: { id: string } };

export default async function CityPage({ params }: Props) {
    const { id: cityId } = params;
    const userId = await getCurrentUserId();

    if (!userId) {
        redirect('/auth/signin');
    }

    return <CityClient cityId={cityId} userId={userId} />;
}
