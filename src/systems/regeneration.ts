import { TUNING } from '../data/tuning';
import type { GameSave } from '../types';
import { activeBuffBonuses } from './buffs';
import { dailyCondition } from './dailyConditions';

export function hungerRegenerationMultiplier(hunger: number): number {
  if (hunger >= 75) return 1;
  if (hunger >= 50) return 0.75;
  if (hunger >= 25) return 0.5;
  return 0;
}

export function effectiveRegenerationPerSecond(save: GameSave): number {
  const player = save.player;
  const hungerMultiplier = hungerRegenerationMultiplier(player.hunger);
  if (hungerMultiplier <= 0) return 0;
  const skillMultiplier = 1 + Math.max(0, player.skills.gathering.level - 1) * TUNING.survival.regenerationSkillBonusPerLevel;
  const activeBuffs = activeBuffBonuses(save);
  const buffMultiplier = player.buffs.regenerationMultiplier * activeBuffs.regenerationMultiplier;
  const buffFlat = player.buffs.regenerationFlat + activeBuffs.regenerationFlat;
  return Math.max(0, (player.regenerate + buffFlat) * hungerMultiplier * skillMultiplier * buffMultiplier * dailyCondition(save).regenerationMultiplier);
}

export function effectivePetRegenerationPerSecond(save: GameSave): number {
  const pet = save.player.spiritDog;
  if (!pet.unlocked || pet.hp <= 0) return 0;
  const hungerMultiplier = hungerRegenerationMultiplier(save.player.hunger);
  if (hungerMultiplier <= 0) return 0;
  const bondMultiplier = 1 + Math.max(0, save.player.affinities.light) * 0.02;
  const activeBuffs = activeBuffBonuses(save);
  const buffMultiplier = pet.buffs.regenerationMultiplier * activeBuffs.regenerationMultiplier;
  const buffFlat = pet.buffs.regenerationFlat + activeBuffs.regenerationFlat;
  return Math.max(0, (pet.regenerate + buffFlat) * hungerMultiplier * bondMultiplier * buffMultiplier * dailyCondition(save).regenerationMultiplier);
}
