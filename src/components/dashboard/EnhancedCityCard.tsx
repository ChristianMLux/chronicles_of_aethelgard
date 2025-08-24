/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Hammer, Sword, FlaskRound, MapPin } from "lucide-react";
import { formatTime } from "@/lib/utils";

export interface EnhancedCity {
  id: string;
  name: string;
  location: {
    region: string;
    continent: string;
    territory?: string;
  };
  actualLocation?: {
    continent: string;
    zone: string;
    coords: { x: number; y: number };
  };
  resources?: {
    stone: number;
    wood: number;
    food: number;
    mana: number;
  };
  army?: {
    swordsman: number;
    archer: number;
    knight: number;
  };
  buildingQueue?: Array<{
    id: string;
    buildingId: string;
    targetLevel: number;
    endTime: string;
  }>;
  trainingQueue?: Array<{
    id: string;
    unitId: string;
    amount: number;
    endTime: string;
  }>;
  researchQueue?: Array<{
    id: string;
    researchId: string;
    targetLevel: number;
    endTime: string;
  }>;
  tileId?: string;
  [key: string]: any;
}

interface EnhancedCityCardProps {
  city: EnhancedCity;
}

export const EnhancedCityCard: React.FC<EnhancedCityCardProps> = ({ city }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const remaining = Math.max(0, Math.floor((end - currentTime) / 1000));
    return remaining;
  };

  const getZoneColor = (zone?: string) => {
    switch (zone) {
      case "center":
        return "text-purple-400";
      case "middle":
        return "text-yellow-400";
      case "outer":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getZoneName = (zone?: string) => {
    switch (zone) {
      case "center":
        return "Zentrum";
      case "middle":
        return "Mittlere Zone";
      case "outer":
        return "Äußere Zone";
      default:
        return "Unbekannt";
    }
  };

  const currentBuilding = city.buildingQueue?.[0];
  const currentTraining = city.trainingQueue?.[0];
  const currentResearch = city.researchQueue?.[0];

  return (
    <div className="bg-panel-2/50 p-4 rounded-lg border border-outline/50 hover:border-rune/70 transition-all duration-200 flex flex-col h-full">
      {/* Header */}
      <div className="mb-3">
        <h3 className="font-bold text-lg text-white">{city.name}</h3>

        {/* Location Info */}
        {city.actualLocation ? (
          <div className="text-xs space-y-1 mt-1">
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-gray-500" />
              <span className={getZoneColor(city.actualLocation.zone)}>
                {getZoneName(city.actualLocation.zone)}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">
                ({city.actualLocation.coords.x}, {city.actualLocation.coords.y})
              </span>
            </div>
            <p className="text-gray-500">{city.actualLocation.continent}</p>
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            {city.location.region}, {city.location.continent}
          </p>
        )}
      </div>

      {/* Active Queues */}
      <div className="flex-grow space-y-2">
        {/* Building Queue */}
        {currentBuilding ? (
          <div className="bg-gray-800/50 rounded p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hammer size={14} className="text-yellow-400" />
                <span className="text-xs">
                  {currentBuilding.buildingId} (Lvl{" "}
                  {currentBuilding.targetLevel})
                </span>
              </div>
              <span className="text-xs font-mono text-yellow-400">
                {formatTime(getTimeRemaining(currentBuilding.endTime))}
              </span>
            </div>
            {city.buildingQueue && city.buildingQueue.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                +{city.buildingQueue.length - 1} weitere in Warteschlange
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded p-2 border border-gray-700/50">
            <div className="flex items-center gap-2">
              <Hammer size={14} className="text-gray-600" />
              <span className="text-xs text-gray-500 italic">
                Keine Bauaufträge
              </span>
            </div>
          </div>
        )}

        {/* Training Queue */}
        {currentTraining ? (
          <div className="bg-gray-800/50 rounded p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sword size={14} className="text-red-400" />
                <span className="text-xs">
                  {currentTraining.unitId} x{currentTraining.amount}
                </span>
              </div>
              <span className="text-xs font-mono text-red-400">
                {formatTime(getTimeRemaining(currentTraining.endTime))}
              </span>
            </div>
            {city.trainingQueue && city.trainingQueue.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                +{city.trainingQueue.length - 1} weitere Aufträge
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded p-2 border border-gray-700/50">
            <div className="flex items-center gap-2">
              <Sword size={14} className="text-gray-600" />
              <span className="text-xs text-gray-500 italic">
                Keine Rekrutierung
              </span>
            </div>
          </div>
        )}

        {/* Research Queue */}
        {currentResearch ? (
          <div className="bg-gray-800/50 rounded p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskRound size={14} className="text-blue-400" />
                <span className="text-xs">
                  {currentResearch.researchId} (Lvl{" "}
                  {currentResearch.targetLevel})
                </span>
              </div>
              <span className="text-xs font-mono text-blue-400">
                {formatTime(getTimeRemaining(currentResearch.endTime))}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded p-2 border border-gray-700/50">
            <div className="flex items-center gap-2">
              <FlaskRound size={14} className="text-gray-600" />
              <span className="text-xs text-gray-500 italic">
                Keine Forschung
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <Link
        href={`/city/${city.id}`}
        className="ui-button text-sm px-3 py-2 mt-3 text-center hover:scale-105 transition-transform"
      >
        Verwalten
      </Link>
    </div>
  );
};
