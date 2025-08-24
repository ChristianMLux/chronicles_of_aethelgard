import { formatTime } from "@/lib/utils";
import { BuildingKey, BuildingTypeConfig, City, ResearchKey } from "@/types";
import { Clock } from "lucide-react";
import { ResourceBar } from "../ResourceBar";
import { ResearchTypeConfig } from "@/config/research.config";

export function UpgradeModalContentResearch({
  researchKey,
  config,
  city,
  onConfirm,
  onClose,
  isBusy,
  error,
}: {
  researchKey: ResearchKey;
  config: ResearchTypeConfig;
  city: City;
  onConfirm: (key: ResearchKey) => void;
  onClose: () => void;
  isBusy: boolean;
  error: string | null;
}) {
  const currentLevel = city.research[researchKey] || 0;
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
        {upgradeDetails.description || config.description}
      </p>
      <div className="space-y-2 mb-4">
        <h4 className="font-semibold">Forschungskosten</h4>
        <ResourceBar
          resources={upgradeDetails.cost}
          cityResources={city.resources}
          mode="cost"
        />
        <div className="flex items-center text-sm">
          <Clock size={14} className="mr-2" />
          <span>Forschungszeit: {formatTime(upgradeDetails.researchTime)}</span>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="flex gap-2 mt-6">
        <button onClick={onClose} className="ui-button-secondary w-full">
          Abbrechen
        </button>
        <button
          onClick={() => onConfirm(researchKey)}
          className="ui-button w-full"
          disabled={isBusy}
        >
          {isBusy ? "Wird erforscht..." : "Forschung bestätigen"}
        </button>
      </div>
    </div>
  );
}

export default function UpgradeModalContentBuilding({
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
