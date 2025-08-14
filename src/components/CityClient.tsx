"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { getDb } from "../../firebase";
import ResourceBar from "./ResourceBar";

type BuildTask = {
    building: string;
    targetLevel: number;
    startedAt: number;
    durationSec: number;
};

interface City extends DocumentData {
    id: string;
    name: string;
    x: number;
    y: number;
    location: {
      continent: string;
      region: string;
      territory: number;
  };
    resources: {
        food: number;
        wood: number;
        stone: number;
        mana: number;
        godtears: number;
    };
    buildings?: Record<string, number>;
    buildQueue?: BuildTask[];
}

export default function CityClient({ cityId, userId }: { cityId: string, userId: string }) {
    const [city, setCity] = useState<City | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!cityId || !userId) {
            setError("City ID or User ID is missing.");
            setLoading(false);
            return;
        };
        const db = getDb();
        const cityRef = doc(db, "users", userId, "cities", cityId);

        const unsubscribe = onSnapshot(cityRef, (docSnap) => {
            if (docSnap.exists()) {
                setCity({ id: docSnap.id, ...docSnap.data() } as City);
            } else {
                setError("City not found.");
                setCity(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching city data:", err);
            setError("Failed to load city data.");
            setLoading(false);
        });

        return () => unsubscribe();

    }, [cityId, userId]);

    if (loading) {
        return <div className="p-6">Loading city...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-500">Error: {error}</div>;
    }

    if (!city) {
        return <div className="p-6">No city data available.</div>;
    }

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
            <ResourceBar resources={city.resources} />
            {city.buildQueue && city.buildQueue.length > 0 && (
                <div className="ui-panel p-3">
                    <div className="font-medium mb-2">Aktive Aufträge</div>
                    <div className="grid gap-1 text-sm">
                        {city.buildQueue.map((t: BuildTask, i: number) => (
                            <div key={i}>
                                Bau {t.building} → L{t.targetLevel} – {Math.max(0, Math.ceil((t.startedAt + t.durationSec * 1000 - Date.now()) / 1000))}s verbleibend
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
