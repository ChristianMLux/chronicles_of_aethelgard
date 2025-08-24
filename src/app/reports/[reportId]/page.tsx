"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { getDb } from "@/../firebase";
import { BattleReportClient } from "@/components/reports/BattleReportClient";
import { SpyReportClient } from "@/components/reports/SpyReportClient";
import { UnitKey, MissionReport, SpyReport } from "@/types";

interface ArmyUnits {
  swordsman: number;
  archer: number;
  knight: number;
  spy: number;
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
  attackerArmy: ArmyUnits;
  defenderArmy: ArmyUnits;
  winner: "attacker" | "defender" | "draw";
  survivors: {
    attacker: ArmyUnits;
    defender: ArmyUnits;
  };
  rounds: RoundData[];
}

interface UserReport extends MissionReport {
  id: string;
  battleDetails?: BattleReportDetails;
  spyDetails?: SpyReport;
  read: boolean;
}

export default function ReportPage() {
  const { reportId } = useParams();
  const { user } = useAuth();
  const [db] = useState(getDb());
  const [report, setReport] = useState<UserReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !reportId) return;

    const fetchReport = async () => {
      try {
        const reportRef = doc(
          db,
          "users",
          user.uid,
          "reports",
          reportId as string
        );
        const reportSnap = await getDoc(reportRef);

        if (reportSnap.exists()) {
          const reportData = reportSnap.data() as UserReport;
          setReport(reportData);

          if (!reportData.read) {
            await updateDoc(reportRef, { read: true });
          }
        } else {
          setError("Bericht nicht gefunden.");
        }
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden des Berichts.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [user, reportId, db]);

  if (loading) {
    return <div className="text-center p-8">Lade Bericht...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!report) {
    return (
      <div className="text-center p-8">
        Bericht konnte nicht geladen werden.
      </div>
    );
  }

  const renderContent = () => {
    switch (report.actionType) {
      case "ATTACK":
      case "DEFENSE":
        if (!report.battleDetails) {
          return (
            <div className="text-center p-8">
              Keine Kampfdetails für diesen Bericht verfügbar.
            </div>
          );
        }
        const isAttacker = report.battleDetails.attackerId === user?.uid;
        return (
          <BattleReportClient
            battleData={report.battleDetails}
            attackerName={isAttacker ? "Du" : "Gegner"}
            defenderName={!isAttacker ? "Du" : "Gegner"}
          />
        );

      case "SPY":
        if (!report.spyDetails) {
          return (
            <div className="text-center p-8">
              Keine Spionagedetails für diesen Bericht verfügbar.
            </div>
          );
        }
        return (
          <SpyReportClient
            reportData={report.spyDetails}
            attackerName="Du"
            defenderName="Gegner"
          />
        );

      default:
        if (report.battleDetails) {
          const isAttacker = report.battleDetails.attackerId === user?.uid;
          return (
            <BattleReportClient
              battleData={report.battleDetails}
              attackerName={isAttacker ? "Du" : "Gegner"}
              defenderName={!isAttacker ? "Du" : "Gegner"}
            />
          );
        }
        return (
          <div className="text-center p-8">
            Unbekannter oder veralteter Berichtstyp.
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-4 mt-[4.25rem]">{renderContent()}</div>
  );
}
