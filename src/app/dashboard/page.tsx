import { auth } from "firebase-admin";
import { getFirestore, DocumentData } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminApp } from "@/lib/firebase-admin";
import Link from "next/link";
import { Clock, Newspaper, Swords, Users, Warehouse } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

interface City extends DocumentData {
  id: string;
  name: string;
  continent: string;
  region: string;
  buildQueue?: {
    [key: string]: {
      name: string;
      targetLevel: number;
      duration: number;
    };
  };
}

const CityCard = ({ city }: { city: City }) => (
  <div className="bg-panel-2/50 p-3 rounded-lg border border-outline/50 hover:border-rune/70 transition-colors">
    <h3 className="font-bold text-base">{city.name}</h3>
    <p className="text-xs text-gray-400">
      {city.region}, {city.continent}
    </p>
    <div className="mt-2 text-xs">
      {city.buildQueue && Object.keys(city.buildQueue).length > 0 ? (
        Object.values(city.buildQueue).map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <Clock size={12} className="text-yellow-400" />
            <span>
              {item.name} (Lvl {item.targetLevel})
            </span>
          </div>
        ))
      ) : (
        <p className="text-gray-500 italic">Keine Bauaufträge</p>
      )}
    </div>
    <Link
      href={`/city/${city.id}`}
      className="ui-button text-xs px-3 py-1 mt-3 block text-center"
    >
      Verwalten
    </Link>
  </div>
);

export default async function DashboardPage() {
  const adminApp = getAdminApp();
  const adminDb = getFirestore(adminApp);
  const cookieStore = cookies();
  const session = (await cookieStore).get("session")?.value || "";

  if (!session) redirect("/auth/signin");

  let decodedClaims;
  try {
    decodedClaims = await auth().verifySessionCookie(session, true);
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    redirect("/auth/signin");
  }

  if (!decodedClaims) redirect("/auth/signin");

  const userId = decodedClaims.uid;

  const citiesRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("cities");
  const querySnapshot = await citiesRef.get();
  const userCities: City[] = querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as City)
  );

  const mockArmies = [
    {
      id: 1,
      name: "Vorhut des Löwen",
      mission: "Patrouille",
      location: "Grünwald",
    },
    {
      id: 2,
      name: "Eiserne Faust",
      mission: "Belagerung",
      location: "Grauwacht",
    },
  ];
  const mockAlliance = { name: "Die Silberne Hand", members: 42 };
  const mockEvents = [
    { title: "Fest der Ernte", description: "Bonus auf Nahrungsproduktion" },
    { title: "Ruf des Krieges", description: "Schnellere Truppenausbildung" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pt-24">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Reichsübersicht</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Column 1: Cities */}
          <DashboardCard
            title="Meine Städte"
            icon={<Warehouse size={20} />}
            className="xl:col-span-1"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {userCities.length > 0 ? (
                userCities.map((city) => <CityCard key={city.id} city={city} />)
              ) : (
                <p className="text-gray-400">Noch keine Stadt gegründet.</p>
              )}
            </div>
          </DashboardCard>

          {/* Column 2: Armies & Alliances */}
          <div className="flex flex-col gap-6 xl:col-span-2">
            <DashboardCard title="Armeebewegungen" icon={<Swords size={20} />}>
              <ul className="space-y-2 text-sm">
                {mockArmies.map((army) => (
                  <li key={army.id} className="flex justify-between">
                    <span>{army.name}</span>
                    <span className="text-gray-400">
                      {army.mission} bei {army.location}
                    </span>
                  </li>
                ))}
              </ul>
            </DashboardCard>
            <DashboardCard title="Allianz" icon={<Users size={20} />}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{mockAlliance.name}</h3>
                  <p className="text-sm text-gray-400">
                    {mockAlliance.members} Mitglieder
                  </p>
                </div>
                <Link href="#" className="ui-link text-sm">
                  Zur Allianz
                </Link>
              </div>
            </DashboardCard>
          </div>

          {/* Column 3: Events & News */}
          <DashboardCard
            title="Events & Neuigkeiten"
            icon={<Newspaper size={20} />}
          >
            <ul className="space-y-3">
              {mockEvents.map((event, i) => (
                <li key={i}>
                  <h4 className="font-semibold text-sm">{event.title}</h4>
                  <p className="text-xs text-gray-400">{event.description}</p>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
