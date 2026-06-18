import type { ItemId } from '../types';

export const ITEM_ICON_KEYS: Partial<Record<ItemId, string>> = {
  log: 'iconLog',
  stone: 'iconIronOre',
  ore: 'iconIronOre',
  herb: 'iconHerb',
  meat: 'iconRawMeat',
  grilledMeat: 'iconGrilledMeat',
  herbSteak: 'iconSteak',
  spiritPaper: 'iconResin',
  resin: 'iconResin',
  woodenAxe: 'iconAxe',
  ironAxe: 'iconAxe',
  stonePickaxe: 'iconPickaxe',
  ironPickaxe: 'iconPickaxe',
  rustedSword: 'iconSword',
  ironSword: 'iconSword',
  medicine: 'iconHerb',
  barricade: 'iconLog',
  spikeTrap: 'iconPickaxe',
  fireTalismanTrap: 'iconResin',
  repairKit: 'iconAxe'
};

export function itemIconKey(itemId: ItemId): string | undefined {
  return ITEM_ICON_KEYS[itemId];
}
