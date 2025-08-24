"use client";

import { useState, useEffect } from "react";
import {
  Swords,
  Shield,
  Package,
  Eye,
  ArrowRight,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { WorldMission } from "@/types";

interface ActiveMissionsCardProps {
  missions: WorldMission[];
}

export const ActiveMissionsCard: React.FC<ActiveMissionsCardProps> = ({
  missions,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "ATTACK":
        return <Swords size={16} className="text-red-400" />;
      case "GATHER":
        return <Package size={16} className="text-yellow-400" />;
      case "SPY":
        return <Eye size={16} className="text-blue-400" />;
      default:
        return <Shield size={16} className="text-gray-400" />;
    }
  };

  const getActionName = (actionType: string) => {
    switch (actionType) {
      case "ATTACK":
        return "Angriff";
      case "GATHER":
        return "Sammeln";
      case "SPY":
        return "Spionage";
      case "SEND_RSS":
        return "Transport";
      default:
        return actionType;
    }
  };

  const getStatusColor = (status: string) => {
    return status === "outgoing" ? "text-orange-400" : "text-green-400";
  };

  const getStatusText = (status: string) => {
    return status === "outgoing" ? "Unterwegs" : "Rückkehr";
  };

  const getTotalUnits = (army: Record<string, number>) => {
    return Object.values(army).reduce((sum, count) => sum + count, 0);
  };

  const sortedMissions = [...missions].sort((a, b) => {
    const timeA = a.status === "outgoing" ? a.arrivalTime : a.returnTime;
    const timeB = b.status === "outgoing" ? b.arrivalTime : b.returnTime;
    return timeA - timeB;
  });

  if (missions.length === 0) {
    return (
      <div className="ui-panel p-4">
        <div className="flex items-center gap-2 text-rune mb-3">
          <Swords size={20} />
          <h2 className="font-semibold text-lg">Armeebewegungen</h2>
        </div>
        <div className="rune-divider mb-3"></div>
        <p className="text-gray-400 text-center py-4">
          Keine aktiven Missionen
        </p>
      </div>
    );
  }

  return (
    <div className="ui-panel p-4">
      <div className="flex items-center gap-2 text-rune mb-3">
        <Swords size={20} />
        <h2 className="font-semibold text-lg">
          Armeebewegungen
          <span className="ml-2 text-sm text-gray-400">
            ({missions.length} aktiv)
          </span>
        </h2>
      </div>
      <div className="rune-divider mb-3"></div>

      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {sortedMissions.map((mission) => {
          const isOutgoing = mission.status === "outgoing";
          const relevantTime = isOutgoing
            ? mission.arrivalTime
            : mission.returnTime;
          const remainingTime = relevantTime - currentTime;
          const totalUnits = getTotalUnits(mission.army);

          return (
            <div
              key={mission.id}
              className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800/70 transition-colors"
            >
              {/* Mission Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getActionIcon(mission.actionType)}
                  <span className="font-semibold text-sm">
                    {getActionName(mission.actionType)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      isOutgoing ? "bg-orange-900/50" : "bg-green-900/50"
                    } ${getStatusColor(mission.status)}`}
                  >
                    {getStatusText(mission.status)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span className="font-mono">
                    {formatDuration(remainingTime)}
                  </span>
                </div>
              </div>

              {/* Mission Route */}
              <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                <span>
                  ({mission.originCoords.x}, {mission.originCoords.y})
                </span>
                {isOutgoing ? (
                  <ArrowRight size={12} className="text-orange-400" />
                ) : (
                  <ArrowLeft size={12} className="text-green-400" />
                )}
                <span>
                  ({mission.targetCoords.x}, {mission.targetCoords.y})
                </span>
              </div>

              {/* Army Composition */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">Truppen:</span>
                <div className="flex gap-3">
                  {mission.army.swordsman > 0 && (
                    <span className="flex items-center gap-1">
                      ⚔️ {mission.army.swordsman}
                    </span>
                  )}
                  {mission.army.archer > 0 && (
                    <span className="flex items-center gap-1">
                      🏹 {mission.army.archer}
                    </span>
                  )}
                  {mission.army.knight > 0 && (
                    <span className="flex items-center gap-1">
                      🐴 {mission.army.knight}
                    </span>
                  )}
                </div>
                <span className="text-gray-500 ml-auto">
                  Gesamt: {totalUnits}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-2">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isOutgoing ? "bg-orange-500" : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((currentTime - mission.startTime) /
                            ((isOutgoing
                              ? mission.arrivalTime
                              : mission.returnTime) -
                              mission.startTime)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
