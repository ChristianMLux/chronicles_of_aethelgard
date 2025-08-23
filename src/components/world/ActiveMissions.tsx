"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDb } from "@/../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Swords, ArrowRight, ArrowLeft, Hourglass, Box } from "lucide-react";
import { WorldMission } from "@/types";
import { formatDuration } from "@/lib/utils";

export const ActiveMissions = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<WorldMission[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const db = getDb();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const missionsRef = collection(db, "worldMissions");
    const q = query(
      missionsRef,
      where("ownerId", "==", user.uid),
      where("status", "in", ["outgoing", "returning"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const missionsData = snapshot.docs.map(
        (doc) => doc.data() as WorldMission
      );
      setMissions(missionsData);
    });

    return () => unsubscribe();
  }, [db, user]);

  if (missions.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-gray-900/80 border border-gray-700 rounded-lg p-3 text-white shadow-lg z-20">
      <h3 className="font-bold text-center mb-2">Aktive Missionen</h3>
      <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
        {missions.map((mission) => {
          const isOutgoing = mission.status === "outgoing";
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _isArrived = mission.status === "arrived"; //todo : implement
          const relevantTime = isOutgoing
            ? mission.arrivalTime
            : mission.returnTime;
          const remainingTime = relevantTime - currentTime;

          return (
            <div key={mission.id} className="text-sm bg-gray-800 p-2 rounded">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {mission.actionType === "ATTACK" ? (
                    <Swords size={16} className="text-red-400" />
                  ) : (
                    <Box size={16} className="text-yellow-400" />
                  )}
                  <span>{mission.actionType}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span>
                    ({mission.originCoords.x},{mission.originCoords.y})
                  </span>
                  {isOutgoing ? (
                    <ArrowRight size={14} />
                  ) : (
                    <>
                      <ArrowLeft size={14} />
                      <span>Heimkehrend</span>
                    </>
                  )}
                  <span>
                    ({mission.targetCoords.x},{mission.targetCoords.y})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono bg-gray-900 rounded py-1">
                <Hourglass size={16} className="text-blue-400" />
                <span>{formatDuration(remainingTime)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
