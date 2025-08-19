"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { getDb } from "@/../firebase";
import {
  RESEARCH_LIST,
  ResearchKey,
  getResearchUpgradeCost,
  getResearchTimeSeconds,
} from "@/lib/game";
import Modal from "@/components/Modal";
import Image from "next/image";
import { numberFmt } from "@/lib/utils";

interface City {
  id: string;
  name: string;
  resources: {
    food: number;
    wood: number;
    stone: number;
    mana: number;
  };
  researches?: Record<string, number>;
}

interface ResearchClientProps {
  cityId: string;
  userId: string;
}

const RESEARCH_DESCRIPTIONS: Record<ResearchKey, string> = {
  Blacksmithing: "Erhöht die Waffenproduktion um 10% pro Level",
  Armorsmithing: "Erhöht die Rüstungsproduktion um 10% pro Level",
  Administration: "Erhöht die Rohstoffproduktion um 10% pro Level",
  Enchanting: "Erhöht die Manaproduktion um 10% pro Level",
  Logistics: "Erhöht die Truppenbewegung um 2% pro Level",
  Espionage: "Erhöht die Geschwindigkeit von Spionen um 2% pro Level",
};

export default function ResearchClient({
  cityId,
  userId,
}: ResearchClientProps) {
  const [city, setCity] = useState<City | null>(null);
  const [busy, setBusy] = useState<ResearchKey | null>(null);
  const [selected, setSelected] = useState<ResearchKey | null>(null);

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

  async function research(key: ResearchKey) {
    if (!city) return;
    setBusy(key);

    try {
      const db = getDb();
      await runTransaction(db, async (trx) => {
        const ref = doc(db, "users", userId, "cities", cityId);
        const snap = await trx.get(ref);
        if (!snap.exists()) throw new Error("Stadt nicht gefunden");

        const c = snap.data() as City;
        const level = c.researches?.[key] ?? 0;
        const nextLevel = level + 1;
        const manaCost = getResearchUpgradeCost(nextLevel);

        if (c.resources.mana < manaCost) {
          throw new Error("Nicht genügend Mana");
        }

        const nextResearches = { ...(c.researches ?? {}) };
        nextResearches[key] = nextLevel;

        trx.update(ref, {
          "resources.mana": c.resources.mana - manaCost,
          researches: nextResearches,
        });
      });
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!city) {
    return <div className="p-6">Lade Forschungs-Daten...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Forschungszentrum</h1>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/icons/resources/mana.png"
            width={24}
            height={24}
            alt="Mana"
            className="icon-tile"
          />
          <span className="text-gray-400">Verfügbares Mana:</span>
          <span className="text-purple-400 font-bold">
            {numberFmt.format(city.resources.mana)}
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-medium">Technologien</h2>
        {RESEARCH_LIST.map((key) => {
          const level = city.researches?.[key] ?? 0;
          const cost = getResearchUpgradeCost(level + 1);
          const canAfford = city.resources.mana >= cost;
          const time = getResearchTimeSeconds(level + 1);

          return (
            <div
              key={key}
              className="border border-gray-700 bg-gray-800/50 rounded p-3 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
            >
              <div
                className="cursor-pointer flex-1"
                onClick={() => setSelected(key)}
              >
                <div className="font-medium flex items-center gap-2">
                  <Image
                    src="/assets/icons/resources/mana.png"
                    width={18}
                    height={18}
                    alt=""
                    className="icon-tile"
                  />
                  {key} – Level {level}
                </div>
                <div className="text-sm text-gray-400">
                  Kosten: {numberFmt.format(cost)} Mana • Zeit: {time}s
                </div>
                {RESEARCH_DESCRIPTIONS[key] && (
                  <div className="text-xs text-gray-500 mt-1">
                    {RESEARCH_DESCRIPTIONS[key]}
                  </div>
                )}
              </div>
              <button
                className="border border-gray-600 bg-gray-700 hover:bg-gray-600 rounded px-3 py-1 disabled:opacity-50 transition-colors"
                onClick={() => research(key)}
                disabled={!canAfford || busy === key}
              >
                {busy === key ? "..." : "Forschen"}
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
            ? `${selected} – Level ${city.researches?.[selected] ?? 0}`
            : undefined
        }
      >
        {selected && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/assets/icons/resources/mana.png"
                width={48}
                height={48}
                alt=""
                className="icon-tile"
              />
              <div>
                <h3 className="text-xl font-bold">{selected}</h3>
                <p className="text-gray-400">
                  Aktuell: Level {city.researches?.[selected] ?? 0}
                </p>
              </div>
            </div>

            {RESEARCH_DESCRIPTIONS[selected] && (
              <div className="bg-gray-800 rounded p-3">
                <p className="text-sm">{RESEARCH_DESCRIPTIONS[selected]}</p>
              </div>
            )}

            <div className="text-sm space-y-1">
              <div>
                Upgrade auf Level {(city.researches?.[selected] ?? 0) + 1}
              </div>
              <div className="text-gray-400">
                Kosten:{" "}
                {numberFmt.format(
                  getResearchUpgradeCost((city.researches?.[selected] ?? 0) + 1)
                )}{" "}
                Mana
              </div>
              <div className="text-gray-400">
                Dauer: ~
                {getResearchTimeSeconds((city.researches?.[selected] ?? 0) + 1)}
                s
              </div>
            </div>

            <button
              className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 self-start transition-colors"
              disabled={busy === selected}
              onClick={() => research(selected)}
            >
              {busy === selected ? "..." : "Forschen"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
