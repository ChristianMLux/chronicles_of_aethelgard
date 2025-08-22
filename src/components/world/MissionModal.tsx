"use client";

import { useState } from "react";
import { Tile, City, UnitKey, WorldMissionAction } from "@/types";
import { UNIT_CONFIG, UNIT_DETAILS_CONFIG } from "@/config/units.config";
import { getAuth } from "firebase/auth";

interface MissionModalProps {
  targetTile: Tile;
  originCity: City;
  initialAction: WorldMissionAction;
  onClose: () => void;
  onMissionStart: () => void;
}

export default function MissionModal({
  targetTile,
  originCity,
  initialAction,
  onClose,
  onMissionStart,
}: MissionModalProps) {
  const [selectedAction, setSelectedAction] =
    useState<WorldMissionAction>(initialAction);
  const [unitsToSend, setUnitsToSend] = useState<Record<UnitKey, number>>({
    swordsman: 0,
    archer: 0,
    knight: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableUnits = originCity.army || {
    swordsman: 0,
    archer: 0,
    knight: 0,
  };

  const handleUnitChange = (unit: UnitKey, value: string) => {
    const amount = parseInt(value, 10);
    const maxAmount = availableUnits[unit] || 0;
    setUnitsToSend((prev) => ({
      ...prev,
      [unit]: isNaN(amount) ? 0 : Math.max(0, Math.min(amount, maxAmount)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const totalUnits = Object.values(unitsToSend).reduce((a, b) => a + b, 0);
    if (totalUnits === 0) {
      setError("You must send at least one unit.");
      setIsLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated.");
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/world/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originCityId: originCity.id,
          targetTileId: targetTile.id,
          actionType: selectedAction,
          army: unitsToSend,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start mission.");
      }

      onMissionStart();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderUnitSelector = (unitKey: UnitKey) => {
    const unitDetails = UNIT_DETAILS_CONFIG[unitKey];
    const maxAmount = availableUnits[unitKey] || 0;

    return (
      <div key={unitKey} className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="font-bold text-white">
            {unitDetails.name} ({maxAmount} verfügbar)
          </label>
          <button
            type="button"
            onClick={() => handleUnitChange(unitKey, maxAmount.toString())}
            className="text-xs bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded"
          >
            Max
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max={maxAmount}
            value={unitsToSend[unitKey]}
            onChange={(e) => handleUnitChange(unitKey, e.target.value)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            value={unitsToSend[unitKey]}
            onChange={(e) => handleUnitChange(unitKey, e.target.value)}
            className="w-24 bg-gray-900 text-white border border-gray-600 rounded p-1 text-center"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-4">
        Mission nach ({targetTile.coords.x}, {targetTile.coords.y})
      </h2>

      <div className="flex space-x-1 mb-4 border-b border-gray-600">
        {["ATTACK", "GATHER", "SPY"].map((action) => (
          <button
            type="button"
            key={action}
            onClick={() => setSelectedAction(action as WorldMissionAction)}
            className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
              selectedAction === action
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {action.charAt(0) + action.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <h3 className="text-lg font-semibold mb-3">Einheiten auswählen</h3>
        {(Object.keys(UNIT_CONFIG) as UnitKey[]).map(renderUnitSelector)}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Wird gesendet..." : "Mission starten"}
          </button>
        </div>
      </form>
    </div>
  );
}
