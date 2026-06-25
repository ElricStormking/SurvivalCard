import type { EnemyId, GameSave, Inventory, ItemId } from '../types';

export interface SiegeScalingProfile {
  cycle: number;
  hpMultiplier: number;
  damageMultiplier: number;
  pressureLabel: string;
  pressureSummary: string;
}

const EXTRA_WAVE_POOLS: EnemyId[][] = [
  ['ghost', 'ghost', 'corpse'],
  ['wolf', 'corpse', 'wolf', 'ghost'],
  ['ghost', 'corpse', 'wolf']
];

export function siegeScalingProfile(save: GameSave): SiegeScalingProfile {
  const cycle = Math.max(0, save.world.siegeCyclesSurvived ?? 0);
  const hpMultiplier = roundToHundredths(Math.min(2.6, 1 + cycle * 0.18));
  const damageMultiplier = roundToHundredths(Math.min(2.2, 1 + cycle * 0.12));
  return {
    cycle,
    hpMultiplier,
    damageMultiplier,
    pressureLabel: pressureLabel(cycle),
    pressureSummary: pressureSummary(cycle, hpMultiplier, damageMultiplier)
  };
}

export function scaledSiegeWave(baseWave: EnemyId[], waveIndex: number, save: GameSave): EnemyId[] {
  const cycle = Math.max(0, save.world.siegeCyclesSurvived ?? 0);
  if (cycle <= 0) return [...baseWave];

  const additions = Math.min(4 + waveIndex, cycle + Math.floor(cycle / 2));
  const pool = EXTRA_WAVE_POOLS[waveIndex] ?? EXTRA_WAVE_POOLS[EXTRA_WAVE_POOLS.length - 1];
  const scaled = [...baseWave];
  for (let i = 0; i < additions; i += 1) {
    scaled.push(pool[(cycle + i + waveIndex) % pool.length]);
  }
  if (waveIndex === 2 && cycle >= 4) scaled.push('captain');
  return scaled;
}

export function scaledVictoryRewards(save: GameSave, baseRewards: Inventory): Inventory {
  const cycle = Math.max(0, save.world.siegeCyclesSurvived ?? 0);
  const rewards: Inventory = {};
  for (const [itemId, count] of Object.entries(baseRewards)) {
    rewards[itemId as ItemId] = Math.max(1, Math.floor(Number(count) * (1 + cycle * 0.45)));
  }
  if (cycle >= 1) rewards.ore = (rewards.ore ?? 0) + cycle;
  if (cycle >= 2) rewards.spiritPaper = (rewards.spiritPaper ?? 0) + Math.floor(cycle / 2);
  return rewards;
}

function pressureLabel(cycle: number): string {
  if (cycle >= 6) return 'Overwhelming';
  if (cycle >= 4) return 'Severe';
  if (cycle >= 2) return 'Rising';
  if (cycle >= 1) return 'Stirring';
  return 'First Siege';
}

function pressureSummary(cycle: number, hpMultiplier: number, damageMultiplier: number): string {
  if (cycle <= 0) return 'First-cycle siege pressure. Enemy stats and wave sizes are at prototype baseline.';
  return `Cycle ${cycle + 1} pressure: enemies have ${Math.round(hpMultiplier * 100)}% HP, ${Math.round(damageMultiplier * 100)}% damage, and extra wave bodies.`;
}

function roundToHundredths(value: number): number {
  return Math.round(value * 100) / 100;
}
