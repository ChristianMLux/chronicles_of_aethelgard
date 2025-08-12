"use client";
import { useMemo, useState, useEffect } from "react";
import { getDb } from "../../../firebase";
import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import Modal from "@/components/Modal";
import Image from "next/image";

type City = { id: string; name: string; food: number; units?: Record<string, number> };

const UNIT_DEFS: Record<string, { foodCost: number }> = {
  Schwertkämpfer: { foodCost: 10 },
  Bogenschütze: { foodCost: 12 },
};

export default function ArmyPage(props: { searchParams?: { city?: string } }) {
  const db = useMemo(() => getDb(), []);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string | undefined>(props?.searchParams?.city);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // For simplicity, show all cities (in a real app, filter by user)
      const cs = await getDocs(collection(db, "cities"));
      const list = cs.docs.map((d) => d.data() as City);
      setCities(list);
      if (!selectedCityId && list[0]) setSelectedCityId(list[0].id);
    })();
  }, [db, selectedCityId]);

  useEffect(() => {
    if (!selectedCityId) return;
    (async () => {
      const snap = await getDoc(doc(db, "cities", selectedCityId));
      if (snap.exists()) setSelectedCity(snap.data() as City);
    })();
  }, [db, selectedCityId]);

  async function recruit(unit: string) {
    if (!selectedCity) return;
    setBusy(unit);
    try {
      await runTransaction(db, async (trx) => {
        const ref = doc(db, "cities", selectedCity.id);
        const snap = await trx.get(ref);
        if (!snap.exists()) return;
        const c = snap.data() as City;
        const cost = UNIT_DEFS[unit].foodCost;
        if (c.food < cost) return;
        const units = { ...(c.units ?? {}) };
        units[unit] = (units[unit] ?? 0) + 1;
        trx.update(ref, { food: c.food - cost, units, updatedAt: serverTimestamp() });
      });
      const snap = await getDoc(doc(db, "cities", selectedCity.id));
      if (snap.exists()) setSelectedCity(snap.data() as City);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link className="underline" href="/dashboard">← Zurück</Link>
      <h1 className="text-2xl font-semibold">Armee</h1>
      <div className="flex items-center gap-2">
        <label>Stadt:</label>
        <select className="border rounded px-2 py-1" value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)}>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      {selectedCity && (
        <>
        <div className="border rounded p-3 flex flex-col gap-3">
          <div className="text-sm text-gray-600">Nahrung: {selectedCity.food}</div>
          <div className="grid gap-2">
            {Object.keys(UNIT_DEFS).map((u) => (
              <div key={u} className="flex items-center justify-between border rounded p-2">
                <div className="cursor-pointer" onClick={() => setSelected(u)}>
                   <div className="font-medium flex items-center gap-2"><Image src="/assets/ui/buttons/bronze_round.png" width={18} height={18} alt="" className="icon-tile"/> {u}</div>
                  <div className="text-sm text-gray-600">Kosten: Nahrung {UNIT_DEFS[u].foodCost}</div>
                </div>
                <button className="border rounded px-3 py-1" disabled={busy === u} onClick={() => recruit(u)}>
                  {busy === u ? "..." : "Rekrutieren"}
                </button>
              </div>
            ))}
          </div>
          <div>
            <div className="font-medium mb-1">Aktuelle Einheiten</div>
            <div className="text-sm">
              {Object.entries(selectedCity.units ?? {}).map(([k, v]) => (
                <div key={k}>{k}: {v}</div>
              ))}
              {Object.keys(selectedCity.units ?? {}).length === 0 && <div>Keine Einheiten</div>}
            </div>
          </div>
        </div>
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ?? undefined}>
          {selected && (
            <div className="flex flex-col gap-3">
              <div className="h-40 bg-gray-200 rounded" />
              <div className="text-sm">Kosten pro Einheit: Nahrung {UNIT_DEFS[selected].foodCost}</div>
              <button className="bg-black text-white rounded px-4 py-2 self-start" disabled={busy === selected} onClick={() => recruit(selected)}>Rekrutieren</button>
            </div>
          )}
        </Modal>
        </>
      )}
    </div>
  );
}


