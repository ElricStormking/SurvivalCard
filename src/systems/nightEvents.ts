import type { GameSave, Inventory, NightEventId, NightEventRecord } from '../types';
import { addItems, removeItems } from './inventory';

interface NightEventTemplate {
  id: NightEventId;
  title: string;
  summary: string;
  apply: (save: GameSave) => string[];
}

const NIGHT_EVENTS: NightEventTemplate[] = [
  {
    id: 'wanderingGhost',
    title: 'Wandering Ghost',
    summary: 'A dim spirit drifted near the core before dawn.',
    apply: (save) => {
      if (save.world.defenses.fireTalismanTrap > 0) {
        save.world.defenses.fireTalismanTrap -= 1;
        return ['A fire talisman burned out and dispersed it.'];
      }
      if (save.player.spiritDog.command === 'guard' && save.player.spiritDog.hp > 10) {
        save.player.spiritDog.hp = Math.max(1, save.player.spiritDog.hp - 6);
        return ['Spirit Dog guarded the core, losing 6 HP.'];
      }
      save.world.formationCoreHp = Math.max(1, save.world.formationCoreHp - 6);
      return ['Formation Core lost 6 HP.'];
    }
  },
  {
    id: 'wildBeast',
    title: 'Wild Beast Tracks',
    summary: 'A hungry beast nosed through the outer fence.',
    apply: (save) => {
      if (save.player.spiritDog.command === 'attack' && save.player.spiritDog.hp > 15) {
        save.player.spiritDog.hp = Math.max(1, save.player.spiritDog.hp - 5);
        addItems(save.player.storage, { meat: 1 });
        return ['Spirit Dog drove it off and left meat x1 in storage.'];
      }
      save.player.hp = Math.max(1, save.player.hp - 8);
      return ['Player HP lost 8 from a late-night scramble.'];
    }
  },
  {
    id: 'moonlitHerb',
    title: 'Moonlit Herb Bloom',
    summary: 'A cold-blue herb opened under the mountain moon.',
    apply: (save) => {
      addItems(save.player.storage, { herb: 2, spiritPaper: 1 });
      return ['Storage gained herb x2 and spiritPaper x1.'];
    }
  },
  {
    id: 'woundedTraveler',
    title: 'Wounded Traveler',
    summary: 'A traveler left supplies after resting by the broken wall.',
    apply: (save) => {
      addItems(save.player.storage, { meat: 1, resin: 1 });
      save.player.cultivation.insight += 2;
      return ['Storage gained meat x1 and resin x1.', 'Cultivation insight +2.'];
    }
  },
  {
    id: 'thiefScout',
    title: 'Thief Scout',
    summary: 'Someone tested the farm storage before sunrise.',
    apply: (save) => {
      if (save.world.defenses.barricade > 0 || save.player.spiritDog.command === 'guard') {
        return ['The scout retreated after finding the farm guarded.'];
      }
      const stolen = stealFirstAvailable(save.player.storage, ['ore', 'herb', 'meat', 'resin', 'log']);
      return [stolen ? `Storage lost ${stolen}.` : 'The scout found nothing worth stealing.'];
    }
  }
];

export function resolveNightEvent(save: GameSave, completedDay: number): NightEventRecord | undefined {
  if (completedDay < 1 || completedDay >= 14) return undefined;
  if (save.world.lastNightEventDay >= completedDay) return undefined;
  const event = NIGHT_EVENTS[rollNightEventIndex(save.seed, completedDay, save.world.siegeCyclesSurvived ?? 0)];
  const record: NightEventRecord = {
    id: event.id,
    day: completedDay,
    title: event.title,
    summary: event.summary,
    effects: event.apply(save)
  };
  save.world.lastNightEventDay = completedDay;
  save.world.nightEventLog = [...(save.world.nightEventLog ?? []), record].slice(-6);
  return record;
}

export function latestNightEvent(save: GameSave): NightEventRecord | undefined {
  return save.world.nightEventLog?.[save.world.nightEventLog.length - 1];
}

function rollNightEventIndex(seed: number, day: number, cyclesSurvived: number): number {
  const value = Math.abs(Math.sin(seed * 0.013 + day * 12.9898 + cyclesSurvived * 4.1414) * 10000);
  return Math.floor(value) % NIGHT_EVENTS.length;
}

function stealFirstAvailable(storage: Inventory, priority: readonly (keyof Inventory)[]): string | undefined {
  for (const itemId of priority) {
    if ((storage[itemId] ?? 0) > 0) {
      removeItems(storage, { [itemId]: 1 });
      return `${itemId} x1`;
    }
  }
  return undefined;
}
