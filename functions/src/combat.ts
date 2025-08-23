// ============= TYPEN UND INTERFACES =============
interface UnitStats {
  attack: number;
  defense: number;
  armor: number;
  counters: UnitType;
}

type UnitType = "swordsman" | "archer" | "knight";

interface Army {
  swordsman: number;
  archer: number;
  knight: number;
}

export interface CombatResult {
  totalDamage: number;
  losses: Army;
  hasCounter: boolean;
  counterType?: UnitType;
  details: UnitCombatDetail[];
}

interface UnitCombatDetail {
  unitType: UnitType;
  unitCount: number;
  damage: number;
  losses: number;
  hasCounter: boolean;
  targetType?: UnitType;
}

interface RoundResult {
  round: number;
  attackerDamage: number;
  defenderDamage: number;
  attackerLosses: Army;
  defenderLosses: Army;
  attackerDetails: UnitCombatDetail[];
  defenderDetails: UnitCombatDetail[];
  remainingAttacker: Army;
  remainingDefender: Army;
}

// ============= EINHEITEN-KONFIGURATION =============
const UNIT_STATS: Record<UnitType, UnitStats> = {
  swordsman: {
    attack: 50,
    defense: 100,
    armor: 10,
    counters: "knight",
  },
  archer: {
    attack: 70,
    defense: 60,
    armor: 5,
    counters: "swordsman",
  },
  knight: {
    attack: 60,
    defense: 150,
    armor: 20,
    counters: "archer",
  },
};

// Konter-Bonus
const COUNTER_BONUS = 1.25; // 25% Bonus

// ============= KAMPFBERECHNUNG =============

/**
 * Berechnet den Schaden einer Einheitengruppe gegen eine andere
 */
function calculateUnitDamage(
  attackerType: UnitType,
  attackerCount: number,
  defenderType: UnitType,
  defenderCount: number,
  attackResearch: number = 0,
  armorResearch: number = 0
): UnitCombatDetail {
  const attackerStats = UNIT_STATS[attackerType];
  const defenderStats = UNIT_STATS[defenderType];

  // Basis-Angriff
  let totalAttack = attackerCount * attackerStats.attack;

  // Forschungsbonus (10% pro Level)
  const attackBonus = 1 + attackResearch * 0.1;
  totalAttack *= attackBonus;

  // Konter-Bonus prüfen
  const hasCounter = attackerStats.counters === defenderType;
  if (hasCounter) {
    totalAttack *= COUNTER_BONUS;
  }

  // Verteidiger Rüstung mit Forschungsbonus
  const armorBonus = 1 + armorResearch * 0.1;
  const effectiveArmor = defenderStats.armor * armorBonus;

  // Schaden pro verteidigender Einheit
  const damagePerUnit = Math.max(
    1,
    totalAttack / Math.max(1, defenderCount) - effectiveArmor
  );

  // Gesamtschaden und Verluste
  const totalDamage = damagePerUnit * defenderCount;
  const losses = Math.min(defenderCount, totalDamage / defenderStats.defense);

  return {
    unitType: attackerType,
    unitCount: attackerCount,
    damage: totalDamage,
    losses: losses,
    hasCounter: hasCounter,
    targetType: hasCounter ? defenderType : undefined,
  };
}

/**
 * Berechnet den Gesamtschaden einer Armee gegen eine andere
 */
function calculateArmyDamage(
  attacker: Army,
  defender: Army,
  attackResearch: number = 0,
  defenderArmorResearch: number = 0
): CombatResult {
  const details: UnitCombatDetail[] = [];
  const totalLosses: Army = { swordsman: 0, archer: 0, knight: 0 };
  let totalDamage = 0;
  let hasAnyCounter = false;
  let primaryCounterType: UnitType | undefined;

  // Für jeden Angreifer-Typ
  const attackerTypes: UnitType[] = ["swordsman", "archer", "knight"];
  const defenderTypes: UnitType[] = ["swordsman", "archer", "knight"];

  for (const attackerType of attackerTypes) {
    if (attacker[attackerType] <= 0) continue;

    // Verteile den Angriff proportional auf alle Verteidiger-Typen
    const attackerTypeDetails: UnitCombatDetail[] = [];

    for (const defenderType of defenderTypes) {
      if (defender[defenderType] <= 0) continue;

      // Berechne Schaden dieses Angreifer-Typs gegen diesen Verteidiger-Typ
      const combatDetail = calculateUnitDamage(
        attackerType,
        attacker[attackerType],
        defenderType,
        defender[defenderType],
        attackResearch,
        defenderArmorResearch
      );

      // Proportionale Verteilung basierend auf Verteidiger-Anzahl
      const defenderTotal =
        defender.swordsman + defender.archer + defender.knight;
      const proportion = defender[defenderType] / Math.max(1, defenderTotal);

      combatDetail.damage *= proportion;
      combatDetail.losses *= proportion;
      combatDetail.unitCount *= proportion;

      attackerTypeDetails.push(combatDetail);

      if (combatDetail.hasCounter) {
        hasAnyCounter = true;
        if (!primaryCounterType) {
          primaryCounterType = defenderType;
        }
      }
    }

    const aggregated: UnitCombatDetail = {
      unitType: attackerType,
      unitCount: attacker[attackerType],
      damage: attackerTypeDetails.reduce((sum, d) => sum + d.damage, 0),
      losses: 0,
      hasCounter: attackerTypeDetails.some((d) => d.hasCounter),
      targetType: attackerTypeDetails.find((d) => d.hasCounter)?.targetType,
    };

    // Verteile Verluste auf Verteidiger-Typen
    for (const defenderType of defenderTypes) {
      const detail = attackerTypeDetails.find(
        (d) =>
          d.targetType === defenderType ||
          (d.unitType === attackerType && !d.hasCounter)
      );
      if (detail) {
        totalLosses[defenderType] += detail.losses;
      }
    }

    details.push(aggregated);
    totalDamage += aggregated.damage;
  }

  // Normalisiere Verluste (können nicht höher sein als vorhandene Einheiten)
  for (const unitType of defenderTypes) {
    totalLosses[unitType] = Math.min(totalLosses[unitType], defender[unitType]);
  }

  return {
    totalDamage,
    losses: totalLosses,
    hasCounter: hasAnyCounter,
    counterType: primaryCounterType,
    details,
  };
}

/**
 * Simuliert eine komplette Schlacht über mehrere Runden
 */
export function simulateBattle(
  attackerArmy: Army,
  defenderArmy: Army,
  attackerResearch: { attack: number; armor: number },
  defenderResearch: { attack: number; armor: number },
  maxRounds: number = 10
): {
  rounds: RoundResult[];
  winner: "attacker" | "defender" | "draw";
  survivors: { attacker: Army; defender: Army };
} {
  const rounds: RoundResult[] = [];
  const currentAttacker = { ...attackerArmy };
  const currentDefender = { ...defenderArmy };

  for (let round = 1; round <= maxRounds; round++) {
    // Prüfe ob noch Einheiten vorhanden
    const attackerTotal =
      currentAttacker.swordsman +
      currentAttacker.archer +
      currentAttacker.knight;
    const defenderTotal =
      currentDefender.swordsman +
      currentDefender.archer +
      currentDefender.knight;

    if (attackerTotal <= 0 || defenderTotal <= 0) break;

    const attackerDamageResult = calculateArmyDamage(
      currentAttacker,
      currentDefender,
      attackerResearch.attack,
      defenderResearch.armor
    );

    const defenderDamageResult = calculateArmyDamage(
      currentDefender,
      currentAttacker,
      defenderResearch.attack,
      attackerResearch.armor
    );

    currentDefender.swordsman -= attackerDamageResult.losses.swordsman;
    currentDefender.archer -= attackerDamageResult.losses.archer;
    currentDefender.knight -= attackerDamageResult.losses.knight;

    currentAttacker.swordsman -= defenderDamageResult.losses.swordsman;
    currentAttacker.archer -= defenderDamageResult.losses.archer;
    currentAttacker.knight -= defenderDamageResult.losses.knight;

    currentAttacker.swordsman = Math.max(0, currentAttacker.swordsman);
    currentAttacker.archer = Math.max(0, currentAttacker.archer);
    currentAttacker.knight = Math.max(0, currentAttacker.knight);
    currentDefender.swordsman = Math.max(0, currentDefender.swordsman);
    currentDefender.archer = Math.max(0, currentDefender.archer);
    currentDefender.knight = Math.max(0, currentDefender.knight);

    rounds.push({
      round,
      attackerDamage: attackerDamageResult.totalDamage,
      defenderDamage: defenderDamageResult.totalDamage,
      attackerLosses: defenderDamageResult.losses,
      defenderLosses: attackerDamageResult.losses,
      attackerDetails: attackerDamageResult.details,
      defenderDetails: defenderDamageResult.details,
      remainingAttacker: { ...currentAttacker },
      remainingDefender: { ...currentDefender },
    });
  }

  const finalAttackerTotal =
    currentAttacker.swordsman + currentAttacker.archer + currentAttacker.knight;
  const finalDefenderTotal =
    currentDefender.swordsman + currentDefender.archer + currentDefender.knight;

  let winner: "attacker" | "defender" | "draw";
  if (finalAttackerTotal > 0 && finalDefenderTotal <= 0) {
    winner = "attacker";
  } else if (finalDefenderTotal > 0 && finalAttackerTotal <= 0) {
    winner = "defender";
  } else {
    winner = "draw";
  }

  return {
    rounds,
    winner,
    survivors: {
      attacker: currentAttacker,
      defender: currentDefender,
    },
  };
}

// ============= KAMPFBERICHT FORMATIERUNG =============

/**
 * Formatiert die Kampfdetails für die Anzeige
 */
export function formatBattleReport(
  battleResult: ReturnType<typeof simulateBattle>
): string[] {
  const logs: string[] = [];
  const unitIcons = {
    swordsman: "⚔️",
    archer: "🏹",
    knight: "🐴",
  };

  logs.push("⚔️ KAMPF BEGINNT ⚔️");
  logs.push("");

  for (const round of battleResult.rounds) {
    logs.push(`📍 RUNDE ${round.round}`);
    logs.push("");

    // Angreifer Details
    logs.push("ANGREIFER:");
    for (const detail of round.attackerDetails) {
      if (detail.unitCount > 0) {
        let log = `${unitIcons[detail.unitType]} ${Math.floor(
          detail.unitCount
        )} ${detail.unitType} → ${Math.floor(detail.damage)} Schaden`;
        if (detail.hasCounter) {
          log += ` ⚡ KONTER gegen ${detail.targetType}! (+25%)`;
        }
        logs.push(log);
      }
    }
    logs.push(`Gesamt: ${Math.floor(round.attackerDamage)} Schaden`);
    logs.push(
      `Verteidiger verliert: ${Math.floor(
        round.defenderLosses.swordsman
      )} Schwertkämpfer, ${Math.floor(
        round.defenderLosses.archer
      )} Bogenschützen, ${Math.floor(round.defenderLosses.knight)} Ritter`
    );
    logs.push("");

    // Verteidiger Details
    logs.push("VERTEIDIGER:");
    for (const detail of round.defenderDetails) {
      if (detail.unitCount > 0) {
        let log = `${unitIcons[detail.unitType]} ${Math.floor(
          detail.unitCount
        )} ${detail.unitType} → ${Math.floor(detail.damage)} Schaden`;
        if (detail.hasCounter) {
          log += ` ⚡ KONTER gegen ${detail.targetType}! (+25%)`;
        }
        logs.push(log);
      }
    }
    logs.push(`Gesamt: ${Math.floor(round.defenderDamage)} Schaden`);
    logs.push(
      `Angreifer verliert: ${Math.floor(
        round.attackerLosses.swordsman
      )} Schwertkämpfer, ${Math.floor(
        round.attackerLosses.archer
      )} Bogenschützen, ${Math.floor(round.attackerLosses.knight)} Ritter`
    );
    logs.push("");

    // Verbleibende Einheiten
    logs.push("VERBLEIBEND:");
    logs.push(
      `Angreifer: ${Math.floor(
        round.remainingAttacker.swordsman
      )} ⚔️ | ${Math.floor(round.remainingAttacker.archer)} 🏹 | ${Math.floor(
        round.remainingAttacker.knight
      )} 🐴`
    );
    logs.push(
      `Verteidiger: ${Math.floor(
        round.remainingDefender.swordsman
      )} ⚔️ | ${Math.floor(round.remainingDefender.archer)} 🏹 | ${Math.floor(
        round.remainingDefender.knight
      )} 🐴`
    );
    logs.push("━━━━━━━━━━━━━━━━━━━━");
    logs.push("");
  }

  // Endergebnis
  logs.push("🏁 KAMPF ENDE 🏁");
  if (battleResult.winner === "attacker") {
    logs.push("🎉 ANGREIFER GEWINNT! 🎉");
  } else if (battleResult.winner === "defender") {
    logs.push("🛡️ VERTEIDIGER GEWINNT! 🛡️");
  } else {
    logs.push("🤝 UNENTSCHIEDEN! 🤝");
  }

  return logs;
}
