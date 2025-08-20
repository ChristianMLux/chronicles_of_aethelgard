import { BASE_BUILDING_COST, BUILDING_LIST } from "@/config/buildings.config";
import { GAME_CONSTANTS } from "@/config/game.constants";
import { RESEARCH_CONFIG } from "@/config/research.config";
import {
  UNIT_CONFIG,
  UNIT_DETAILS_CONFIG,
  UNIT_LIST,
} from "@/config/units.config";
import { GameConfig, ResearchKey, ResourceKey } from "@/types";

export async function getGameConfig(): Promise<GameConfig> {
  const config: GameConfig = {
    buildings: {
      quarry: {},
      sawmill: {},
      farm: {},
      manamine: {},
      barracks: {},
    },
    units: {
      swordsman: {},
      archer: {},
      knight: {},
    },
    research: {
      blacksmithing: {},
      armorsmithing: {},
      enchanting: {},
      logistics: {},
      espionage: {},
      administration: {},
    },
  };

  for (const building of BUILDING_LIST) {
    for (let level = 1; level <= 20; level++) {
      const baseCost = BASE_BUILDING_COST[building];
      const cost: Partial<Record<ResourceKey, number>> = {};

      (Object.keys(baseCost) as ResourceKey[]).forEach((resource) => {
        const baseVal = baseCost[resource] ?? 0;
        cost[resource] = Math.floor(
          baseVal * Math.pow(GAME_CONSTANTS.COST_GROWTH_FACTOR, level - 1)
        );
      });

      config.buildings[building][level] = {
        level: level,
        cost: cost,
        constructionTime: Math.round(
          GAME_CONSTANTS.BASE_BUILD_TIME_SECONDS *
            Math.pow(GAME_CONSTANTS.BUILD_TIME_GROWTH_FACTOR, level - 1)
        ),
      };
    }
  }

  for (const unit of UNIT_LIST) {
    config.units[unit][1] = {
      ...UNIT_CONFIG[unit],
      ...UNIT_DETAILS_CONFIG[unit],
    };
  }

  const researchKeys = Object.keys(RESEARCH_CONFIG) as ResearchKey[];

  for (const researchKey of researchKeys) {
    const researchData = RESEARCH_CONFIG[researchKey];

    for (const levelStr in researchData.levels) {
      const level = parseInt(levelStr, 10);
      const levelDetails = researchData.levels[level];

      if (levelDetails) {
        config.research[researchKey][level] = {
          name: researchData.name,
          description: researchData.description,
          costs: levelDetails.cost,
          researchTime: levelDetails.researchTime,
        };
      }
    }
  }

  return config;
}

export function getResearchUpgradeCost(nextLevel: number): number {
  return Math.floor(
    GAME_CONSTANTS.BASE_RESEARCH_COST_MANA *
      Math.pow(
        GAME_CONSTANTS.RESEARCH_GROWTH_FACTOR,
        Math.max(0, nextLevel - 1)
      )
  );
}

export function getResearchTimeSeconds(targetLevel: number): number {
  const base = 40;
  const factor = 1.3;
  return Math.round(base * Math.pow(factor, Math.max(0, targetLevel - 1)));
}
