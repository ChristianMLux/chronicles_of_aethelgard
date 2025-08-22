"use client";
import { useEffect, useMemo, useState, Fragment } from "react";
import { getDb } from "@/../firebase";
import { useAuth } from "@/components/AuthProvider";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";
import { Eye, EyeOff, Crosshair, Box, Swords } from "lucide-react";
import Image from "next/image";
import {
  BattleReport,
  ResourceKey,
  MissionReport,
  resourceIcons,
} from "@/types";

const UnitDisplay = ({
  units,
}: {
  units: Record<string, number> | undefined;
}) => (
  <div className="flex flex-wrap gap-2 text-xs">
    {units &&
      Object.entries(units)
        .filter(([, count]) => count > 0)
        .map(([unit, count]) => (
          <span key={unit} className="bg-gray-700 px-2 py-1 rounded capitalize">
            {unit}: {count.toLocaleString()}
          </span>
        ))}
  </div>
);

const DetailedBattleLog = ({ report }: { report: BattleReport }) => {
  return (
    <div className="mt-4 space-y-4 text-sm">
      {report.rounds.map((round) => (
        <div
          key={round.round}
          className="p-3 bg-gray-900/50 rounded-md border border-gray-700"
        >
          <p className="font-bold text-blue-400 mb-2">Runde {round.round}</p>
          <div className="space-y-1">
            <p>
              ⚔️ Du verursachst{" "}
              <span className="text-red-400 font-semibold">
                {Math.round(round.attackerDamage).toLocaleString()}
              </span>{" "}
              Schaden → Gegner verliert{" "}
              <span className="text-red-400">
                {Object.values(round.defenderLosses)
                  .reduce((a, b) => a + b, 0)
                  .toFixed(1)}
              </span>{" "}
              Einheiten.
            </p>
            <p>
              🛡️ Gegner verursacht{" "}
              <span className="text-yellow-400 font-semibold">
                {Math.round(round.defenderDamage).toLocaleString()}
              </span>{" "}
              Schaden → Du verlierst{" "}
              <span className="text-yellow-400">
                {Object.values(round.attackerLosses)
                  .reduce((a, b) => a + b, 0)
                  .toFixed(1)}
              </span>{" "}
              Einheiten.
            </p>
          </div>
        </div>
      ))}
      <div className="pt-4 text-center">
        <p
          className={`font-bold text-lg ${
            report.winner === "attacker" ? "text-green-400" : "text-red-400"
          }`}
        >
          {report.winner === "attacker" ? "🎉 Sieg! 🎉" : "Niederlage"}
        </p>
        <p className="text-xs text-gray-400 mt-1">Verbleibende Einheiten:</p>
        <UnitDisplay units={report.survivors.attacker} />
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const db = useMemo(() => getDb(), []);
  const { user } = useAuth();
  const [reports, setReports] = useState<MissionReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MissionReport | null>(
    null
  );

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

  const handleReportClick = async (report: MissionReport) => {
    if (selectedReport && selectedReport.id === report.id) {
      setSelectedReport(null);
      return;
    }

    setSelectedReport(report);
    if (!report.read && user) {
      const reportRef = doc(db, "users", user.uid, "reports", report.id);
      await updateDoc(reportRef, { read: true });
    }
  };

  const getReportSummary = (report: MissionReport) => {
    const coords = `(${report.targetCoords.x}, ${report.targetCoords.y})`;
    if (report.actionType === "ATTACK") {
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
    return "Unbekannter Bericht";
  };

  const getReportIcon = (report: MissionReport) => {
    if (report.actionType === "ATTACK")
      return <Crosshair className="text-red-400" />;
    if (report.actionType === "GATHER")
      return <Box className="text-yellow-400" />;
    return null;
  };

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
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
            <Fragment key={report.id}>
              <div
                onClick={() => handleReportClick(report)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                  report.read
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-blue-900/50 hover:bg-blue-800/60"
                } ${
                  selectedReport?.id === report.id ? "ring-2 ring-blue-400" : ""
                }`}
              >
                <div className="text-2xl">{getReportIcon(report)}</div>
                <div className="flex-grow">
                  <p className="font-semibold">{getReportSummary(report)}</p>
                  <p className="text-xs text-gray-400">
                    {report.timestamp?.toDate().toLocaleString("de-DE")}
                  </p>
                </div>
                <div className="text-xl">
                  {report.read ? (
                    <EyeOff className="text-gray-500" />
                  ) : (
                    <Eye className="text-green-400" />
                  )}
                </div>
              </div>

              {selectedReport?.id === report.id && (
                <div className="mb-3 p-6 bg-gray-800 rounded-b-lg border-x border-b border-gray-700 -mt-2">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    {selectedReport.actionType === "ATTACK" ? (
                      <Swords />
                    ) : (
                      <Box />
                    )}
                    Detailansicht
                  </h2>
                  <p className="mb-4 text-xs text-gray-400">
                    Zeitpunkt:{" "}
                    {selectedReport.timestamp?.toDate().toLocaleString("de-DE")}
                  </p>

                  {selectedReport.actionType === "ATTACK" &&
                    selectedReport.battleDetails && (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-green-400">
                              Deine Truppen (Angreifer)
                            </h4>
                            <UnitDisplay
                              units={selectedReport.battleDetails.attackerArmy}
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-red-400">
                              Verteidigende Truppen
                            </h4>
                            <UnitDisplay
                              units={selectedReport.battleDetails.defenderArmy}
                            />
                          </div>
                        </div>
                        <div className="border-t border-gray-700 mt-4 pt-4">
                          <h3 className="text-xl font-semibold mb-2">
                            Kampfverlauf
                          </h3>
                          <DetailedBattleLog
                            report={selectedReport.battleDetails}
                          />
                        </div>
                      </div>
                    )}

                  {selectedReport.actionType === "GATHER" &&
                    selectedReport.gatheredResources && (
                      <div>
                        <h3 className="text-xl font-semibold mb-2 border-t border-gray-600 pt-4">
                          Sammelergebnis
                        </h3>
                        <div className="flex flex-col gap-3 mt-2">
                          {Object.entries(selectedReport.gatheredResources).map(
                            ([res, amount]) => (
                              <div
                                key={res}
                                className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-md"
                              >
                                <Image
                                  src={resourceIcons[res as ResourceKey]}
                                  alt={res}
                                  width={24}
                                  height={24}
                                />
                                <span className="font-semibold capitalize">
                                  {res}:
                                </span>
                                <span>{amount.toLocaleString()}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
