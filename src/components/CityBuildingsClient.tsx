"use client";

import { useState, useEffect, useRef } from "react";
import { useCity } from "./CityDataProvider";
import { BuildingKey, City, BuildingQueueItem } from "@/types";
import { buildingConfig, BuildingTypeConfig } from "@/lib/game";
import Modal from "./Modal";
import { ResourceBar } from "./ResourceBar";
import { Clock } from "lucide-react";
import Image from "next/image"; // NEU: Image-Komponente importieren

// Hilfsfunktion zur Formatierung der verbleibenden Zeit
function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTimestampInMs(timeValue: any): number {
  if (timeValue && typeof timeValue.toDate === "function")
    return timeValue.toDate().getTime();
  if (timeValue && typeof timeValue.seconds === "number")
    return timeValue.seconds * 1000;
  if (timeValue instanceof Date) return timeValue.getTime();
  if (typeof timeValue === "string") {
    const date = new Date(timeValue);
    if (!isNaN(date.getTime())) return date.getTime();
  }
  return Date.now();
}

export function CityBuildingsClient() {
  const { city, loading } = useCity();
  const [selected, setSelected] = useState<BuildingKey | null>(null);
  const [busy, setBusy] = useState<BuildingKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const isProcessing = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      !city?.buildingQueue ||
      city.buildingQueue.length === 0 ||
      isProcessing.current
    ) {
      return;
    }

    const hasCompletedBuilds = city.buildingQueue.some(
      (item) => getTimestampInMs(item.endTime) <= Date.now()
    );

    if (hasCompletedBuilds) {
      const processBuilds = async () => {
        isProcessing.current = true;
        try {
          await fetch("/api/game/build/process-builds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cityId: city.id }),
          });
        } catch (err) {
          console.error("Fehler beim Verarbeiten der Bauten:", err);
        } finally {
          isProcessing.current = false;
        }
      };
      processBuilds();
    }
  }, [city, currentTime]);

  async function upgrade(building: BuildingKey) {
    if (!city) return;
    setBusy(building);
    setError(null);

    try {
      const response = await fetch("/api/game/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityId: city.id, buildingId: building }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Ein Fehler ist aufgetreten.");
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein unerwarteter Fehler.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div>Lade Stadt-Daten...</div>;
  if (!city) return <div>Stadt nicht gefunden.</div>;

  const getBuildingQueueItem = (
    buildingId: BuildingKey
  ): BuildingQueueItem | undefined => {
    return city.buildingQueue?.find((item) => item.buildingId === buildingId);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gebäude</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(buildingConfig).map(([key, config]) => {
          const buildingKey = key as BuildingKey;
          const currentLevel = city.buildings[buildingKey] || 0;
          const queueItem = getBuildingQueueItem(buildingKey);
          const isUpgrading = !!queueItem;
          const targetLevel = isUpgrading
            ? queueItem.targetLevel
            : currentLevel + 1;

          const remainingTime = queueItem
            ? Math.max(
                0,
                (getTimestampInMs(queueItem.endTime) - currentTime) / 1000
              )
            : 0;

          return (
            <div
              key={buildingKey}
              className="bg-panel-2/50 p-4 rounded-lg border border-outline/50 flex flex-col"
            >
              <div className="flex items-start gap-4">
                <Image
                  src={config.icon}
                  alt={config.name}
                  width={64}
                  height={64}
                  className="rounded-md object-cover"
                />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{config.name}</h3>
                  <p className="text-sm text-gray-400">
                    Level {currentLevel}
                    {isUpgrading && ` (wird auf ${targetLevel} ausgebaut)`}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex-grow flex items-end">
                {isUpgrading ? (
                  <div className="w-full flex items-center justify-center bg-gray-800 p-2 rounded-md">
                    <Clock size={16} className="mr-2 text-yellow-400" />
                    <span className="font-mono text-lg">
                      {formatTime(remainingTime)}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelected(buildingKey)}
                    className="ui-button w-full"
                    disabled={isUpgrading}
                  >
                    Ausbauen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)}>
          <UpgradeModalContent
            buildingKey={selected}
            config={buildingConfig[selected]}
            city={city}
            onConfirm={upgrade}
            onClose={() => setSelected(null)}
            isBusy={busy === selected}
            error={error}
          />
        </Modal>
      )}
    </div>
  );
}

function UpgradeModalContent({
  buildingKey,
  config,
  city,
  onConfirm,
  onClose,
  isBusy,
  error,
}: {
  buildingKey: BuildingKey;
  config: BuildingTypeConfig;
  city: City;
  onConfirm: (building: BuildingKey) => void;
  onClose: () => void;
  isBusy: boolean;
  error: string | null;
}) {
  const currentLevel = city.buildings[buildingKey] || 0;
  const nextLevel = currentLevel + 1;
  const upgradeDetails = config.levels[nextLevel];

  if (!upgradeDetails) {
    return (
      <div>
        <h3 className="text-xl font-bold mb-2">{config.name}</h3>
        <p>Maximale Stufe bereits erreicht.</p>
        <button onClick={onClose} className="ui-button-secondary w-full mt-4">
          Schließen
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-2">
        {config.name}: Level {nextLevel}
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        {upgradeDetails.description ||
          "Verbessert die Effizienz dieses Gebäudes."}
      </p>
      <div className="space-y-2 mb-4">
        <h4 className="font-semibold">Baukosten</h4>
        <ResourceBar
          resources={upgradeDetails.cost}
          cityResources={city.resources}
          mode="cost"
        />
        <div className="flex items-center text-sm">
          <Clock size={14} className="mr-2" />
          <span>Bauzeit: {formatTime(upgradeDetails.buildTime)}</span>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="flex gap-2 mt-6">
        <button onClick={onClose} className="ui-button-secondary w-full">
          Abbrechen
        </button>
        <button
          onClick={() => onConfirm(buildingKey)}
          className="ui-button w-full"
          disabled={isBusy}
        >
          {isBusy ? "Wird gebaut..." : "Ausbau bestätigen"}
        </button>
      </div>
    </div>
  );
}
