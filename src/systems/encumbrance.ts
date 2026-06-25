import { ITEMS } from '../data/items';
import type { GameSave, Inventory, ItemId } from '../types';

export interface EncumbranceSnapshot {
  carried: number;
  capacity: number;
  ratio: number;
  label: 'Light' | 'Loaded' | 'Encumbered' | 'Overloaded';
  movementMultiplier: number;
  dodgeMultiplier: number;
  dangerMultiplier: number;
  line: string;
}

export function inventoryWeight(inventory: Inventory): number {
  return (Object.entries(inventory) as [ItemId, number][])
    .reduce((sum, [itemId, count]) => sum + (ITEMS[itemId]?.weight ?? 0) * Math.max(0, count ?? 0), 0);
}

export function carryCapacity(save: GameSave): number {
  const { strength, constitution } = save.player.attributes;
  return 34 + strength * 3 + constitution * 2;
}

export function carriedWeight(save: GameSave): number {
  return inventoryWeight(save.player.inventory) + inventoryWeight(save.player.unsecured);
}

export function encumbrance(save: GameSave): EncumbranceSnapshot {
  const carried = round1(carriedWeight(save));
  const capacity = round1(carryCapacity(save));
  const ratio = capacity > 0 ? carried / capacity : 1;
  const label = ratio >= 1.15 ? 'Overloaded' : ratio >= 0.9 ? 'Encumbered' : ratio >= 0.65 ? 'Loaded' : 'Light';
  const movementMultiplier = label === 'Overloaded' ? 0.68 : label === 'Encumbered' ? 0.82 : label === 'Loaded' ? 0.94 : 1;
  const dodgeMultiplier = label === 'Overloaded' ? 0.58 : label === 'Encumbered' ? 0.74 : label === 'Loaded' ? 0.9 : 1;
  const dangerMultiplier = label === 'Overloaded' ? 1.22 : label === 'Encumbered' ? 1.12 : label === 'Loaded' ? 1.04 : 1;

  return {
    carried,
    capacity,
    ratio,
    label,
    movementMultiplier,
    dodgeMultiplier,
    dangerMultiplier,
    line: `Carry: ${carried}/${capacity} ${label}`
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
