import type { Inventory, ItemId } from '../types';

export function addItems(target: Inventory, items: Inventory, multiplier = 1): Inventory {
  for (const [id, count] of Object.entries(items) as [ItemId, number][]) {
    target[id] = (target[id] ?? 0) + count * multiplier;
  }
  return target;
}

export function hasItems(target: Inventory, items: Inventory): boolean {
  return (Object.entries(items) as [ItemId, number][]).every(([id, count]) => (target[id] ?? 0) >= count);
}

export function removeItems(target: Inventory, items: Inventory): boolean {
  if (!hasItems(target, items)) return false;
  for (const [id, count] of Object.entries(items) as [ItemId, number][]) {
    target[id] = (target[id] ?? 0) - count;
    if ((target[id] ?? 0) <= 0) delete target[id];
  }
  return true;
}

export function inventoryText(inv: Inventory): string {
  const entries = Object.entries(inv).filter(([, count]) => Number(count) > 0);
  return entries.length ? entries.map(([id, count]) => `${id} x${count}`).join(', ') : 'empty';
}

export function loseHalf(inv: Inventory): Inventory {
  const lost: Inventory = {};
  for (const [id, count] of Object.entries(inv) as [ItemId, number][]) {
    const amount = Math.floor(count / 2);
    if (amount > 0) {
      lost[id] = amount;
      inv[id] = count - amount;
    }
  }
  return lost;
}
