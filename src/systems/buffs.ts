import type { ActiveBuffId, GameSave, ItemId } from '../types';

interface BuffDef {
  name: string;
  seconds: number;
  regenerationMultiplier?: number;
  regenerationFlat?: number;
}

const BUFFS: Record<ActiveBuffId, BuffDef> = {
  warmMeal: {
    name: 'Warm Meal',
    seconds: 90,
    regenerationMultiplier: 1.12
  },
  herbalFortitude: {
    name: 'Herbal Fortitude',
    seconds: 180,
    regenerationMultiplier: 1.28,
    regenerationFlat: 0.12
  },
  mendingPoultice: {
    name: 'Mending Poultice',
    seconds: 75,
    regenerationFlat: 0.32
  }
};

const CONSUMABLE_BUFFS: Partial<Record<ItemId, ActiveBuffId>> = {
  grilledMeat: 'warmMeal',
  herbSteak: 'herbalFortitude',
  medicine: 'mendingPoultice'
};

export function applyConsumableBuff(save: GameSave, itemId: ItemId): string | undefined {
  const buffId = CONSUMABLE_BUFFS[itemId];
  if (!buffId) return undefined;
  save.player.activeBuffs[buffId] = { remaining: BUFFS[buffId].seconds };
  return BUFFS[buffId].name;
}

export function tickActiveBuffs(save: GameSave, seconds: number): void {
  for (const [buffId, state] of Object.entries(save.player.activeBuffs) as [ActiveBuffId, { remaining: number }][]) {
    const remaining = state.remaining - seconds;
    if (remaining <= 0) delete save.player.activeBuffs[buffId];
    else state.remaining = remaining;
  }
}

export function activeBuffBonuses(save: GameSave): { regenerationMultiplier: number; regenerationFlat: number } {
  let regenerationMultiplier = 1;
  let regenerationFlat = 0;
  for (const [buffId, state] of Object.entries(save.player.activeBuffs) as [ActiveBuffId, { remaining: number }][]) {
    if (state.remaining <= 0) continue;
    const def = BUFFS[buffId];
    regenerationMultiplier *= def.regenerationMultiplier ?? 1;
    regenerationFlat += def.regenerationFlat ?? 0;
  }
  return { regenerationMultiplier, regenerationFlat };
}

export function activeBuffLine(save: GameSave): string {
  const entries = (Object.entries(save.player.activeBuffs) as [ActiveBuffId, { remaining: number }][])
    .filter(([, state]) => state.remaining > 0)
    .map(([buffId, state]) => `${BUFFS[buffId].name} ${formatRemaining(state.remaining)}`);
  return entries.length ? `Buffs: ${entries.join(', ')}` : 'Buffs: none';
}

function formatRemaining(seconds: number): string {
  const rounded = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}
