import React from "react";
import {
  Sword,
  Shield,
  Target,
  Zap,
  TrendingDown,
  Users,
  AlertTriangle,
} from "lucide-react";

// ============= TYPEN  =============
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
  attackerDetails?: UnitDetail[];
  defenderDetails?: UnitDetail[];
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

export const BattleReportClient: React.FC<BattleReportProps> = ({
  battleData,
  attackerName = "Angreifer",
  defenderName = "Verteidiger",
}) => {
  const unitIcons = {
    swordsman: "⚔️",
    archer: "🏹",
    knight: "🐴",
    spy: "🕵️‍♂️",
  };

  const unitNames = {
    swordsman: "Schwertkämpfer",
    archer: "Bogenschützen",
    knight: "Ritter",
    spy: "Spion",
  };

  const isNewReportFormat =
    battleData.rounds &&
    battleData.rounds.length > 0 &&
    battleData.rounds[0].attackerDetails;

  if (!isNewReportFormat) {
    return (
      <div className="bg-gray-900 text-white rounded-lg p-6 max-w-4xl mx-auto">
        <div className="text-center p-4 mb-6 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
          <h3 className="text-xl font-bold text-yellow-300">
            Veralteter Kampfbericht
          </h3>
          <p className="text-yellow-400/80 mt-1">
            Dieser Bericht stammt aus einer älteren Version und enthält keine
            detaillierte Runden-Analyse.
          </p>
        </div>

        <div
          className={`p-4 rounded-lg text-center ${
            battleData.winner === "attacker"
              ? "bg-red-900/30 border border-red-700"
              : battleData.winner === "defender"
              ? "bg-green-900/30 border border-green-700"
              : "bg-yellow-900/30 border border-yellow-700"
          }`}
        >
          <h3 className="text-xl font-bold mb-2">
            {battleData.winner === "attacker" &&
              `🎉 ${attackerName} gewinnt! 🎉`}
            {battleData.winner === "defender" &&
              `🛡️ ${defenderName} gewinnt! 🛡️`}
            {battleData.winner === "draw" && "🤝 Unentschieden! 🤝"}
          </h3>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Überlebende {attackerName}:</p>
              <div className="flex justify-center gap-3">
                <span>
                  {Math.floor(battleData.survivors.attacker.swordsman)}{" "}
                  {unitIcons.swordsman}
                </span>
                <span>
                  {Math.floor(battleData.survivors.attacker.archer)}{" "}
                  {unitIcons.archer}
                </span>
                <span>
                  {Math.floor(battleData.survivors.attacker.knight)}{" "}
                  {unitIcons.knight}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Überlebende {defenderName}:</p>
              <div className="flex justify-center gap-3">
                <span>
                  {Math.floor(battleData.survivors.defender.swordsman)}{" "}
                  {unitIcons.swordsman}
                </span>
                <span>
                  {Math.floor(battleData.survivors.defender.archer)}{" "}
                  {unitIcons.archer}
                </span>
                <span>
                  {Math.floor(battleData.survivors.defender.knight)}{" "}
                  {unitIcons.knight}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- New Reports ---
  return (
    <div className="battle-report bg-gray-900 text-white rounded-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sword className="w-6 h-6" />
          Detaillierter Kampfbericht
          <Shield className="w-6 h-6" />
        </h2>
        <p className="text-gray-400">
          {battleData.rounds.length} Runden • {attackerName} vs {defenderName}
        </p>
      </div>

      <div className="space-y-6">
        {battleData.rounds.map((round) => (
          <div
            key={round.round}
            className="border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-blue-400">
                Runde {round.round}
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-red-900/20 rounded-lg p-3">
                <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {attackerName} Angriff
                </h4>
                <div className="space-y-1 text-sm">
                  {round.attackerDetails
                    ?.filter((d) => d.unitCount > 0)
                    .map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1">
                          <span>{unitIcons[detail.unitType]}</span>
                          <span>
                            {Math.floor(detail.unitCount)}{" "}
                            {unitNames[detail.unitType]}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-orange-400">
                            {Math.floor(detail.damage)} DMG
                          </span>
                          {detail.hasCounter && (
                            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                              <Zap className="w-3 h-3" /> KONTER!
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-green-900/20 rounded-lg p-3">
                <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {defenderName} Konter
                </h4>
                <div className="space-y-1 text-sm">
                  {round.defenderDetails
                    ?.filter((d) => d.unitCount > 0)
                    .map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1">
                          <span>{unitIcons[detail.unitType]}</span>
                          <span>
                            {Math.floor(detail.unitCount)}{" "}
                            {unitNames[detail.unitType]}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-orange-400">
                            {Math.floor(detail.damage)} DMG
                          </span>
                          {detail.hasCounter && (
                            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                              <Zap className="w-3 h-3" /> KONTER!
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Attacker */}
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Angreifer verliert:
                  </p>
                  <div className="flex gap-3 text-xs mt-1">
                    {round.attackerLosses.swordsman > 0 && (
                      <span className="text-red-400">
                        -{Math.floor(round.attackerLosses.swordsman)}{" "}
                        {unitIcons.swordsman}
                      </span>
                    )}
                    {round.attackerLosses.archer > 0 && (
                      <span className="text-red-400">
                        -{Math.floor(round.attackerLosses.archer)}{" "}
                        {unitIcons.archer}
                      </span>
                    )}
                    {round.attackerLosses.knight > 0 && (
                      <span className="text-red-400">
                        -{Math.floor(round.attackerLosses.knight)}{" "}
                        {unitIcons.knight}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Defender */}
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Verbleibende Einheiten nach Runde {round.round}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-red-400 font-semibold">
                    {attackerName}:
                  </span>
                  <div className="flex gap-3 mt-1">
                    <span>
                      {Math.floor(round.remainingAttacker.swordsman)}{" "}
                      {unitIcons.swordsman}
                    </span>
                    <span>
                      {Math.floor(round.remainingAttacker.archer)}{" "}
                      {unitIcons.archer}
                    </span>
                    <span>
                      {Math.floor(round.remainingAttacker.knight)}{" "}
                      {unitIcons.knight}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-green-400 font-semibold">
                    {defenderName}:
                  </span>
                  <div className="flex gap-3 mt-1">
                    <span>
                      {Math.floor(round.remainingDefender.swordsman)}{" "}
                      {unitIcons.swordsman}
                    </span>
                    <span>
                      {Math.floor(round.remainingDefender.archer)}{" "}
                      {unitIcons.archer}
                    </span>
                    <span>
                      {Math.floor(round.remainingDefender.knight)}{" "}
                      {unitIcons.knight}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Result */}
      <div
        className={`mt-6 p-4 rounded-lg text-center ${
          battleData.winner === "attacker"
            ? "bg-red-900/30 border border-red-700"
            : battleData.winner === "defender"
            ? "bg-green-900/30 border border-green-700"
            : "bg-yellow-900/30 border border-yellow-700"
        }`}
      >
        <h3 className="text-xl font-bold mb-2">
          {battleData.winner === "attacker" && `🎉 ${attackerName} gewinnt! 🎉`}
          {battleData.winner === "defender" && `🛡️ ${defenderName} gewinnt! 🛡️`}
          {battleData.winner === "draw" && "🤝 Unentschieden! 🤝"}
        </h3>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <p className="text-gray-400 mb-1">Überlebende {attackerName}:</p>
            <div className="flex justify-center gap-3">
              <span>
                {Math.floor(battleData.survivors.attacker.swordsman)}{" "}
                {unitIcons.swordsman}
              </span>
              <span>
                {Math.floor(battleData.survivors.attacker.archer)}{" "}
                {unitIcons.archer}
              </span>
              <span>
                {Math.floor(battleData.survivors.attacker.knight)}{" "}
                {unitIcons.knight}
              </span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Überlebende {defenderName}:</p>
            <div className="flex justify-center gap-3">
              <span>
                {Math.floor(battleData.survivors.defender.swordsman)}{" "}
                {unitIcons.swordsman}
              </span>
              <span>
                {Math.floor(battleData.survivors.defender.archer)}{" "}
                {unitIcons.archer}
              </span>
              <span>
                {Math.floor(battleData.survivors.defender.knight)}{" "}
                {unitIcons.knight}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
