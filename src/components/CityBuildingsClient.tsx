"use client";

import { useState, useEffect, useRef } from "react";
import { useCity } from "./CityDataProvider";
import { BuildingKey, BuildingQueueItem } from "@/types";
import { BUILDING_CONFIG } from "@/config/buildings.config";
import Modal from "./Modal";
import { Clock } from "lucide-react";
import Image from "next/image";
import { formatTime, getTimestampInMs } from "@/lib/utils";
import UpgradeModalContent from "./ui/UpgradeModalContent";

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
      (item: { endTime: unknown }) =>
        getTimestampInMs(item.endTime) <= Date.now()
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
    return city.buildingQueue?.find(
      (item: { buildingId: string }) => item.buildingId === buildingId
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gebäude</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(BUILDING_CONFIG).map(([key, config]) => {
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
            config={BUILDING_CONFIG[selected]}
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
