"use client";
import { useEffect, useMemo, useState } from "react";
import { getDb } from "../../firebase";
import { collection, doc, getDoc, onSnapshot, runTransaction, serverTimestamp, addDoc } from "firebase/firestore";
import { numberFmt } from "@/lib/game";
import ResourceBar from "@/components/ResourceBar";

type BuildTask = { building: string; targetLevel: number; startedAt: number; durationSec: number };
type City = {
  id: string;
  name: string;
  continent: string;
  region: string;
  territory: number;
  stone: number;
  wood: number;
  mana: number;
  food: number;
  capStone: number;
  capWood: number;
  capMana: number;
  capFood: number;
  production: { Stein?: number; Holz?: number; Nahrung?: number; Mana?: number };
  lastTickAt: number;
  buildings?: Record<string, number>;
  buildQueue?: BuildTask[];
};

export default function CityClient({ cityId }: { cityId: string }) {
  const db = useMemo(() => getDb(), []);
  const [city, setCity] = useState<City | null>(null);
  const [loadingTick, setLoadingTick] = useState(false);

  useEffect(() => {
    const ref = doc(db, "cities", cityId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setCity(snap.data() as City);
    });
    const id = setInterval(() => void doTick(), 5000);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, []);

  const doTick = async () => {
    setLoadingTick(true);
    try {
      await runTransaction(db, async (trx) => {
        const ref = doc(db, "cities", cityId);
        const snap = await trx.get(ref);
        if (!snap.exists()) return;
        const c = snap.data() as City;
        const now = Date.now();
        const elapsedSec = Math.max(0, (now - (c.lastTickAt ?? now)) / 1000);
        if (elapsedSec <= 0) return;
        const prod = c.production || {};
        const addAmt = (perHour?: number) => ((perHour ?? 0) / 3600) * elapsedSec;
        const next: Partial<City> = {
          stone: Math.min(c.stone + addAmt(prod.Stein), c.capStone),
          wood: Math.min(c.wood + addAmt(prod.Holz), c.capWood),
          food: Math.min(c.food + addAmt(prod.Nahrung), c.capFood),
          mana: Math.min(c.mana + addAmt(prod.Mana), c.capMana),
          lastTickAt: now,
          updatedAt: serverTimestamp(),
        };
        // process build queue completion
        if (c.buildQueue && c.buildQueue.length > 0) {
          const remaining: BuildTask[] = [];
          let buildings = { ...(c.buildings ?? {}) };
          for (const task of c.buildQueue) {
            const endAt = task.startedAt + task.durationSec * 1000;
            if (now >= endAt) {
              buildings[task.building] = task.targetLevel;
            } else {
              remaining.push(task);
            }
          }
          (next as any).buildings = buildings;
          (next as any).buildQueue = remaining;
        }
        trx.update(ref, next as any);
      });
      // Log report
      if (city) {
        await addDoc(collection(db, "reports"), {
          type: "tick",
          cityId,
          message: `Ressourcen in ${city.name} aktualisiert`,
          createdAt: serverTimestamp(),
        });
      }
    } finally {
      setLoadingTick(false);
    }
  };

  if (!city) return <div className="p-6">Lade Stadt...</div>;

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{city.name}</h1>
        <span className="text-sm text-gray-600">{city.continent} / {city.region} ({city.territory})</span>
      </div>
      <div className="flex gap-3 text-sm">
        <a className="ui-link" href={`/city/${cityId}/buildings`}>Gebäude</a>
        <a className="ui-link" href={`/research`}>Forschung</a>
        <a className="ui-link" href={`/army?city=${cityId}`}>Armee</a>
        <a className="ui-link" href={`/world?city=${cityId}`}>Welt</a>
        <a className="ui-link" href={`/reports`}>Berichte</a>
      </div>
      <ResourceBar stone={city.stone} wood={city.wood} food={city.food} mana={city.mana} />
      {city.buildQueue && city.buildQueue.length > 0 && (
        <div className="ui-panel p-3">
          <div className="font-medium mb-2">Aktive Aufträge</div>
          <div className="grid gap-1 text-sm">
            {city.buildQueue.map((t, i) => (
              <div key={i}>Bau {t.building} → L{t.targetLevel} – {Math.max(0, Math.ceil((t.startedAt + t.durationSec * 1000 - Date.now())/1000))}s verbleibend</div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={doTick}
        className="self-start ui-button px-3 py-2"
        disabled={loadingTick}
      >
        {loadingTick ? "Aktualisiere..." : "Tick ausführen"}
      </button>
    </div>
  );
}

// old card removed; ResourceBar used instead


