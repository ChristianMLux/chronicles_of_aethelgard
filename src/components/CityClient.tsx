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


  useEffect(() => {
    const ref = doc(db, "cities", cityId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setCity(snap.data() as City);
    });
   
    return () => {
      unsub();
 
    };
  }, []);

  

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
    </div>
  );
}