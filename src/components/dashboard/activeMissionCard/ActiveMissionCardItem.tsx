import { UNITS } from "@/config/units.config";
import { formatTime } from "@/lib/utils";
import { WorldMission, UnitKey } from "@/types";
import { Timestamp } from "firebase/firestore";
import {
  Swords,
  Package,
  Eye,
  Shield,
  Clock,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";

export const ActiveMissionCardItem = ({
  mission,
  isIncoming,
}: {
  mission: WorldMission;
  isIncoming: boolean;
}) => {
  const [remainingTime, setRemainingTime] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Timestamp.now();
      const arrival = mission.arrivalTime;
      const start = mission.startTime;

      if (now.toMillis() >= arrival) {
        setRemainingTime("Angekommen");
        setProgress(100);
        clearInterval(interval);
        return;
      }

      const totalDuration = arrival - start;
      const elapsed = now.toMillis() - start;
      const remaining = arrival - now.toMillis();

      setRemainingTime(formatTime(remaining / 1000));
      setProgress(Math.min(100, (elapsed / totalDuration) * 100));
    }, 1000);

    return () => clearInterval(interval);
  }, [mission]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "ATTACK":
        return <Swords size={16} className="text-red-400" />;
      case "GATHER":
        return <Package size={16} className="text-yellow-400" />;
      case "SPY":
        return <Eye size={16} className="text-blue-400" />;
      case "SEND_RSS":
        return <Package size={16} className="text-green-400" />;
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

  const totalUnits = Object.values(mission.army).reduce(
    (sum, count) => sum + (count || 0),
    0
  );

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800/70 transition-colors">
      {/* Mission Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getActionIcon(mission.actionType)}
          <span className="font-semibold text-sm">
            {getActionName(mission.actionType)}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              isIncoming
                ? "bg-red-900/50 text-red-400"
                : "bg-blue-900/50 text-blue-400"
            }`}
          >
            {isIncoming ? "Eingehend" : "Ausgehend"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          <span className="font-mono">{remainingTime}</span>
        </div>
      </div>

      {/* Mission Route */}
      <div className="flex items-center gap-2 text-xs text-gray-300 mb-2 truncate">
        <span>{isIncoming ? mission.ownerId : mission.targetOwnerId}</span>
        <span>
          (
          {isIncoming
            ? `${mission.originCoords.x}, ${mission.originCoords.y}`
            : `${mission.targetCoords.x}, ${mission.targetCoords.y}`}
          )
        </span>
        {isIncoming ? (
          <ArrowLeft size={12} className="text-red-400 flex-shrink-0" />
        ) : (
          <ArrowRight size={12} className="text-blue-400 flex-shrink-0" />
        )}
      </div>

      {/* Army Composition */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-gray-500">Truppen:</span>
        <div className="flex gap-2">
          {Object.entries(mission.army).map(([unit, count]) => {
            if (!count || count === 0) return null;
            const unitConfig = UNITS[unit as UnitKey];
            if (!unitConfig) return null;
            const tooltipId = `tooltip-${mission.id}-${unit}`;
            return (
              <span
                key={unit}
                className="flex items-center gap-1"
                data-tooltip-id={tooltipId}
                data-tooltip-content={unitConfig.name}
              >
                {unitConfig.icon} {count}
                <Tooltip id={tooltipId} place="top" />
              </span>
            );
          })}
        </div>
        <span className="text-gray-500 ml-auto">Gesamt: {totalUnits}</span>
      </div>

      {/* Progress Bar */}
      <div className="mt-2">
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isIncoming ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
