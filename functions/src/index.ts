import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { simulateBattle } from "./combat";

admin.initializeApp();
const db = admin.firestore();

// ========== TYPES ==========
type BattleSimulationResult = ReturnType<typeof simulateBattle>;

interface BattleReport extends BattleSimulationResult {
  attackerId: string;
  defenderId: string;
  attackerUnits: Record<UnitKey, number>;
  defenderUnits: Record<UnitKey, number>;
}

interface SpyReport {
  success: boolean;
  detectionChance: number;
  spiesLost: number;
  targetResources?: Partial<Record<ResourceKey, number>>;
  targetArmy?: Record<UnitKey, number>;
  targetBuildings?: {
    farm?: number;
    sawmill?: number;
    quarry?: number;
    manamine?: number;
    barracks?: number;
  };
  targetResearch?: Research;
  targetCityCount?: number;
}

export type UnitKey = "swordsman" | "archer" | "knight" | "spy";
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
  ownerId: string;
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

interface MissionReport {
  id: string;
  missionId: string;
  ownerId: string;
  actionType: "ATTACK" | "GATHER" | "DEFENSE" | "SPY";
  timestamp: FieldValue;
  read: boolean;
  targetCoords: { x: number; y: number };
  battleDetails?: BattleReport;
  spyDetails?: SpyReport;
  gatheredResources?: Partial<Record<ResourceKey, number>>;
  isDefender?: boolean;
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
  spy: {
    attack: 1,
    defense: 1,
    armor: 100,
    speed: 150,
    capacity: 25,
    counter: "swordsman" as UnitKey,
    spyPower: 10,
  },
};

// ========== PRODUCTION RATES ==========
const PRODUCTION_RATES = {
  farm: 100000,
  sawmill: 10000,
  quarry: 60000,
  manamine: 40000,
};

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

// ========== HELPER FUNCTIONS ==========
function removeUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues) as T;
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const key in obj) {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}

// ========== PROCESS MISSIONS FUNCTION ==========
export const processMissions = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "Europe/Berlin",
    region: "europe-west1",
    memory: "512MiB",
    maxInstances: 10,
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_event) => {
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
            processedMissions++;
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
                processedMissions++;
                continue;
              }
              const attackerCity = attackerCityDoc.data() as City;

              const defaultUnits: Record<UnitKey, number> = {
                swordsman: 0,
                archer: 0,
                knight: 0,
                spy: 0,
              };

              const attackerResearch = {
                attack: attackerCity.research?.blacksmithing || 0,
                armor: attackerCity.research?.armorsmithing || 0,
              };

              let defenderArmyUnits: Record<UnitKey, number> = defaultUnits;
              let defenderResearch = { attack: 0, armor: 0 };
              let defenderOwnerId = "npc";

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
                  defenderArmyUnits = {
                    ...defaultUnits,
                    ...(defenderCity.army || {}),
                  };
                  defenderResearch = {
                    attack: defenderCity.research?.blacksmithing || 0,
                    armor: defenderCity.research?.armorsmithing || 0,
                  };
                  defenderOwnerId = targetTile.ownerId;
                }
              } else if (targetTile.type === "npc_camp") {
                defenderArmyUnits = targetTile.npcTroops || {
                  swordsman: 50,
                  archer: 50,
                  knight: 0,
                  spy: 0,
                };
                defenderResearch = {
                  attack: targetTile.npcLevel || 1,
                  armor: targetTile.npcLevel || 1,
                };
              }

              const report = simulateBattle(
                mission.army,
                defenderArmyUnits,
                attackerResearch,
                defenderResearch,
                20 // max rounds
              );

              const finalReport: BattleReport = {
                ...report,
                attackerId: mission.ownerId,
                defenderId: defenderOwnerId,
                attackerUnits: mission.army,
                defenderUnits: defenderArmyUnits,
              };

              const cleanedReport = removeUndefinedValues(finalReport);

              const reportRef = db.collection("battleReports").doc();
              batch.set(reportRef, cleanedReport);

              if (defenderOwnerId !== "npc" && targetTile.cityId) {
                const defenderCityRef = db
                  .collection("users")
                  .doc(defenderOwnerId)
                  .collection("cities")
                  .doc(targetTile.cityId);
                batch.update(defenderCityRef, {
                  army: report.survivors.defender,
                });

                const defenderReportRef = db
                  .collection("users")
                  .doc(defenderOwnerId)
                  .collection("reports")
                  .doc();

                const defenderReport: MissionReport = {
                  id: defenderReportRef.id,
                  missionId: mission.id,
                  ownerId: defenderOwnerId,
                  actionType: "DEFENSE",
                  timestamp: FieldValue.serverTimestamp(),
                  read: false,
                  targetCoords: mission.originCoords,
                  battleDetails: cleanedReport,
                  isDefender: true,
                };

                batch.set(defenderReportRef, defenderReport);
              } else if (
                defenderOwnerId === "npc" &&
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

              break;
            }

            case "SPY": {
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
                processedMissions++;
                continue;
              }
              const attackerCity = attackerCityDoc.data() as City;
              const attackerEspionageLevel =
                attackerCity.research?.espionage || 0;

              const spyCount = mission.army.spy || 0;

              if (spyCount === 0) {
                batch.update(missionRef, {
                  status: "returning",
                  reportId: "error_no_spies",
                });
                processedMissions++;
                continue;
              }

              // Success-rate
              const successChance = Math.min(
                100,
                50 + attackerEspionageLevel * 10 + spyCount / 100
              );

              const successRoll = Math.random() * 100;
              const success = successRoll <= successChance;

              const spyReport: SpyReport = {
                success: success,
                detectionChance: 0,
                spiesLost: 0,
              };

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
                  const defenderEspionageLevel =
                    defenderCity.research?.espionage || 0;

                  // Detection-Rate
                  const detectionChance = Math.max(
                    0,
                    30 +
                      defenderEspionageLevel * 10 -
                      attackerEspionageLevel * 5 -
                      spyCount / 200
                  );

                  spyReport.detectionChance = detectionChance;

                  const detectionRoll = Math.random() * 100;
                  const wasDetected = detectionRoll <= detectionChance;

                  if (wasDetected) {
                    const lossPercentage = 0.1 + Math.random() * 0.4;
                    spyReport.spiesLost = Math.floor(spyCount * lossPercentage);
                  }

                  if (success) {
                    spyReport.targetResources = defenderCity.resources;
                    spyReport.targetArmy = defenderCity.army;
                    spyReport.targetBuildings = defenderCity.buildings;
                    spyReport.targetResearch = defenderCity.research;

                    const defenderCitiesSnapshot = await db
                      .collection("users")
                      .doc(targetTile.ownerId)
                      .collection("cities")
                      .get();
                    spyReport.targetCityCount = defenderCitiesSnapshot.size;
                  }

                  if (wasDetected) {
                    const defenderReportRef = db
                      .collection("users")
                      .doc(targetTile.ownerId)
                      .collection("reports")
                      .doc();

                    const defenderReport: MissionReport = {
                      id: defenderReportRef.id,
                      missionId: mission.id,
                      ownerId: targetTile.ownerId,
                      actionType: "DEFENSE",
                      timestamp: FieldValue.serverTimestamp(),
                      read: false,
                      targetCoords: mission.originCoords,
                      spyDetails: {
                        success: false,
                        detectionChance: detectionChance,
                        spiesLost: 0,
                      },
                      isDefender: true,
                    };

                    batch.set(defenderReportRef, defenderReport);
                  }
                }
              } else if (targetTile.type === "npc_camp") {
                spyReport.detectionChance = 0;
                spyReport.spiesLost = 0;

                if (success) {
                  spyReport.targetArmy = targetTile.npcTroops || {
                    swordsman: 0,
                    archer: 0,
                    knight: 0,
                    spy: 0,
                  };
                }
              }

              const spyReportRef = db.collection("spyReports").doc();
              batch.set(spyReportRef, removeUndefinedValues(spyReport));

              const remainingSpies = spyCount - spyReport.spiesLost;
              batch.update(missionRef, {
                status: "returning",
                army: { ...mission.army, spy: remainingSpies },
                reportId: spyReportRef.id,
              });

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
          } else if (mission.actionType === "SPY" && mission.reportId) {
            const spyReportRef = db
              .collection("spyReports")
              .doc(mission.reportId);
            const spyReportDoc = await spyReportRef.get();

            if (spyReportDoc.exists) {
              const spyDetails = spyReportDoc.data() as SpyReport;

              newReport = {
                id: userReportRef.id,
                missionId: mission.id,
                ownerId: mission.ownerId,
                actionType: "SPY",
                timestamp: FieldValue.serverTimestamp(),
                read: false,
                targetCoords: mission.targetCoords,
                spyDetails: spyDetails,
              };

              batch.delete(spyReportRef);
            }
          } else if (mission.actionType === "ATTACK" && mission.reportId) {
            const battleReportRef = db
              .collection("battleReports")
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
                isDefender: false,
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
