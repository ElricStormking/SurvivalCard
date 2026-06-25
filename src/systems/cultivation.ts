import { TUNING } from '../data/tuning';
import type { GameSave } from '../types';
import { tickWorld } from './time';

export interface CultivationResult {
  minutes: number;
  insightGained: number;
  breakthrough: boolean;
  hpRestored: number;
  energyRestored: number;
  spiritRestored: number;
  hungerSpent: number;
}

export function insightForNextBreakthrough(breakthroughs: number): number {
  return 100 + breakthroughs * 65;
}

export function meditate(save: GameSave, minutes = 120): CultivationResult {
  return applyCultivationTime(save, minutes, {
    insightRate: 1,
    hpRate: 0.28,
    energyRate: 0.58,
    spiritRate: 0.34,
    hungerRate: 0.16
  });
}

export function restUntilDawn(save: GameSave): CultivationResult {
  const dawn = 6 * 60;
  const minutesUntilDawn = save.world.minutes < dawn ? dawn - save.world.minutes : (24 * 60 - save.world.minutes) + dawn;
  return applyCultivationTime(save, minutesUntilDawn, {
    insightRate: 0.32,
    hpRate: 0.42,
    energyRate: 0.82,
    spiritRate: 0.22,
    hungerRate: 0.12
  });
}

function applyCultivationTime(
  save: GameSave,
  minutes: number,
  rates: { insightRate: number; hpRate: number; energyRate: number; spiritRate: number; hungerRate: number }
): CultivationResult {
  const boundedMinutes = Math.max(1, Math.round(minutes));
  const player = save.player;
  const previousHp = player.hp;
  const previousEnergy = player.energy;
  const previousSpirit = player.spirit;
  const previousHunger = player.hunger;
  const hungerMultiplier = previousHunger >= 50 ? 1 : previousHunger >= 25 ? 0.7 : 0.35;
  const spiritAffinity = 1 + player.attributes.spirit * 0.035 + player.affinities.light * 0.015;
  const insightGained = Math.max(1, Math.round(boundedMinutes * rates.insightRate * hungerMultiplier * spiritAffinity));

  tickWorld(save, boundedMinutes / Math.max(1, save.world.timeScale) * 1000);
  player.hunger = Math.max(0, player.hunger - boundedMinutes * rates.hungerRate);
  player.energy = Math.min(100, player.energy + boundedMinutes * rates.energyRate);
  player.spirit = Math.min(100, player.spirit + boundedMinutes * rates.spiritRate);
  player.hp = Math.min(100, player.hp + boundedMinutes * rates.hpRate);
  player.cultivation.insight += insightGained;

  let breakthrough = false;
  while (player.cultivation.insight >= insightForNextBreakthrough(player.cultivation.breakthroughs)) {
    player.cultivation.insight -= insightForNextBreakthrough(player.cultivation.breakthroughs);
    player.cultivation.breakthroughs += 1;
    player.cultivation.realm = 'Qi Gathering';
    player.skillPoints += 1;
    player.spirit = Math.min(100, player.spirit + 12);
    player.regenerate += TUNING.survival.baseRegenerationPerSecond * 0.08;
    breakthrough = true;
  }

  return {
    minutes: boundedMinutes,
    insightGained,
    breakthrough,
    hpRestored: Math.max(0, player.hp - previousHp),
    energyRestored: Math.max(0, player.energy - previousEnergy),
    spiritRestored: Math.max(0, player.spirit - previousSpirit),
    hungerSpent: Math.max(0, previousHunger - player.hunger)
  };
}
