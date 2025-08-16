"use client";

import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  runTransaction,
  DocumentData,
} from "firebase/firestore";
import { getDb } from "../../firebase";
import {
  BUILDING_LIST,
  BUILDING_ICONS,
  BuildingKey,
  getBuildingUpgradeCost,
  canAfford,
  getBuildTimeSeconds,
  numberFmt,
} from "@/lib/game";
import Modal from "@/components/Modal";
import Image from "next/image";

type BuildTask = {
  building: string;
  targetLevel: number;
  startedAt: number;
  durationSec: number;
};
interface City extends DocumentData {
  id: string;
  name: string;
  resources: { food: number; wood: number; stone: number; mana: number };
  buildings: Record<string, number>;
  buildQueue?: BuildTask[];
}

export default function CityBuildingsClient({
  cityId,
  userId,
}: {
  cityId: string;
  userId: string;
}) {
  const [city, setCity] = useState<City | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<BuildingKey | null>(null);

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

  async function upgrade(building: BuildingKey) {
    setBusy(building);
    try {
      const db = getDb();
      await runTransaction(db, async (trx) => {
        const ref = doc(db, "users", userId, "cities", cityId);
        const snap = await trx.get(ref);
        if (!snap.exists()) throw new Error("Stadt nicht gefunden");

        const c = snap.data() as City;
        const level = c.buildings?.[building] ?? 0;
        const cost = getBuildingUpgradeCost(building, level);

        if (!canAfford(c.resources, cost))
          throw new Error("Nicht genügend Ressourcen");

        const queue = [...(c.buildQueue ?? [])];
        const targetLevel = level + 1;
        const durationSec = getBuildTimeSeconds(building, targetLevel);
        queue.push({
          building,
          targetLevel,
          startedAt: Date.now(),
          durationSec,
        });

        trx.update(ref, {
          buildQueue: queue,
          "resources.stone": c.resources.stone - (cost.stone ?? 0),
          "resources.wood": c.resources.wood - (cost.wood ?? 0),
          "resources.food": c.resources.food - (cost.food ?? 0),
          "resources.mana": c.resources.mana - (cost.mana ?? 0),
        });
      });
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!city) return <div className="p-6">Lade...</div>;

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Gebäude ausbauen</h1>
      <div className="grid gap-3">
        {BUILDING_LIST.map((b) => {
          const level = city.buildings?.[b] ?? 0;
          const cost = getBuildingUpgradeCost(b, level);
          const can = canAfford(city.resources, cost);
          return (
            <div
              key={b}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div onClick={() => setSelected(b)} className="cursor-pointer">
                <div className="font-medium flex items-center gap-2">
                  <Image
                    src={BUILDING_ICONS[b]}
                    width={18}
                    height={18}
                    alt={b}
                    className="icon-tile"
                  />
                  {b} — L{level}
                </div>
                <div className="text-sm text-gray-600">
                  Kosten: S {numberFmt.format(cost.stone ?? 0)} / H{" "}
                  {numberFmt.format(cost.wood ?? 0)} / F{" "}
                  {numberFmt.format(cost.food ?? 0)} / M{" "}
                  {numberFmt.format(cost.mana ?? 0)}
                </div>
                <div className="text-xs text-gray-600">
                  Bauzeit: ~{getBuildTimeSeconds(b, level + 1)}s
                </div>
                {city.buildQueue
                  ?.filter((t) => t.building === b)
                  .map((t, idx) => (
                    <div key={idx} className="text-xs text-gray-500">
                      Bau läuft, endet in ~
                      {Math.max(
                        0,
                        Math.ceil(
                          (t.startedAt + t.durationSec * 1000 - Date.now()) /
                            1000
                        )
                      )}
                      s
                    </div>
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
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `${selected} — L${city.buildings?.[selected] ?? 0}`
            : undefined
        }
      >
        {selected && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src={BUILDING_ICONS[selected]}
                width={48}
                height={48}
                alt={selected}
                className="icon-tile"
              />
              <div>
                <h3 className="text-xl font-bold">{selected}</h3>
                <p className="text-gray-600">
                  Level {city.buildings?.[selected] ?? 0}
                </p>
              </div>
            </div>
            <div className="text-sm">
              Zum Ausbau auf Level {(city.buildings?.[selected] ?? 0) + 1}{" "}
              benötigt:
            </div>
            <div className="text-sm text-gray-800">
              Stein{" "}
              {numberFmt.format(
                getBuildingUpgradeCost(
                  selected,
                  city.buildings?.[selected] ?? 0
                ).stone ?? 0
              )}{" "}
              · Holz{" "}
              {numberFmt.format(
                getBuildingUpgradeCost(
                  selected,
                  city.buildings?.[selected] ?? 0
                ).wood ?? 0
              )}{" "}
              · Nahrung{" "}
              {numberFmt.format(
                getBuildingUpgradeCost(
                  selected,
                  city.buildings?.[selected] ?? 0
                ).food ?? 0
              )}{" "}
              · Mana{" "}
              {numberFmt.format(
                getBuildingUpgradeCost(
                  selected,
                  city.buildings?.[selected] ?? 0
                ).mana ?? 0
              )}
            </div>
            <div className="text-xs text-gray-600">
              Dauer: ~
              {getBuildTimeSeconds(
                selected,
                (city.buildings?.[selected] ?? 0) + 1
              )}
              s
            </div>
            <button
              className="bg-black text-white rounded px-4 py-2 self-start"
              disabled={busy === selected}
              onClick={() => upgrade(selected)}
            >
              {busy === selected ? "..." : "Ausbauen"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
