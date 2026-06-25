import { ITEMS } from '../data/items';
import type { GameSave, ItemId } from '../types';
import { hasItems, removeItems } from './inventory';
import { durabilityCurrent, durabilityMax, durabilityRatio, repairDurability } from './durability';

export interface MaintenanceResult {
  ok: boolean;
  message: string;
  itemId?: ItemId;
  before?: number;
  after?: number;
}

export function equippedConditionLine(save: GameSave): string {
  const itemId = save.player.equipped;
  const max = durabilityMax(itemId);
  if (max <= 0) return `Gear: ${ITEMS[itemId].name} needs no maintenance.`;
  const current = durabilityCurrent(save, itemId);
  const state = current / max > 0.5 ? 'stable' : current / max > 0.25 ? 'worn' : 'fragile';
  return `Gear: ${ITEMS[itemId].name} ${Math.ceil(current)}/${max} ${state}, damage ${Math.round(equipmentConditionMultiplier(save, itemId) * 100)}%.`;
}

export function equippedCombatDamage(save: GameSave): number {
  return Math.ceil(baseCombatDamage(save.player.equipped) * equipmentConditionMultiplier(save, save.player.equipped));
}

export function baseCombatDamage(itemId: ItemId): number {
  if (itemId === 'ironSword') return 26;
  if (itemId === 'stonePickaxe') return 18;
  if (itemId === 'ironPickaxe') return 20;
  if (itemId === 'woodenAxe') return 17;
  if (itemId === 'ironAxe') return 21;
  if (itemId === 'rustedSword') return 16;
  return 16;
}

export function equipmentConditionMultiplier(save: GameSave, itemId: ItemId): number {
  const max = durabilityMax(itemId);
  if (max <= 0) return 1;
  const ratio = durabilityRatio(save, itemId);
  if (ratio > 0.5) return 1;
  if (ratio > 0.25) return 0.85;
  return 0.65;
}

export function toolWorkDurationMultiplier(save: GameSave, itemId: ItemId): number {
  const max = durabilityMax(itemId);
  if (max <= 0) return 1;
  const ratio = durabilityRatio(save, itemId);
  if (ratio > 0.5) return 1;
  if (ratio > 0.25) return 1.15;
  return 1.4;
}

export function itemConditionState(save: GameSave, itemId: ItemId): 'stable' | 'worn' | 'fragile' | 'none' {
  const max = durabilityMax(itemId);
  if (max <= 0) return 'none';
  const ratio = durabilityRatio(save, itemId);
  if (ratio > 0.5) return 'stable';
  if (ratio > 0.25) return 'worn';
  return 'fragile';
}

export function repairEquippedItem(save: GameSave): MaintenanceResult {
  const itemId = save.player.equipped;
  const max = durabilityMax(itemId);
  if (max <= 0) return { ok: false, message: `${ITEMS[itemId].name} cannot be repaired.` };
  const before = durabilityCurrent(save, itemId);
  if (before >= max) return { ok: false, message: `${ITEMS[itemId].name} is already in good condition.`, itemId, before, after: before };
  if (!consumeRepairKit(save)) return { ok: false, message: 'Need repairKit x1.', itemId, before, after: before };
  repairDurability(save, itemId);
  return {
    ok: true,
    message: `Repaired ${ITEMS[itemId].name} ${Math.ceil(before)}/${max} -> ${max}/${max}.`,
    itemId,
    before,
    after: max
  };
}

function consumeRepairKit(save: GameSave): boolean {
  if (hasItems(save.player.inventory, { repairKit: 1 })) return removeItems(save.player.inventory, { repairKit: 1 });
  if (hasItems(save.player.storage, { repairKit: 1 })) return removeItems(save.player.storage, { repairKit: 1 });
  return false;
}
