import type { DeviceId, Inventory, RecipeId } from '../types';

export interface RecipeDef {
  id: RecipeId;
  name: string;
  device: DeviceId;
  seconds: number;
  inputs: Inventory;
  outputs: Inventory;
}

export const RECIPES: Record<RecipeId, RecipeDef> = {
  medicine: { id: 'medicine', name: 'Wound Medicine', device: 'alchemyFurnace', seconds: 18, inputs: { herb: 2, resin: 1 }, outputs: { medicine: 1 } },
  grilledMeat: { id: 'grilledMeat', name: 'Grilled Meat', device: 'cookingFire', seconds: 10, inputs: { meat: 1 }, outputs: { grilledMeat: 1 } },
  herbSteak: { id: 'herbSteak', name: 'Herb Steak', device: 'cookingFire', seconds: 16, inputs: { meat: 2, herb: 1 }, outputs: { herbSteak: 1 } },
  ironSword: { id: 'ironSword', name: 'Iron Sword', device: 'furnace', seconds: 26, inputs: { ore: 3, log: 1 }, outputs: { ironSword: 1 } },
  ironAxe: { id: 'ironAxe', name: 'Iron Axe', device: 'furnace', seconds: 24, inputs: { ore: 2, log: 2 }, outputs: { ironAxe: 1 } },
  ironPickaxe: { id: 'ironPickaxe', name: 'Iron Pickaxe', device: 'furnace', seconds: 28, inputs: { ore: 3, log: 2 }, outputs: { ironPickaxe: 1 } },
  barricade: { id: 'barricade', name: 'Wooden Barricade', device: 'workbench', seconds: 16, inputs: { log: 3, stone: 1 }, outputs: { barricade: 1 } },
  spikeTrap: { id: 'spikeTrap', name: 'Spike Trap', device: 'workbench', seconds: 18, inputs: { log: 2, stone: 2 }, outputs: { spikeTrap: 1 } },
  fireTalismanTrap: { id: 'fireTalismanTrap', name: 'Fire Talisman Trap', device: 'talismanTable', seconds: 20, inputs: { spiritPaper: 2, resin: 1, herb: 1 }, outputs: { fireTalismanTrap: 1 } },
  repairKit: { id: 'repairKit', name: 'Repair Kit', device: 'workbench', seconds: 14, inputs: { log: 1, stone: 1, resin: 1 }, outputs: { repairKit: 1 } }
};

export const DEVICE_NAMES: Record<DeviceId, string> = {
  workbench: 'Workbench',
  cookingFire: 'Cooking Fire',
  furnace: 'Damaged Furnace',
  alchemyFurnace: 'Alchemy Furnace',
  talismanTable: 'Talisman Table'
};
