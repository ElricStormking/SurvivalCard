import { ITEMS } from '../data/items';
import type { GameSave, ItemId } from '../types';
import { hasItems, removeItems } from './inventory';

export interface DurabilityResult {
  itemId: ItemId;
  current: number;
  max: number;
  broke: boolean;
}

export function durabilityMax(itemId: ItemId): number {
  return ITEMS[itemId]?.durabilityMax ?? 0;
}

export function durabilityCurrent(save: GameSave, itemId: ItemId): number {
  const max = durabilityMax(itemId);
  if (max <= 0) return 0;
  const current = save.player.itemDurability[itemId];
  return typeof current === 'number' ? Math.max(0, Math.min(max, current)) : max;
}

export function durabilityRatio(save: GameSave, itemId: ItemId): number {
  const max = durabilityMax(itemId);
  return max > 0 ? durabilityCurrent(save, itemId) / max : 0;
}

export function damageDurability(save: GameSave, itemId: ItemId, amount: number): DurabilityResult | undefined {
  const max = durabilityMax(itemId);
  if (max <= 0 || itemId === 'unarmed') return undefined;
  const current = Math.max(0, durabilityCurrent(save, itemId) - amount);
  save.player.itemDurability[itemId] = current;
  if (current > 0) return { itemId, current, max, broke: false };

  removeOneToolOrWeapon(save, itemId);
  if (availableCopies(save, itemId) > 0) save.player.itemDurability[itemId] = max;
  else delete save.player.itemDurability[itemId];
  if (save.player.equipped === itemId && availableCopies(save, itemId) <= 0) save.player.equipped = 'unarmed';
  return { itemId, current: 0, max, broke: true };
}

export function repairDurability(save: GameSave, itemId: ItemId): boolean {
  const max = durabilityMax(itemId);
  if (max <= 0 || availableCopies(save, itemId) <= 0) return false;
  save.player.itemDurability[itemId] = max;
  return true;
}

function removeOneToolOrWeapon(save: GameSave, itemId: ItemId): void {
  if (hasItems(save.player.inventory, { [itemId]: 1 })) {
    removeItems(save.player.inventory, { [itemId]: 1 });
    return;
  }
  if (hasItems(save.player.storage, { [itemId]: 1 })) removeItems(save.player.storage, { [itemId]: 1 });
}

function availableCopies(save: GameSave, itemId: ItemId): number {
  return (save.player.inventory[itemId] ?? 0) + (save.player.storage[itemId] ?? 0);
}
