"use client";

import { useMemo } from "react";
import { Swords } from "lucide-react";
import { WorldMission } from "@/types";
import { ActiveMissionCardItem } from "./ActiveMissionCardItem";

interface ActiveMissionsCardProps {
  missions: WorldMission[];
  userId?: string;
}

export const ActiveMissionCard: React.FC<ActiveMissionsCardProps> = ({
  missions,
  userId,
}) => {
  const sortedMissions = useMemo(
    () => [...missions].sort((a, b) => a.arrivalTime - b.arrivalTime),
    [missions]
  );

  if (!userId) {
    return null;
  }

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

      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        {sortedMissions.map((mission) => (
          <ActiveMissionCardItem
            key={mission.id}
            mission={mission}
            isIncoming={mission.targetOwnerId === userId}
          />
        ))}
      </div>
    </div>
  );
};
