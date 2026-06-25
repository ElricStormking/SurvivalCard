import type { ExpeditionRouteId, GameSave, Inventory } from '../types';
import { addItems, inventoryText, loseHalf } from './inventory';

const LOST_LOOT_MIN_X = 120;
const LOST_LOOT_MAX_X = 1800;
const LOST_LOOT_MIN_Y = 140;
const LOST_LOOT_MAX_Y = 1240;

export function createLostLootFromDefeat(save: GameSave, route: ExpeditionRouteId, x: number, y: number): Inventory {
  const lost = loseHalf(save.player.unsecured);
  if (!hasInventoryItems(lost)) return lost;

  save.world.lostLoot = {
    route,
    items: lost,
    x: clamp(x, LOST_LOOT_MIN_X, LOST_LOOT_MAX_X),
    y: clamp(y, LOST_LOOT_MIN_Y, LOST_LOOT_MAX_Y),
    day: save.world.day
  };

  return lost;
}

export function recoverLostLoot(save: GameSave): Inventory {
  const lost = save.world.lostLoot;
  if (!lost || !hasInventoryItems(lost.items)) {
    save.world.lostLoot = null;
    return {};
  }

  const recovered = { ...lost.items };
  addItems(save.player.inventory, recovered);
  save.world.lostLoot = null;
  return recovered;
}

export function lostLootText(save: GameSave): string {
  const lost = save.world.lostLoot;
  if (!lost || !hasInventoryItems(lost.items)) return 'No lost expedition pack.';
  return `Lost pack: ${inventoryText(lost.items)} in ${lost.route} from Day ${lost.day}`;
}

export function hasInventoryItems(items: Inventory): boolean {
  return Object.values(items).some((count) => (count ?? 0) > 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
