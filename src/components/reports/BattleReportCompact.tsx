import React from "react";
import { Sword, Zap } from "lucide-react";

// Die Typen hier bleiben gleich, da sie die Ideal-Struktur beschreiben.
interface BattleReportProps {
  battleData: {
    rounds: RoundData[];
    winner: "attacker" | "defender" | "draw";
    survivors: {
      attacker: ArmyUnits;
      defender: ArmyUnits;
    };
  };
  attackerName?: string;
  defenderName?: string;
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
interface ArmyUnits {
  swordsman: number;
  archer: number;
  knight: number;
}
interface UnitDetail {
  unitType: "swordsman" | "archer" | "knight" | "spy";
  unitCount: number;
  damage: number;
  losses: number;
  hasCounter: boolean;
  targetType?: string;
}

export const CompactBattleReport: React.FC<BattleReportProps> = ({
  battleData,
  attackerName = "Angreifer",
  defenderName = "Verteidiger",
}) => {
  const totalCounters = battleData.rounds.reduce((acc, round) => {
    const attackerCounters =
      round.attackerDetails?.filter((d) => d.hasCounter).length || 0;
    const defenderCounters =
      round.defenderDetails?.filter((d) => d.hasCounter).length || 0;
    return acc + attackerCounters + defenderCounters;
  }, 0);

  return (
    <div className="compact-battle-report bg-gray-800 rounded-lg p-4 max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Sword className="w-4 h-4" />
          Kampfbericht
        </h3>
        <span className="text-sm text-gray-400">
          {battleData.rounds.length} Runden
        </span>
      </div>

      {totalCounters > 0 && (
        <div className="mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-1.5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400">
            {totalCounters} Konter-Bonus{totalCounters > 1 ? "se" : ""}{" "}
            aktiviert!
          </span>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {battleData.rounds.slice(-3).map((round) => (
          <div key={round.round} className="text-sm text-gray-300">
            <span className="text-gray-500">Runde {round.round}:</span>
            <span className="ml-2 text-red-400">
              -
              {Math.floor(
                (round.defenderLosses?.swordsman || 0) +
                  (round.defenderLosses?.archer || 0) +
                  (round.defenderLosses?.knight || 0)
              )}{" "}
              {defenderName}
            </span>
            <span className="ml-2 text-green-400">
              -
              {Math.floor(
                (round.attackerLosses?.swordsman || 0) +
                  (round.attackerLosses?.archer || 0) +
                  (round.attackerLosses?.knight || 0)
              )}{" "}
              {attackerName}
            </span>
          </div>
        ))}
      </div>

      <div
        className={`text-center py-2 px-3 rounded ${
          battleData.winner === "attacker"
            ? "bg-red-900/30 text-red-400"
            : battleData.winner === "defender"
            ? "bg-green-900/30 text-green-400"
            : "bg-yellow-900/30 text-yellow-400"
        }`}
      >
        <p className="font-semibold">
          {battleData.winner === "attacker" && `${attackerName} gewinnt!`}
          {battleData.winner === "defender" && `${defenderName} gewinnt!`}
          {battleData.winner === "draw" && "Unentschieden!"}
        </p>
      </div>
    </div>
  );
};
