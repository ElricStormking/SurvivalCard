import type { GameSave, Inventory } from '../types';
import { addItems } from './inventory';
import { scaledVictoryRewards } from './siegeScaling';

export interface SiegeResolution {
  outcome: 'victory' | 'defeat';
  title: string;
  summary: string;
  rewards: Inventory;
  losses: string[];
  coreHp: number;
  cyclesSurvived: number;
}

const VICTORY_REWARDS: Inventory = { spiritPaper: 4, ore: 3, herb: 3 };

export function resolveSiegeVictory(save: GameSave): SiegeResolution {
  const rewards = scaledVictoryRewards(save, VICTORY_REWARDS);
  const defenses = save.world.defenses;
  const losses: string[] = [];
  if (defenses.barricade > 0) losses.push('One barricade was battered apart.');
  if (defenses.spikeTrap > 0) losses.push('Spike traps were dulled by the assault.');
  if (defenses.fireTalismanTrap > 0) losses.push('Fire talisman traps burned out.');

  defenses.barricade = Math.max(0, defenses.barricade - 1);
  defenses.spikeTrap = Math.max(0, Math.floor(defenses.spikeTrap * 0.4));
  defenses.fireTalismanTrap = 0;
  save.world.formationCoreHp = Math.min(150, Math.max(60, save.world.formationCoreHp + 25));
  save.world.siegeWon = true;
  save.world.objectives.wonSiege = true;
  save.world.siegeCyclesSurvived = (save.world.siegeCyclesSurvived ?? 0) + 1;
  save.player.skillPoints += 1;
  addItems(save.player.storage, rewards);

  return {
    outcome: 'victory',
    title: 'Siege Broken',
    summary: 'The formation held through the night. The farm gains a quiet cycle to rebuild before the next pressure rises.',
    rewards,
    losses: losses.length ? losses : ['Defenses held without permanent loss.'],
    coreHp: save.world.formationCoreHp,
    cyclesSurvived: save.world.siegeCyclesSurvived
  };
}

export function resolveSiegeDefeat(save: GameSave): SiegeResolution {
  const storageLosses: Inventory = {};
  for (const id of ['log', 'stone', 'ore', 'herb', 'meat', 'resin', 'spiritPaper'] as const) {
    const count = save.player.storage[id] ?? 0;
    const lost = Math.ceil(count * 0.25);
    if (lost > 0) {
      storageLosses[id] = lost;
      save.player.storage[id] = count - lost;
      if ((save.player.storage[id] ?? 0) <= 0) delete save.player.storage[id];
    }
  }

  save.world.defenses = { barricade: 0, spikeTrap: 0, fireTalismanTrap: 0 };
  save.world.formationCoreHp = 55;
  save.world.siegeWon = false;
  save.player.hp = Math.max(1, Math.min(save.player.hp, 35));

  const losses = Object.entries(storageLosses).map(([id, count]) => `${id} x${count} lost from storage.`);
  losses.push('All placed defenses were destroyed.');

  return {
    outcome: 'defeat',
    title: 'Formation Breached',
    summary: 'The core failed before dawn. You dragged enough power back into it to keep the farm alive, but the next cycle starts wounded.',
    rewards: {},
    losses,
    coreHp: save.world.formationCoreHp,
    cyclesSurvived: save.world.siegeCyclesSurvived ?? 0
  };
}

export function beginNextSiegeCycle(save: GameSave): void {
  save.world.day = 1;
  save.world.minutes = 7 * 60;
  save.world.scene = 'farm';
  save.world.siegeWon = false;
  save.world.objectives.startedSiege = false;
  save.world.formationCoreHp = Math.max(55, Math.min(150, save.world.formationCoreHp));
}
