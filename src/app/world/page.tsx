"use client";
import { useEffect, useMemo, useState } from "react";
import { getDb } from "../../../firebase";
import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp, getDocs } from "firebase/firestore";
import Link from "next/link";

type City = { id: string; name: string; food: number; continent?: string; region?: string };

export default function WorldPage(props: { searchParams?: { city?: string } }) {
  const db = useMemo(() => getDb(), []);
  const [city, setCity] = useState<City | null>(null);
  const [target, setTarget] = useState<string>("");
  const [allCities, setAllCities] = useState<City[]>([]);

  useEffect(() => {
    const id = props?.searchParams?.city;
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, "cities", id));
      if (snap.exists()) setCity(snap.data() as City);
    })();
  }, [db, props?.searchParams?.city]);

  useEffect(() => {
    (async () => {
      const cs = await getDocs(collection(db, "cities"));
      setAllCities(cs.docs.map((d) => d.data() as City));
    })();
  }, [db]);

  async function sendMission() {
    if (!city || !target) return;
    await runTransaction(db, async (trx) => {
      const cRef = doc(db, "cities", city.id);
      const csnap = await trx.get(cRef);
      if (!csnap.exists()) return;
      const c = csnap.data() as City;
      // Simple food cost for mission
      const cost = 20;
      if (c.food < cost) return;
      trx.update(cRef, { food: c.food - cost, updatedAt: serverTimestamp() });
    });
    await addDoc(collection(db, "reports"), {
      type: "mission",
      cityId: city.id,
      target,
      createdAt: serverTimestamp(),
      message: `Armee aus ${city.name} auf Mission nach ${target}`,
    });
    setTarget("");
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link className="underline" href="/dashboard">← Zurück</Link>
      <h1 className="text-2xl font-semibold">Welt</h1>
      <p className="text-sm text-gray-600">Wähle ein Ziel aus bekannten Städten (Stub). Später wird dies eine Karte.</p>
      <div className="flex items-center gap-2">
        <label>Ziel:</label>
        <select className="border rounded px-2 py-1" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">— Ziel wählen —</option>
          {allCities.filter((c) => !city || c.id !== city.id).map((c) => (
            <option key={c.id} value={`${c.continent}/${c.region}/${c.id}`}>{c.name} ({c.continent}/{c.region})</option>
          ))}
        </select>
        <button className="border rounded px-3 py-1" onClick={sendMission} disabled={!city || !target}>Senden</button>
      </div>
    </div>
  );
}


