"use client";

import { useState, useEffect } from "react";
import { Tile, City, UnitKey, WorldMissionAction, ResourceKey } from "@/types";
import { UNITS } from "@/config/units.config";
import { getAuth } from "firebase/auth";
import { Package, AlertCircle, Info } from "lucide-react";

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
    spy: 0,
  });
  const [resourcesToSend, setResourcesToSend] = useState<
    Record<ResourceKey, number>
  >({
    stone: 0,
    wood: 0,
    food: 0,
    mana: 0,
  });
  const [transportCapacity, setTransportCapacity] = useState(0);
  const [totalResourceWeight, setTotalResourceWeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableUnits = originCity.army || {
    swordsman: 0,
    archer: 0,
    knight: 0,
    spy: 0,
  };

  const availableResources = originCity.resources || {
    stone: 0,
    wood: 0,
    food: 0,
    mana: 0,
  };

  // Calculate transport capacity whenever units change
  useEffect(() => {
    let capacity = 0;
    for (const unitKey in unitsToSend) {
      const unitDetails = UNITS[unitKey as UnitKey];
      const unitCount = unitsToSend[unitKey as UnitKey];
      capacity += (unitDetails.capacity || 0) * unitCount;
    }
    setTransportCapacity(capacity);
  }, [unitsToSend]);

  // Calculate total resource weight whenever resources change
  useEffect(() => {
    const totalWeight = Object.values(resourcesToSend).reduce(
      (sum, amount) => sum + amount,
      0
    );
    setTotalResourceWeight(totalWeight);
  }, [resourcesToSend]);

  // Reset on action change
  useEffect(() => {
    setUnitsToSend({
      swordsman: 0,
      archer: 0,
      knight: 0,
      spy: 0,
    });
    setResourcesToSend({
      stone: 0,
      wood: 0,
      food: 0,
      mana: 0,
    });
    setError(null);
  }, [selectedAction]);

  const handleUnitChange = (unit: UnitKey, value: string) => {
    const amount = parseInt(value, 10);
    const maxAmount = availableUnits[unit] || 0;
    setUnitsToSend((prev) => ({
      ...prev,
      [unit]: isNaN(amount) ? 0 : Math.max(0, Math.min(amount, maxAmount)),
    }));
  };

  const handleResourceChange = (resource: ResourceKey, value: string) => {
    const amount = parseInt(value, 10);
    const maxAmount = availableResources[resource] || 0;
    setResourcesToSend((prev) => ({
      ...prev,
      [resource]: isNaN(amount) ? 0 : Math.max(0, Math.min(amount, maxAmount)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const totalUnits = Object.values(unitsToSend).reduce((a, b) => a + b, 0);
    if (totalUnits === 0) {
      setError("Du musst mindestens eine Einheit senden.");
      setIsLoading(false);
      return;
    }

    // Additional validation for SEND_RSS
    if (selectedAction === "SEND_RSS") {
      if (totalResourceWeight === 0) {
        setError("Du musst mindestens eine Ressource senden.");
        setIsLoading(false);
        return;
      }
      if (totalResourceWeight > transportCapacity) {
        setError(
          `Transportkapazität überschritten! Kapazität: ${transportCapacity}, Ressourcen: ${totalResourceWeight}`
        );
        setIsLoading(false);
        return;
      }
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated.");
      }

      const token = await user.getIdToken();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestBody: any = {
        originCityId: originCity.id,
        targetTileId: targetTile.id,
        actionType: selectedAction,
        army: unitsToSend,
      };

      if (selectedAction === "SEND_RSS") {
        requestBody.resources = resourcesToSend;
      }

      const response = await fetch("/api/world/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
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
    const unitDetails = UNITS[unitKey];
    const maxAmount = availableUnits[unitKey] || 0;

    if (maxAmount === 0) return null;

    return (
      <div key={unitKey} className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="font-bold text-white">
            {unitDetails.name} ({maxAmount} verfügbar)
            {selectedAction === "SEND_RSS" && (
              <span className="text-sm text-gray-400 ml-2">
                Kapazität: {unitDetails.capacity}
              </span>
            )}
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

  const renderResourceSelector = (resourceKey: ResourceKey) => {
    const maxAmount = availableResources[resourceKey] || 0;
    const resourceNames = {
      stone: "Stein",
      wood: "Holz",
      food: "Nahrung",
      mana: "Mana",
    };

    if (maxAmount === 0) return null;

    return (
      <div key={resourceKey} className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="font-bold text-white">
            {resourceNames[resourceKey]} ({maxAmount.toLocaleString("de-DE")}{" "}
            verfügbar)
          </label>
          <button
            type="button"
            onClick={() =>
              handleResourceChange(resourceKey, maxAmount.toString())
            }
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
            value={resourcesToSend[resourceKey]}
            onChange={(e) => handleResourceChange(resourceKey, e.target.value)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            value={resourcesToSend[resourceKey]}
            onChange={(e) => handleResourceChange(resourceKey, e.target.value)}
            className="w-24 bg-gray-900 text-white border border-gray-600 rounded p-1 text-center"
          />
        </div>
      </div>
    );
  };

  const unitsForMission = (Object.keys(UNITS) as UnitKey[]).filter((unit) => {
    if (selectedAction === "SPY") {
      return unit === "spy";
    }
    return unit !== "spy";
  });

  // Determine available actions based on target tile
  const availableActions: WorldMissionAction[] = [];
  if (targetTile.type === "city") {
    if (targetTile.ownerId === originCity.ownerId) {
      availableActions.push("SEND_RSS");
    } else {
      availableActions.push("ATTACK", "SPY", "SEND_RSS");
    }
  } else if (targetTile.type === "npc_camp") {
    availableActions.push("ATTACK", "SPY");
  } else if (targetTile.type === "resource") {
    availableActions.push("GATHER");
  }

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-xl max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">
        Mission nach ({targetTile.coords.x}, {targetTile.coords.y})
      </h2>

      <div className="flex space-x-1 mb-4 border-b border-gray-600">
        {availableActions.map((action) => (
          <button
            type="button"
            key={action}
            onClick={() => setSelectedAction(action)}
            className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
              selectedAction === action
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {action === "SEND_RSS"
              ? "Ressourcen senden"
              : action.charAt(0) + action.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Transport Capacity Info for SEND_RSS */}
        {selectedAction === "SEND_RSS" && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-400">
                Transportkapazität
              </h3>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">
                Genutzt / Verfügbar:
              </span>
              <span
                className={`font-bold ${
                  totalResourceWeight > transportCapacity
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {totalResourceWeight.toLocaleString("de-DE")} /{" "}
                {transportCapacity.toLocaleString("de-DE")}
              </span>
            </div>
            {transportCapacity === 0 && (
              <div className="flex items-center gap-2 mt-2 text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Wähle Einheiten aus, um Transportkapazität zu erhalten!
                </span>
              </div>
            )}
          </div>
        )}

        <h3 className="text-lg font-semibold mb-3">Einheiten auswählen</h3>
        {unitsForMission.map(renderUnitSelector)}

        {/* Resource Selection for SEND_RSS */}
        {selectedAction === "SEND_RSS" && (
          <>
            <h3 className="text-lg font-semibold mb-3 mt-6">
              Ressourcen auswählen
            </h3>
            {(Object.keys(availableResources) as ResourceKey[]).map(
              renderResourceSelector
            )}

            {targetTile.ownerId &&
              targetTile.ownerId !== originCity.ownerId && (
                <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg text-sm">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">
                    Du sendest Ressourcen an einen anderen Spieler. Diese Aktion
                    kann nicht rückgängig gemacht werden.
                  </span>
                </div>
              )}
          </>
        )}

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
