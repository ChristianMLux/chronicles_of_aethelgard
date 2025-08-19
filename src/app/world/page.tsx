"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDb } from "../../../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  getDocs,
  collectionGroup, // Für das Abrufen aller cities
} from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

type City = {
  id: string;
  name: string;
  food: number;
  continent?: string;
  region?: string;
};

export default function WorldPage() {
  const db = useMemo(() => getDb(), []);
  const searchParams = useSearchParams();
  const cityId = searchParams.get("city");
  const { user } = useAuth();

  const [city, setCity] = useState<City | null>(null);
  const [target, setTarget] = useState<string>("");
  const [allCities, setAllCities] = useState<City[]>([]);

  useEffect(() => {
    if (!cityId || !user?.uid) return;

    (async () => {
      const cityDoc = doc(db, "users", user.uid, "cities", cityId);
      const snap = await getDoc(cityDoc);
      if (snap.exists()) {
        setCity({ id: snap.id, ...snap.data() } as City);
      }
    })();
  }, [db, cityId, user?.uid]);

  useEffect(() => {
    (async () => {
      // Option 1: Hole alle cities von allen users (mit collectionGroup)
      const citiesQuery = collectionGroup(db, "cities");
      const cs = await getDocs(citiesQuery);
      setAllCities(cs.docs.map((d) => ({ id: d.id, ...d.data() } as City)));

      // Option 2: Hole nur cities vom aktuellen user
      // if (!session?.user?.id) return;
      // const userCitiesRef = collection(db, "users", session.user.id, "cities");
      // const cs = await getDocs(userCitiesRef);
      // setAllCities(cs.docs.map((d) => ({ id: d.id, ...d.data() } as City)));
    })();
  }, [db, user?.uid]);

  async function sendMission() {
    if (!city || !target || !user?.uid) return;

    await runTransaction(db, async (trx) => {
      const cRef = doc(db, "users", user.uid, "cities", city.id);
      const csnap = await trx.get(cRef);
      if (!csnap.exists()) return;
      const c = csnap.data() as City;
      const cost = 20;
      if (c.food < cost) return;
      trx.update(cRef, { food: c.food - cost, updatedAt: serverTimestamp() });
    });

    await addDoc(collection(db, "reports"), {
      type: "mission",
      userId: user.uid,
      cityId: city.id,
      target,
      createdAt: serverTimestamp(),
      message: `Armee aus ${city.name} auf Mission nach ${target}`,
    });
    setTarget("");
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link className="underline" href="/dashboard">
        ← Zurück
      </Link>
      <h1 className="text-2xl font-semibold">Welt</h1>
      <p className="text-sm text-gray-600">
        Wähle ein Ziel aus bekannten Städten (Stub). Später wird dies eine
        Karte.
      </p>
      <div className="flex items-center gap-2">
        <label>Ziel:</label>
        <select
          className="border rounded px-2 py-1"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          <option value="">— Ziel wählen —</option>
          {allCities
            .filter((c) => !city || c.id !== city.id)
            .map((c) => (
              <option key={c.id} value={`${c.continent}/${c.region}/${c.id}`}>
                {c.name} ({c.continent}/{c.region})
              </option>
            ))}
        </select>
        <button
          className="border rounded px-3 py-1"
          onClick={sendMission}
          disabled={!city || !target}
        >
          Senden
        </button>
      </div>
    </div>
  );
}
