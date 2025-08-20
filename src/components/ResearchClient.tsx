"use client";

import { useState, useEffect, useRef } from "react";
import { useCity } from "./CityDataProvider";
import { ResearchKey, ResearchQueueItem } from "@/types";
import { useAuth } from "./AuthProvider";
import { formatTime, getTimestampInMs } from "@/lib/utils";
import { RESEARCH_CONFIG } from "@/config/research.config";
import { Clock } from "lucide-react";
import Image from "next/image";
import Modal from "./Modal";
import { UpgradeModalContentResearch } from "./ui/UpgradeModalContent";

export default function ResearchClient() {
  const { city } = useCity();
  const { user } = useAuth();

  const [selected, setSelected] = useState<ResearchKey | null>(null);
  const [busy, setBusy] = useState<ResearchKey | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const isProcessing = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      !city?.researchQueue ||
      city.researchQueue.length === 0 ||
      isProcessing.current
    ) {
      return;
    }

    const hasCompletedResearch = city.researchQueue.some(
      (item) => getTimestampInMs(item.endTime) <= Date.now()
    );

    if (hasCompletedResearch) {
      const processResearch = async () => {
        isProcessing.current = true;
        try {
          await fetch("/api/game/research/process-research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cityId: city.id }),
          });
        } catch (err) {
          console.error("Error processing research queue: ", err);
        } finally {
          setTimeout(() => {
            isProcessing.current = false;
          }, 2000);
        }
      };
      processResearch();
    }
  }, [city, currentTime]);

  const handleResearch = async (researchId: ResearchKey) => {
    if (!city || !user) return;
    setBusy(researchId);
    setError(null);

    const currentLevel = city.research[researchId] || 0;
    const targetLevel = currentLevel + 1;

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/game/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cityId: city.id,
          researchId,
          targetLevel: targetLevel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler bei der Forschung.");
      }
      setSelected(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ein unbekannter Fehler ist aufgetreten.");
      }
    } finally {
      setBusy(null);
    }
  };

  if (!city) return <div>Lade Stadt-Daten...</div>;

  const getResearchQueueItem = (
    researchId: ResearchKey
  ): ResearchQueueItem | undefined => {
    return city?.researchQueue?.find((item) => item.researchId === researchId);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Forschung</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(RESEARCH_CONFIG) as ResearchKey[]).map((researchKey) => {
          const config = RESEARCH_CONFIG[researchKey];
          const currentLevel = city.research?.[researchKey] || 0;
          const queueItem = getResearchQueueItem(researchKey);
          const isResearchingThis = !!queueItem;
          const nextLevel = currentLevel + 1;

          const remainingTime = queueItem
            ? Math.max(
                0,
                (getTimestampInMs(queueItem.endTime) - currentTime) / 1000
              )
            : 0;

          return (
            <div
              key={researchKey}
              className="bg-panel-2/50 p-4 rounded-lg border border-outline/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
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
                      {isResearchingThis &&
                        ` (wird auf ${nextLevel} erforscht)`}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 min-h-[40px]">
                  {config.description}
                </p>
              </div>

              <div className="mt-4 flex-grow flex items-end">
                {isResearchingThis ? (
                  <div className="w-full flex items-center justify-center bg-gray-800 p-2 rounded-md">
                    <Clock size={16} className="mr-2 text-yellow-400" />
                    <span className="font-mono text-lg">
                      {formatTime(remainingTime)}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelected(researchKey)}
                    className="ui-button w-full"
                    disabled={isResearchingThis}
                  >
                    Forschen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)}>
          <UpgradeModalContentResearch
            researchKey={selected}
            config={RESEARCH_CONFIG[selected]}
            city={city}
            onConfirm={handleResearch}
            onClose={() => setSelected(null)}
            isBusy={busy === selected}
            error={error}
          />
        </Modal>
      )}
    </div>
  );
}
