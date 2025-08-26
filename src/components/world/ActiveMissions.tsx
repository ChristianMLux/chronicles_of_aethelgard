"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDb } from "@/../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  Swords,
  ArrowRight,
  ArrowLeft,
  Hourglass,
  Box,
  Eye,
} from "lucide-react";
import { WorldMission } from "@/types";
import { formatTime } from "@/lib/utils";

export const ActiveMissions = () => {
  const { user } = useAuth();
  const [outgoingMissions, setOutgoingMissions] = useState<WorldMission[]>([]);
  const [incomingMissions, setIncomingMissions] = useState<WorldMission[]>([]);
  const [currentTime, setCurrentTime] = useState(() => Timestamp.now());
  const db = getDb();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Timestamp.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      setOutgoingMissions([]);
      setIncomingMissions([]);
      return;
    }

    const missionsRef = collection(db, "worldMissions");

    const outgoingQuery = query(
      missionsRef,
      where("ownerId", "==", user.uid),
      where("status", "!=", "completed")
    );
    const unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
      const missionsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as WorldMission)
      );
      setOutgoingMissions(missionsData);
    });

    const incomingQuery = query(
      missionsRef,
      where("targetOwnerId", "==", user.uid),
      where("status", "!=", "completed")
    );
    const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
      const missionsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as WorldMission)
      );
      setIncomingMissions(missionsData);
    });

    return () => {
      unsubscribeOutgoing();
      unsubscribeIncoming();
    };
  }, [db, user]);

  const allMissions = useMemo(
    () =>
      [...outgoingMissions, ...incomingMissions].sort(
        (a, b) => a.arrivalTime - b.arrivalTime
      ),
    [outgoingMissions, incomingMissions]
  );

  if (allMissions.length === 0) {
    return null;
  }

  const getActionIcon = (missionType: WorldMission["actionType"]) => {
    switch (missionType) {
      case "ATTACK":
        return <Swords size={16} className="text-red-400" />;
      case "SPY":
        return <Eye size={16} className="text-blue-400" />;
      case "SEND_RSS":
        return <Box size={16} className="text-green-400" />;
      default:
        return <Box size={16} className="text-yellow-400" />;
    }
  };

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-gray-900/80 border border-gray-700 rounded-lg p-3 text-white shadow-lg z-20">
      <h3 className="font-bold text-center mb-2">Aktive Missionen</h3>
      <div className="flex flex-col gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {allMissions.map((mission) => {
          const isIncoming = mission.targetOwnerId === user?.uid;

          const relevantTime = mission.arrivalTime;
          const remainingMillis = relevantTime - currentTime.toMillis();

          if (remainingMillis < 0) return null;

          return (
            <div
              key={`${mission.id}-${isIncoming}`}
              className="text-sm bg-gray-800 p-2 rounded"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getActionIcon(mission.actionType)}
                  <span
                    className={isIncoming ? "text-red-400" : "text-blue-400"}
                  >
                    {isIncoming ? "Eingehend" : "Ausgehend"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span>
                    {isIncoming ? mission.ownerName : mission.targetName}
                  </span>
                  {isIncoming ? (
                    <ArrowLeft size={14} className="text-red-400" />
                  ) : (
                    <ArrowRight size={14} className="text-blue-400" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono bg-gray-900 rounded py-1">
                <Hourglass size={16} className="text-yellow-400" />
                <span>{formatTime(remainingMillis / 1000)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
