"use client";
import { useEffect, useMemo, useState } from "react";
import { getDb } from "@/../firebase";
import { useAuth } from "@/components/AuthProvider";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import Link from "next/link";
import { Eye, EyeOff, Crosshair, Box, Swords } from "lucide-react"; // MODIFIED: Imported Swords for Spy icon
import { UnitKey, ResourceKey, SpyReport } from "@/types"; // MODIFIED: Imported SpyReport
import { CompactBattleReport } from "@/components/reports/BattleReportCompact";
import { CompactSpyReport } from "@/components/reports/SpyReportCompact"; // ADDED: Import compact spy report

interface ArmyUnits {
  swordsman: number;
  archer: number;
  knight: number;
  spy: number; // ADDED: spy unit
}

interface UnitDetail {
  unitType: UnitKey;
  unitCount: number;
  damage: number;
  losses: number;
  hasCounter: boolean;
  targetType?: string;
}

interface RoundData {
  round: number;
  attackerDamage: number;
  defenderDamage: number;
  attackerLosses: ArmyUnits;
  defenderLosses: ArmyUnits;
  attackerDetails: UnitDetail[];
  defenderDetails: UnitDetail[];
  remainingAttacker: ArmyUnits;
  remainingDefender: ArmyUnits;
}

interface BattleReportDetails {
  attackerId: string;
  defenderId: string;
  winner: "attacker" | "defender" | "draw";
  survivors: {
    attacker: ArmyUnits;
    defender: ArmyUnits;
  };
  rounds: RoundData[];
}

interface MissionReport {
  id: string;
  read: boolean;
  actionType: "ATTACK" | "GATHER" | "SPY" | "SEND_RSS" | "DEFENSE";
  targetCoords: { x: number; y: number };
  timestamp: Timestamp;
  battleDetails?: BattleReportDetails;
  spyDetails?: SpyReport;
  gatheredResources?: Partial<Record<ResourceKey, number>>;
  missionId: string;
  ownerId: string;
}

export default function ReportsPage() {
  const db = useMemo(() => getDb(), []);
  const { user } = useAuth();
  const [reports, setReports] = useState<MissionReport[]>([]);

  useEffect(() => {
    if (!user) return;
    const reportsRef = collection(db, "users", user.uid, "reports");
    const q = query(reportsRef, orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as MissionReport)
      );
      setReports(reportsData);
    });
    return () => unsubscribe();
  }, [user, db]);

  const getReportSummary = (report: MissionReport) => {
    const coords = `(${report.targetCoords.x}, ${report.targetCoords.y})`;
    if (report.actionType === "ATTACK" || report.actionType === "DEFENSE") {
      const winner = report.battleDetails?.winner;
      if (winner === "attacker") return `Sieg bei ${coords}`;
      if (winner === "defender") return `Niederlage bei ${coords}`;
      return `Unentschieden bei ${coords}`;
    }
    if (report.actionType === "GATHER") {
      const resources = Object.entries(report.gatheredResources ?? {})
        .map(([key, value]) => `${value.toLocaleString()} ${key}`)
        .join(", ");
      return `Ressourcen gesammelt bei ${coords}: ${resources || "Nichts"}`;
    }
    if (report.actionType === "SPY") {
      if (report.spyDetails?.success) {
        return `Spionage bei ${coords} erfolgreich`;
      }
      return `Spionage bei ${coords} fehlgeschlagen`;
    }
    return "Unbekannter Bericht";
  };

  const getReportIcon = (report: MissionReport) => {
    if (report.actionType === "ATTACK" || report.actionType === "DEFENSE")
      return <Crosshair className="text-red-400" />;
    if (report.actionType === "GATHER")
      return <Box className="text-yellow-400" />;
    if (report.actionType === "SPY")
      return <Swords className="text-blue-400" />;
    return null;
  };

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen ">
      <div className="max-w-4xl mx-auto pt-[4.25rem]">
        <Link
          className="text-blue-400 hover:underline mb-4 inline-block"
          href="/dashboard"
        >
          ← Zurück zum Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
          Missionsberichte
        </h1>

        {reports.length === 0 && (
          <div className="text-center py-10 bg-gray-800 rounded-lg">
            <p>Keine Berichte vorhanden.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <Link href={`/reports/${report.id}`} key={report.id}>
              <div
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                  report.read
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-blue-900/50 hover:bg-blue-800/60"
                }`}
              >
                <div className="text-2xl">{getReportIcon(report)}</div>
                <div className="flex-grow">
                  <p className="font-semibold">{getReportSummary(report)}</p>
                  <p className="text-xs text-gray-400">
                    {report.timestamp?.toDate().toLocaleString("de-DE")}
                  </p>
                </div>

                {report.actionType === "ATTACK" && report.battleDetails && (
                  <CompactBattleReport
                    battleData={report.battleDetails}
                    attackerName={
                      report.battleDetails.attackerId === user?.uid
                        ? "Du"
                        : "Gegner"
                    }
                    defenderName={
                      report.battleDetails.attackerId !== user?.uid
                        ? "Du"
                        : "Gegner"
                    }
                  />
                )}
                {report.actionType === "SPY" && report.spyDetails && (
                  <CompactSpyReport
                    reportData={report.spyDetails}
                    attackerName="Du"
                    defenderName="Gegner"
                  />
                )}

                <div className="text-xl ml-4">
                  {report.read ? (
                    <EyeOff className="text-gray-500" />
                  ) : (
                    <Eye className="text-green-400" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
