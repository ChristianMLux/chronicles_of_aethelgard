"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDb } from "../../../../../firebase";
import { BUILDING_LIST, BuildingKey, canAfford, getBuildingUpgradeCost, getBuildTimeSeconds, numberFmt } from "@/lib/game";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import Link from "next/link";
import Modal from "@/components/Modal";
import Image from "next/image";

type BuildTask = { building: string; targetLevel: number; startedAt: number; durationSec: number };
type City = {
  id: string;
  name: string;
  stone: number; wood: number; food: number; mana: number;
  buildings: Record<string, number>;
  production: { Stein?: number; Holz?: number; Nahrung?: number; Mana?: number };
  buildQueue?: BuildTask[];
};

export default function CityBuildingsPage({ params }: { params: { id: string } }) {
  const db = useMemo(() => getDb(), []);
  const cityId = params.id;
  const [city, setCity] = useState<City | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<BuildingKey | null>(null);

  const load = useCallback(async () => {
    const snap = await getDoc(doc(db, "cities", cityId));
    if (snap.exists()) setCity(snap.data() as City);
  }, [db, cityId]);

  useEffect(() => { void load(); }, [load]);

  async function upgrade(building: BuildingKey) {
    setBusy(building);
    try {
      await runTransaction(db, async (trx) => {
        const ref = doc(db, "cities", cityId);
        const snap = await trx.get(ref);
        if (!snap.exists()) return;
        const c = snap.data() as City;
        const level = (c.buildings?.[building] ?? 0);
        const cost = getBuildingUpgradeCost(building, level);
        const available = { stone: c.stone, wood: c.wood, food: c.food, mana: c.mana };
        if (!canAfford(available, cost)) return;
        const queue = [...(c.buildQueue ?? [])];
        const targetLevel = level + 1;
        const durationSec = 30 * targetLevel;
        queue.push({ building, targetLevel, startedAt: Date.now(), durationSec });
        trx.update(ref, {
          buildQueue: queue,
          stone: c.stone - (cost.stone ?? 0),
          wood: c.wood - (cost.wood ?? 0),
          food: c.food - (cost.food ?? 0),
          mana: c.mana - (cost.mana ?? 0),
        });
      });
    } finally {
      await load();
      setBusy(null);
    }
  }

  if (!city) return <div className="p-6">Lade...</div>;

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link className="underline" href={`/city/${city.id}`}>← Zur Stadt</Link>
      <h1 className="text-2xl font-semibold">Gebäude ausbauen</h1>
      <div className="grid gap-3">
        {BUILDING_LIST.map((b) => {
          const level = city.buildings?.[b] ?? 0;
          const cost = getBuildingUpgradeCost(b, level);
          const can = canAfford({ stone: city.stone, wood: city.wood, food: city.food, mana: city.mana }, cost);
          return (
            <div key={b} className="border rounded p-3 flex items-center justify-between">
              <div onClick={() => setSelected(b)} className="cursor-pointer">
                <div className="font-medium flex items-center gap-2"><Image src="/assets/icons/resources/stone.png" width={18} height={18} alt="" className="icon-tile"/> {b} — L{level}</div>
                <div className="text-sm text-gray-600">Kosten: S {numberFmt.format(cost.stone ?? 0)} / H {numberFmt.format(cost.wood ?? 0)} / F {numberFmt.format(cost.food ?? 0)} / M {numberFmt.format(cost.mana ?? 0)}</div>
                <div className="text-xs text-gray-600">Bauzeit: ~{getBuildTimeSeconds(b, level + 1)}s</div>
                {city.buildQueue?.filter((t) => t.building === b).map((t, idx) => (
                  <div key={idx} className="text-xs text-gray-500">Bau läuft, endet in ~{Math.max(0, Math.ceil((t.startedAt + t.durationSec * 1000 - Date.now())/1000))}s</div>
                ))}
              </div>
              <button
                className="border rounded px-3 py-1 disabled:opacity-50"
                onClick={() => upgrade(b)}
                disabled={!can || busy === b}
              >
                {busy === b ? "..." : "Ausbauen"}
              </button>
            </div>
          );
        })}
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected} — L${city.buildings?.[selected] ?? 0}` : undefined}>
        {selected && (
          <BuildingDetails
            city={city}
            building={selected}
            onUpgrade={() => upgrade(selected)}
            busy={busy === selected}
          />
        )}
      </Modal>
    </div>
  );
}

function BuildingDetails({ city, building, onUpgrade, busy }: { city: City; building: BuildingKey; onUpgrade: () => void; busy: boolean }) {
  const level = city.buildings?.[building] ?? 0;
  const cost = getBuildingUpgradeCost(building, level);
  return (
    <div className="flex flex-col gap-3">
      <div className="h-40 bg-gray-200 rounded" />
      <div className="text-sm">Zum Ausbau auf Level {level + 1} benötigt:</div>
      <div className="text-sm text-gray-800">Stein {numberFmt.format(cost.stone ?? 0)} · Holz {numberFmt.format(cost.wood ?? 0)} · Nahrung {numberFmt.format(cost.food ?? 0)} · Mana {numberFmt.format(cost.mana ?? 0)}</div>
      <div className="text-xs text-gray-600">Dauer: ~{getBuildTimeSeconds(building, level + 1)}s</div>
      <button className="bg-black text-white rounded px-4 py-2 self-start" disabled={busy} onClick={onUpgrade}>
        {busy ? "..." : "Ausbauen"}
      </button>
    </div>
  );
}


