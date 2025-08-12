"use client";
import Link from "next/link";
import { getFirebaseAuth, getDb } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

type City = { id: string; name: string; continent: string; region: string; territory: number };

export default function DashboardPage() {
  const auth = getFirebaseAuth();
  const db = getDb();
  const [user] = useAuthState(auth);
  const [cities, setCities] = useState<City[]>([]);
  const [playerName, setPlayerName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const citiesQ = query(collection(db, "cities"), where("ownerId", "==", user.uid));
      const snap = await getDocs(citiesQ);
      const list: City[] = [];
      snap.forEach((d) => list.push(d.data() as City));
      setCities(list);

      const playersQ = query(collection(db, "players"), where("userId", "==", user.uid));
      const psnap = await getDocs(playersQ);
      const p = psnap.docs[0]?.data() as { name?: string } | undefined;
      setPlayerName(p?.name ?? user.email ?? "Spieler");
    })();
  }, [user, db]);

  if (!user) {
    return (
      <div className="p-6">
        <p className="mb-4">Bitte anmelden, um deine Städte zu sehen.</p>
        <Link className="underline" href="/auth/signin">Login</Link>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Willkommen, {playerName}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => (
          <Link key={c.id} href={`/city/${c.id}`} className="border rounded p-4 hover:bg-[#f9f9f9] block">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-gray-600">{c.continent} / {c.region} ({c.territory})</div>
          </Link>
        ))}
      </div>
    </div>
  );
}


