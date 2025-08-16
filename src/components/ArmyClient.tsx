"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { getDb } from "@/../firebase";
import Modal from "@/components/Modal";
import Image from "next/image";

type BuildTask = {
  unit: string;
  amount: number;
  startedAt: number;
  durationSec: number;
};

interface City {
  id: string;
  name: string;
  resources: {
    food: number;
    wood: number;
    stone: number;
    mana: number;
  };
  units?: Record<string, number>;
  trainingQueue?: BuildTask[];
}

const UNIT_DEFS: Record<
  string,
  {
    foodCost: number;
    trainTime: number;
    description: string;
  }
> = {
  Schwertkämpfer: {
    foodCost: 10,
    trainTime: 30,
    description: "Starke Nahkampfeinheit mit hoher Verteidigung",
  },
  Bogenschütze: {
    foodCost: 12,
    trainTime: 45,
    description: "Fernkampfeinheit mit hohem Schaden",
  },
  Kavallerist: {
    foodCost: 20,
    trainTime: 60,
    description: "Schnelle Einheit mit hoher Mobilität",
  },
};

interface ArmyClientProps {
  cityId: string;
  userId: string;
}

export default function ArmyClient({ cityId, userId }: ArmyClientProps) {
  const [city, setCity] = useState<City | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!cityId || !userId) return;

    const db = getDb();
    const cityRef = doc(db, "users", userId, "cities", cityId);

    const unsubscribe = onSnapshot(cityRef, (snap) => {
      if (snap.exists()) {
        setCity({ id: snap.id, ...snap.data() } as City);
      } else {
        setCity(null);
      }
    });

    return () => unsubscribe();
  }, [cityId, userId]);

  async function recruit(unit: string) {
    if (!city) return;
    setBusy(unit);

    try {
      const db = getDb();
      await runTransaction(db, async (trx) => {
        const ref = doc(db, "users", userId, "cities", cityId);
        const snap = await trx.get(ref);
        if (!snap.exists()) throw new Error("Stadt nicht gefunden");

        const c = snap.data() as City;
        const cost = UNIT_DEFS[unit].foodCost;

        if (c.resources.food < cost) {
          throw new Error("Nicht genügend Nahrung");
        }

        const units = { ...(c.units ?? {}) };
        units[unit] = (units[unit] ?? 0) + 1;

        const queue = [...(c.trainingQueue ?? [])];
        queue.push({
          unit,
          amount: 1,
          startedAt: Date.now(),
          durationSec: UNIT_DEFS[unit].trainTime,
        });

        trx.update(ref, {
          "resources.food": c.resources.food - cost,
          units,
          trainingQueue: queue,
        });
      });
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!city) {
    return <div className="p-6">Lade Armee-Daten...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Armee verwalten</h1>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-3">Deine Truppen</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(city.units ?? {}).map(([unit, count]) => (
            <div
              key={unit}
              className="flex items-center gap-2 bg-gray-700/50 rounded p-2"
            >
              <Image
                src="/assets/ui/buttons/bronze_round.png"
                width={24}
                height={24}
                alt={unit}
                className="icon-tile"
              />
              <span className="font-medium">{unit}:</span>
              <span className="text-yellow-400">{count}</span>
            </div>
          ))}
          {Object.keys(city.units ?? {}).length === 0 && (
            <div className="text-gray-400 col-span-full">
              Noch keine Einheiten vorhanden
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-medium">Einheiten rekrutieren</h2>
        {Object.keys(UNIT_DEFS).map((unit) => {
          const def = UNIT_DEFS[unit];
          const canAfford = city.resources.food >= def.foodCost;
          const isTraining = city.trainingQueue?.some((t) => t.unit === unit);

          return (
            <div
              key={unit}
              className="border border-gray-700 bg-gray-800/50 rounded p-3 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
            >
              <div
                onClick={() => setSelected(unit)}
                className="cursor-pointer flex-1"
              >
                <div className="font-medium flex items-center gap-2">
                  <Image
                    src="/assets/ui/buttons/bronze_round.png"
                    width={18}
                    height={18}
                    alt={unit}
                    className="icon-tile"
                  />
                  {unit}
                </div>
                <div className="text-sm text-gray-400">
                  Kosten: {def.foodCost} Nahrung • Zeit: {def.trainTime}s
                </div>
                {isTraining && (
                  <div className="text-xs text-green-400">
                    Training läuft...
                  </div>
                )}
              </div>
              <button
                className="border border-gray-600 bg-gray-700 hover:bg-gray-600 rounded px-3 py-1 disabled:opacity-50 transition-colors"
                disabled={!canAfford || busy === unit}
                onClick={() => recruit(unit)}
              >
                {busy === unit ? "..." : "Rekrutieren"}
              </button>
            </div>
          );
        })}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ?? undefined}
      >
        {selected && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/ui/buttons/bronze_round.png"
                width={48}
                height={48}
                alt={selected}
                className="icon-tile"
              />
              <div>
                <h3 className="text-xl font-bold">{selected}</h3>
                <p className="text-gray-400 text-sm">
                  {UNIT_DEFS[selected].description}
                </p>
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-sm space-y-1">
                <div>Kosten: {UNIT_DEFS[selected].foodCost} Nahrung</div>
                <div>
                  Trainingszeit: {UNIT_DEFS[selected].trainTime} Sekunden
                </div>
              </div>
            </div>
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 self-start transition-colors"
              disabled={busy === selected}
              onClick={() => recruit(selected)}
            >
              {busy === selected ? "..." : "Rekrutieren"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
