import { auth } from "firebase-admin";
import { getFirestore, DocumentData } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminApp } from "@/lib/firebase-admin";
import Link from "next/link";

interface City extends DocumentData {
  id: string;
  name: string;
}

export default async function DashboardPage() {
  const adminApp = getAdminApp();
  const adminDb = getFirestore(adminApp);

  const cookieStore = cookies();
  const session = (await cookieStore).get("session")?.value || "";

  if (!session) {
    redirect("/auth/signin");
  }

  let decodedClaims;
  try {
    decodedClaims = await auth().verifySessionCookie(session, true);
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    redirect("/auth/signin");
  }

  if (!decodedClaims) {
    redirect("/auth/signin");
  }

  const userId = decodedClaims.uid;

  const citiesRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("cities");
  const querySnapshot = await citiesRef.limit(1).get();

  let userCity: City | null = null;
  if (!querySnapshot.empty) {
    const cityDoc = querySnapshot.docs[0];
    userCity = { id: cityDoc.id, ...cityDoc.data() } as City;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        <p className="text-lg mb-6">
          Welcome back, ruler of Aethelgard. Your kingdom awaits.
        </p>

        {userCity ? (
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Your City</h2>
            <p className="mb-4">
              Your capital city, {userCity.name}, is ready for your command.
            </p>
            <Link
              href={`/city/${userCity.id}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
            >
              Go to City
            </Link>
          </div>
        ) : (
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">No City Found</h2>
            <p>
              It seems you do not have a city yet. A new world awaits to be
              conquered.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
