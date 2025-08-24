"use client";

import { useState, useEffect, useRef } from "react";
import { useCity } from "./CityDataProvider";
import { GameConfig, UnitKey } from "@/types";
import { useAuth } from "./AuthProvider";
import { formatTime } from "@/lib/utils";

interface ArmyClientProps {
  initialGameConfig: GameConfig;
}

export default function ArmyClient({ initialGameConfig }: ArmyClientProps) {
  const { city } = useCity();
  const { user } = useAuth();
  const [gameConfig] = useState(initialGameConfig);

  const [amounts, setAmounts] = useState<Record<UnitKey, number>>({
    swordsman: 1,
    archer: 1,
    knight: 1,
    spy: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trainingItem = city?.trainingQueue?.[0];
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const isProcessing = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!trainingItem) {
      setRemainingTime(null);
      return;
    }
    console.log(trainingItem);
    const endTimeMillis = trainingItem.endTime.toMillis();
    const now = currentTime;
    const remaining = Math.round((endTimeMillis - now) / 1000);
    setRemainingTime(remaining > 0 ? remaining : 0);
  }, [trainingItem, currentTime]);

  useEffect(() => {
    if (
      !city?.trainingQueue ||
      city.trainingQueue.length === 0 ||
      isProcessing.current
    ) {
      return;
    }

    const hasCompletedTraining = city.trainingQueue.some(
      (item) => item.endTime.toMillis() <= Date.now()
    );

    if (hasCompletedTraining) {
      const processTraining = async () => {
        isProcessing.current = true;
        try {
          await fetch("/api/game/train/process-training", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cityId: city.id }),
          });
        } catch (err) {
          console.error("Error processing training queue:", err);
        } finally {
          setTimeout(() => {
            isProcessing.current = false;
          }, 2000);
        }
      };
      processTraining();
    }
  }, [city, currentTime]);

  const handleAmountChange = (unitId: UnitKey, value: string) => {
    const amount = parseInt(value, 10);
    setAmounts((prev) => ({
      ...prev,
      [unitId]: isNaN(amount) || amount < 1 ? 1 : amount,
    }));
  };

  const handleRecruit = async (unitId: UnitKey) => {
    if (!city || !user) return;
    setIsLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/game/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cityId: city.id,
          unitId,
          amount: amounts[unitId],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler bei der Rekrutierung.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ein unbekannter Fehler ist aufgetreten.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isTrainingInProgress = trainingItem !== undefined;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Armee</h2>

      {error && (
        <div className="text-red-500 bg-red-100 p-2 rounded mb-4">{error}</div>
      )}

      {isTrainingInProgress && trainingItem && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-yellow-500">
          <h2 className="text-xl font-semibold text-yellow-400 mb-2">
            Rekrutierung läuft
          </h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg">
                {gameConfig.units[trainingItem.unitId as UnitKey]?.[1]?.name ||
                  trainingItem.unitId}{" "}
                (x{trainingItem.amount})
              </p>
              <p className="text-sm text-gray-400">Wird ausgebildet</p>
            </div>
            <div className="text-2xl font-mono">
              {remainingTime !== null ? formatTime(remainingTime) : "..."}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(gameConfig.units) as UnitKey[]).map((unitId) => {
          const unitConfig = gameConfig.units[unitId]?.[1];
          if (!unitConfig) return null;

          const currentAmount = city?.army?.[unitId] || 0;

          return (
            <div key={unitId} className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-xl font-bold">{unitConfig.name}</h3>
              <p className="text-gray-400 mb-2">{unitConfig.description}</p>
              <p>Vorhanden: {currentAmount}</p>

              <div className="my-4">{/* Kosten anzeigen */}</div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={amounts[unitId]}
                  onChange={(e) => handleAmountChange(unitId, e.target.value)}
                  className="bg-gray-900 text-white w-20 p-2 rounded"
                  disabled={isTrainingInProgress || isLoading}
                />
                <button
                  onClick={() => handleRecruit(unitId)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full disabled:bg-gray-500 disabled:cursor-not-allowed"
                  disabled={isTrainingInProgress || isLoading}
                >
                  {isLoading ? "Wird rekrutiert..." : "Rekrutieren"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
