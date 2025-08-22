import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();
const db = admin.firestore();

// ========== TYPES ==========
export type UnitKey = "swordsman" | "archer" | "knight";
export type ResourceKey = "stone" | "wood" | "food" | "mana";
export type level = number;

interface Research {
  blacksmithing: level;
  armorsmithing: level;
  enchanting: level;
  logistics: level;
  espionage: level;
  administration: level;
}

interface WorldMission {
  id: string;
  ownerId: string;
  originCityId: string;
  originCoords: { x: number; y: number };
  targetTileId: string;
  targetCoords: { x: number; y: number };
  targetOwnerId?: string;
  actionType: "ATTACK" | "SPY" | "GATHER" | "SEND_RSS";
  army: Record<UnitKey, number>;
  resources?: Partial<Record<ResourceKey, number>>;
  startTime: number;
  arrivalTime: number;
  returnTime: number;
  status: "outgoing" | "arrived" | "returning" | "completed";
  reportId?: string;
}

interface Tile {
  id: string;
  coords: { x: number; y: number };
  type: "empty" | "city" | "resource" | "npc_camp" | "ruins";
  terrain: string;
  zone: string;
  ownerId?: string;
  cityId?: string;
  resourceType?: ResourceKey;
  resourceAmount?: number;
  activeMissionId?: string;
  npcLevel?: number;
  npcTroops?: Record<UnitKey, number>;
}

interface City {
  id: string;
  name: string;
  coords: { x: number; y: number };
  army?: Record<UnitKey, number>;
  resources?: Record<ResourceKey, number>;
  capacity?: Record<ResourceKey, number>;
  buildings?: {
    farm?: number;
    sawmill?: number;
    quarry?: number;
    manamine?: number;
  };
  research?: Research;
  lastTickAt?: admin.firestore.Timestamp;
}

interface BattleReport {
  attackerId: string;
  defenderId: string;
  attackerUnits: Record<UnitKey, number>;
  defenderUnits: Record<UnitKey, number>;
  rounds: Array<{
    round: number;
    attackerDamage: number;
    defenderDamage: number;
    attackerLosses: Record<UnitKey, number>;
    defenderLosses: Record<UnitKey, number>;
  }>;
  winner: "attacker" | "defender" | "draw";
  survivors: {
    attacker: Record<UnitKey, number>;
    defender: Record<UnitKey, number>;
  };
}

interface MissionReport {
  id: string;
  missionId: string;
  ownerId: string;
  actionType: "ATTACK" | "GATHER";
  timestamp: FieldValue;
  read: boolean;
  targetCoords: { x: number; y: number };
  battleDetails?: BattleReport;
  gatheredResources?: Partial<Record<ResourceKey, number>>;
}

// ========== UNIT CONFIG ==========
const UNIT_CONFIG = {
  swordsman: {
    attack: 50,
    defense: 100,
    armor: 10,
    speed: 50,
    capacity: 100,
    counter: "knight" as UnitKey,
  },
  archer: {
    attack: 70,
    defense: 60,
    armor: 5,
    speed: 75,
    capacity: 50,
    counter: "swordsman" as UnitKey,
  },
  knight: {
    attack: 60,
    defense: 150,
    armor: 20,
    speed: 100,
    capacity: 25,
    counter: "archer" as UnitKey,
  },
};

// ========== PRODUCTION RATES ==========
const PRODUCTION_RATES = {
  farm: 100000,
  sawmill: 10000,
  quarry: 60000,
  manamine: 40000,
};

// ========== COMBAT SYSTEM ==========
interface CombatArmy {
  ownerId: string;
  army: Record<UnitKey, number>;
  research: Research;
}

function calculateRoundDamage(
  attackerArmy: Record<UnitKey, number>,
  defenderArmy: Record<UnitKey, number>,
  attackerResearch: Research,
  defenderResearch: Research
): number {
  let totalDamage = 0;

  for (const attackerType in attackerArmy) {
    const attackerCount = attackerArmy[attackerType as UnitKey];
    if (attackerCount <= 0) continue;

    const attackerConfig = UNIT_CONFIG[attackerType as UnitKey];
    let unitDamage = attackerCount * attackerConfig.attack;
    unitDamage *= 1 + (attackerResearch.blacksmithing || 0) * 0.1;

    for (const defenderType in defenderArmy) {
      const defenderCount = defenderArmy[defenderType as UnitKey];
      if (defenderCount <= 0) continue;

      const defenderConfig = UNIT_CONFIG[defenderType as UnitKey];
      let finalUnitDamage = unitDamage;

      if (attackerConfig.counter === defenderType) {
        finalUnitDamage *= 1.25;
      }

      const effectiveArmor =
        defenderConfig.armor *
        (1 + (defenderResearch.armorsmithing || 0) * 0.1);
      const damagePerUnit = Math.max(
        1,
        finalUnitDamage / defenderCount - effectiveArmor
      );
      totalDamage += damagePerUnit * defenderCount;
    }
  }
  return totalDamage;
}

function calculateLosses(
  totalDamage: number,
  army: Record<UnitKey, number>
): Record<UnitKey, number> {
  const losses: Record<UnitKey, number> = {
    swordsman: 0,
    archer: 0,
    knight: 0,
  };

  const totalDefense = Object.entries(army).reduce((sum, [key, count]) => {
    return sum + UNIT_CONFIG[key as UnitKey].defense * count;
  }, 0);

  if (totalDefense === 0) return losses;

  for (const key in army) {
    const unitType = key as UnitKey;
    const unitCount = army[unitType];
    if (unitCount > 0) {
      const unitConfig = UNIT_CONFIG[unitType];
      const proportionOfTotalDefense =
        (unitConfig.defense * unitCount) / totalDefense;
      const damageToType = totalDamage * proportionOfTotalDefense;
      const unitsLost = Math.floor(damageToType / unitConfig.defense);
      losses[unitType] = Math.min(unitCount, unitsLost);
    }
  }
  return losses;
}

async function simulateCombat(
  attacker: CombatArmy,
  defender: CombatArmy
): Promise<BattleReport> {
  const attackerUnits = { ...attacker.army };
  const defenderUnits = { ...defender.army };
  const maxRounds = 20;
  const report: BattleReport = {
    attackerId: attacker.ownerId,
    defenderId: defender.ownerId,
    attackerUnits: { ...attacker.army },
    defenderUnits: { ...defender.army },
    rounds: [],
    winner: "draw",
    survivors: {
      attacker: { swordsman: 0, archer: 0, knight: 0 },
      defender: { swordsman: 0, archer: 0, knight: 0 },
    },
  };

  for (let i = 0; i < maxRounds; i++) {
    const roundNumber = i + 1;
    const attackerTotalUnits = Object.values(attackerUnits).reduce(
      (a, b) => a + b,
      0
    );
    const defenderTotalUnits = Object.values(defenderUnits).reduce(
      (a, b) => a + b,
      0
    );

    if (attackerTotalUnits <= 0 || defenderTotalUnits <= 0) break;

    const attackerDamage = calculateRoundDamage(
      attackerUnits,
      defenderUnits,
      attacker.research,
      defender.research
    );
    const defenderDamage = calculateRoundDamage(
      defenderUnits,
      attackerUnits,
      defender.research,
      attacker.research
    );

    const attackerLosses = calculateLosses(defenderDamage, attackerUnits);
    const defenderLosses = calculateLosses(attackerDamage, defenderUnits);

    for (const type in attackerLosses) {
      attackerUnits[type as UnitKey] = Math.max(
        0,
        attackerUnits[type as UnitKey] - attackerLosses[type as UnitKey]
      );
    }
    for (const type in defenderLosses) {
      defenderUnits[type as UnitKey] = Math.max(
        0,
        defenderUnits[type as UnitKey] - defenderLosses[type as UnitKey]
      );
    }

    report.rounds.push({
      round: roundNumber,
      attackerDamage,
      defenderDamage,
      attackerLosses,
      defenderLosses,
    });
  }

  const finalAttackerUnits = Object.values(attackerUnits).reduce(
    (a, b) => a + b,
    0
  );
  const finalDefenderUnits = Object.values(defenderUnits).reduce(
    (a, b) => a + b,
    0
  );

  if (finalAttackerUnits > 0 && finalDefenderUnits <= 0) {
    report.winner = "attacker";
  } else if (finalDefenderUnits > 0 && finalAttackerUnits <= 0) {
    report.winner = "defender";
  }

  report.survivors = { attacker: attackerUnits, defender: defenderUnits };
  return report;
}

// ========== RESOURCE TICK FUNCTION ==========
export const resourceTick = functions.https.onRequest(async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    let totalUpdatedCities = 0;
    const batch = db.batch();

    for (const userDoc of usersSnapshot.docs) {
      const citiesSnapshot = await userDoc.ref.collection("cities").get();

      if (citiesSnapshot.empty) {
        continue;
      }

      citiesSnapshot.forEach((cityDoc) => {
        const city = cityDoc.data() as City;
        const cityRef = cityDoc.ref;

        const now = admin.firestore.Timestamp.now();
        const lastUpdated = city.lastTickAt || now;

        const secondsPassed = now.seconds - lastUpdated.seconds;
        if (secondsPassed <= 0) {
          return;
        }
        const hoursPassed = secondsPassed / 3600;

        const farmLevel = city.buildings?.farm ?? 0;
        const sawmillLevel = city.buildings?.sawmill ?? 0;
        const quarryLevel = city.buildings?.quarry ?? 0;
        const manamineLevel = city.buildings?.manamine ?? 0;

        const foodProduction = farmLevel * PRODUCTION_RATES.farm * hoursPassed;
        const woodProduction =
          sawmillLevel * PRODUCTION_RATES.sawmill * hoursPassed;
        const stoneProduction =
          quarryLevel * PRODUCTION_RATES.quarry * hoursPassed;
        const manaProduction =
          manamineLevel * PRODUCTION_RATES.manamine * hoursPassed;

        const currentFood = city.resources?.food ?? 0;
        const currentWood = city.resources?.wood ?? 0;
        const currentStone = city.resources?.stone ?? 0;
        const currentMana = city.resources?.mana ?? 0;

        let newFood = Math.floor(currentFood + foodProduction);
        let newWood = Math.floor(currentWood + woodProduction);
        let newStone = Math.floor(currentStone + stoneProduction);
        let newMana = Math.floor(currentMana + manaProduction);

        newFood = Math.min(newFood, city.capacity?.food ?? newFood);
        newWood = Math.min(newWood, city.capacity?.wood ?? newWood);
        newStone = Math.min(newStone, city.capacity?.stone ?? newStone);
        newMana = Math.min(newMana, city.capacity?.mana ?? newMana);

        batch.update(cityRef, {
          "resources.food": newFood,
          "resources.wood": newWood,
          "resources.stone": newStone,
          "resources.mana": newMana,
          lastTickAt: now,
        });
        totalUpdatedCities++;
      });
    }

    await batch.commit();
    const successMessage = `Game tick executed. Updated ${totalUpdatedCities} cities.`;
    console.log(successMessage);
    res.status(200).send({ status: "success", message: successMessage });
  } catch (error) {
    console.error("Error executing game tick:", error);
    res.status(500).send({ status: "error", message: "Internal Server Error" });
  }
});

// ========== PROCESS MISSIONS FUNCTION ==========
export const processMissions = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "Europe/Berlin",
    region: "europe-west1",
    memory: "512MiB",
    maxInstances: 10,
  },
  async (event) => {
    try {
      console.log("Starting to process missions...");
      const now = Date.now();
      const batch = db.batch();
      let processedMissions = 0;

      const missionsSnapshot = await db
        .collection("worldMissions")
        .where("status", "in", ["outgoing", "returning"])
        .get();

      if (missionsSnapshot.empty) {
        console.log("No active missions found.");
        return;
      }

      console.log(
        `Found ${missionsSnapshot.docs.length} active missions to check.`
      );

      for (const doc of missionsSnapshot.docs) {
        const mission = doc.data() as WorldMission;
        const missionRef = doc.ref;

        // ===== Phase 1: (Status: "outgoing") =====
        if (mission.status === "outgoing" && now >= mission.arrivalTime) {
          console.log(`Processing arrival for mission ${mission.id}...`);
          const targetTileRef = db
            .collection("world")
            .doc(mission.targetTileId);
          const targetTileDoc = await targetTileRef.get();

          if (!targetTileDoc.exists) {
            batch.update(missionRef, { status: "returning" });
            continue;
          }
          const targetTile = targetTileDoc.data() as Tile;

          switch (mission.actionType) {
            case "GATHER": {
              let totalCapacity = 0;
              for (const unitId in mission.army) {
                const unitConf = UNIT_CONFIG[unitId as UnitKey];
                const amount = mission.army[unitId as UnitKey];
                totalCapacity += (unitConf.capacity || 0) * amount;
              }

              const resourceType = targetTile.resourceType;
              const availableResources = targetTile.resourceAmount ?? 0;
              const gatheredAmount = Math.min(
                totalCapacity,
                availableResources
              );

              if (gatheredAmount > 0 && resourceType) {
                const gatheredResources = { [resourceType]: gatheredAmount };
                batch.update(targetTileRef, {
                  resourceAmount: FieldValue.increment(-gatheredAmount),
                });
                batch.update(missionRef, {
                  status: "returning",
                  resources: gatheredResources,
                });
              } else {
                batch.update(missionRef, { status: "returning" });
              }
              break;
            }

            case "ATTACK": {
              const attackerCityRef = db
                .collection("users")
                .doc(mission.ownerId)
                .collection("cities")
                .doc(mission.originCityId);
              const attackerCityDoc = await attackerCityRef.get();

              if (!attackerCityDoc.exists) {
                batch.update(missionRef, {
                  status: "returning",
                  reportId: "error_no_attacker_city",
                });
                continue;
              }
              const attackerCity = attackerCityDoc.data() as City;

              const defaultResearch: Research = {
                blacksmithing: 0,
                armorsmithing: 0,
                enchanting: 0,
                logistics: 0,
                espionage: 0,
                administration: 0,
              };
              const defaultUnits: Record<UnitKey, number> = {
                swordsman: 0,
                archer: 0,
                knight: 0,
              };

              const attackerArmy: CombatArmy = {
                ownerId: mission.ownerId,
                army: mission.army,
                research: attackerCity.research || defaultResearch,
              };

              let defenderArmy: CombatArmy | null = null;

              if (
                targetTile.type === "city" &&
                targetTile.ownerId &&
                targetTile.cityId
              ) {
                const defenderCityRef = db
                  .collection("users")
                  .doc(targetTile.ownerId)
                  .collection("cities")
                  .doc(targetTile.cityId);
                const defenderCityDoc = await defenderCityRef.get();
                if (defenderCityDoc.exists) {
                  const defenderCity = defenderCityDoc.data() as City;
                  defenderArmy = {
                    ownerId: targetTile.ownerId,
                    army: { ...defaultUnits, ...(defenderCity.army || {}) },
                    research: defenderCity.research || defaultResearch,
                  };
                }
              } else if (targetTile.type === "npc_camp") {
                defenderArmy = {
                  ownerId: "npc",
                  army: targetTile.npcTroops || {
                    swordsman: 50,
                    archer: 50,
                    knight: 0,
                  },
                  research: {
                    ...defaultResearch,
                    blacksmithing: targetTile.npcLevel || 1,
                    armorsmithing: targetTile.npcLevel || 1,
                  },
                };
              }

              if (defenderArmy) {
                const report = await simulateCombat(attackerArmy, defenderArmy);
                const reportRef = db.collection("reports").doc();
                batch.set(reportRef, report);

                if (
                  defenderArmy.ownerId !== "npc" &&
                  targetTile.ownerId &&
                  targetTile.cityId
                ) {
                  const defenderCityRef = db
                    .collection("users")
                    .doc(targetTile.ownerId)
                    .collection("cities")
                    .doc(targetTile.cityId);
                  const defenderLossesUpdate: { [key: string]: FieldValue } =
                    {};
                  for (const unitType in report.survivors.defender) {
                    const losses =
                      (defenderArmy.army[unitType as UnitKey] || 0) -
                      (report.survivors.defender[unitType as UnitKey] || 0);
                    if (losses > 0) {
                      defenderLossesUpdate[`army.${unitType}`] =
                        FieldValue.increment(-losses);
                    }
                  }
                  if (Object.keys(defenderLossesUpdate).length > 0) {
                    batch.update(defenderCityRef, defenderLossesUpdate);
                  }
                } else if (
                  defenderArmy.ownerId === "npc" &&
                  report.winner === "attacker"
                ) {
                  batch.update(targetTileRef, {
                    type: "empty",
                    npcLevel: FieldValue.delete(),
                    npcTroops: FieldValue.delete(),
                    activeMissionId: FieldValue.delete(),
                  });
                }

                batch.update(missionRef, {
                  status: "returning",
                  army: report.survivors.attacker,
                  reportId: reportRef.id,
                });
              } else {
                batch.update(missionRef, {
                  status: "returning",
                  reportId: "error_no_defender",
                });
              }
              break;
            }
          }
          processedMissions++;
        }
        // ===== Phase 2: (Status: "returning") =====
        else if (mission.status === "returning" && now >= mission.returnTime) {
          console.log(`Processing return for mission ${mission.id}...`);

          const cityRef = db
            .collection("users")
            .doc(mission.ownerId)
            .collection("cities")
            .doc(mission.originCityId);
          const updates: { [key: string]: FieldValue } = {};

          for (const unitType in mission.army) {
            const unitCount = mission.army[unitType as UnitKey];
            if (unitCount > 0) {
              updates[`army.${unitType}`] = FieldValue.increment(unitCount);
            }
          }

          const userReportRef = db
            .collection("users")
            .doc(mission.ownerId)
            .collection("reports")
            .doc();
          let newReport: MissionReport | null = null;

          if (mission.actionType === "GATHER" && mission.resources) {
            for (const resourceType in mission.resources) {
              const resourceAmount =
                mission.resources[resourceType as ResourceKey] ?? 0;
              if (resourceAmount > 0) {
                updates[`resources.${resourceType}`] =
                  FieldValue.increment(resourceAmount);
              }
            }
            const tileRef = db.collection("world").doc(mission.targetTileId);
            batch.update(tileRef, { activeMissionId: FieldValue.delete() });

            newReport = {
              id: userReportRef.id,
              missionId: mission.id,
              ownerId: mission.ownerId,
              actionType: "GATHER",
              timestamp: FieldValue.serverTimestamp(),
              read: false,
              targetCoords: mission.targetCoords,
              gatheredResources: mission.resources,
            };
          } else if (mission.actionType === "ATTACK" && mission.reportId) {
            const battleReportRef = db
              .collection("reports")
              .doc(mission.reportId);
            const battleReportDoc = await battleReportRef.get();
            if (battleReportDoc.exists) {
              const battleDetails = battleReportDoc.data() as BattleReport;
              newReport = {
                id: userReportRef.id,
                missionId: mission.id,
                ownerId: mission.ownerId,
                actionType: "ATTACK",
                timestamp: FieldValue.serverTimestamp(),
                read: false,
                targetCoords: mission.targetCoords,
                battleDetails: battleDetails,
              };
              batch.delete(battleReportRef);
            }
          }

          if (newReport) {
            batch.set(userReportRef, newReport);
          }

          if (Object.keys(updates).length > 0) {
            batch.update(cityRef, updates);
          }

          batch.update(missionRef, { status: "completed" });
          console.log(`Mission ${mission.id} completed. Report generated.`);
          processedMissions++;
        }
      }

      if (processedMissions > 0) {
        await batch.commit();
        console.log(
          `Successfully processed ${processedMissions} mission updates.`
        );
      } else {
        console.log("No missions were ready to be processed in this run.");
      }
    } catch (error) {
      console.error("Error processing missions:", error);
    }
  }
);
