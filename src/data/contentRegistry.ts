import { ENEMIES, SIEGE_WAVES } from './enemies';
import { EXPEDITIONS } from './expeditions';
import { itemIconKey } from './itemIcons';
import { ITEMS } from './items';
import { PROFESSIONS } from './professions';
import { RECIPES } from './recipes';
import type { DeviceId, EnemyId, ItemId, RecipeId } from '../types';

export interface ContentValidationResult {
  valid: boolean;
  errors: string[];
}

const DEVICE_IDS: DeviceId[] = ['workbench', 'cookingFire', 'furnace', 'alchemyFurnace', 'talismanTable'];

export function validateContentRegistry(): ContentValidationResult {
  const errors: string[] = [];
  const itemIds = new Set(Object.keys(ITEMS));
  const recipeIds = new Set(Object.keys(RECIPES));
  const enemyIds = new Set(Object.keys(ENEMIES));

  for (const item of Object.values(ITEMS)) {
    if (item.id !== item.id.trim()) errors.push(`Item has invalid id whitespace: ${item.id}`);
    if ((item.toolRole || item.toolTier || item.gatherSpeedMultiplier) && item.kind !== 'tool') {
      errors.push(`Item ${item.id} has tool metadata but is not kind=tool`);
    }
    if (item.id !== 'unarmed' && !itemIconKey(item.id)) {
      errors.push(`Item ${item.id} has no icon texture mapping`);
    }
  }

  for (const recipe of Object.values(RECIPES)) {
    if (!DEVICE_IDS.includes(recipe.device)) errors.push(`Recipe ${recipe.id} uses unknown device ${recipe.device}`);
    validateInventoryIds(`Recipe ${recipe.id} input`, recipe.inputs, itemIds, errors);
    validateInventoryIds(`Recipe ${recipe.id} output`, recipe.outputs, itemIds, errors);
  }

  for (const profession of PROFESSIONS) {
    validateInventoryIds(`Profession ${profession.id} items`, profession.items, itemIds, errors);
    for (const recipe of profession.recipes) {
      if (!recipeIds.has(recipe)) errors.push(`Profession ${profession.id} unlocks unknown recipe ${recipe}`);
    }
  }

  for (const enemy of Object.values(ENEMIES)) {
    validateInventoryIds(`Enemy ${enemy.id} loot`, enemy.loot, itemIds, errors);
  }

  SIEGE_WAVES.flat().forEach((enemyId: EnemyId) => {
    if (!enemyIds.has(enemyId)) errors.push(`Siege wave references unknown enemy ${enemyId}`);
  });

  for (const route of Object.values(EXPEDITIONS)) {
    let previousThreshold = 0;
    for (const enemy of route.enemies) {
      if (!enemyIds.has(enemy.id)) errors.push(`Expedition ${route.id} references unknown enemy ${enemy.id}`);
    }
    for (const reinforcement of route.danger.reinforcements) {
      if (!enemyIds.has(reinforcement.enemy)) errors.push(`Expedition ${route.id} reinforcement references unknown enemy ${reinforcement.enemy}`);
      if (reinforcement.threshold <= previousThreshold || reinforcement.threshold > 100) {
        errors.push(`Expedition ${route.id} has invalid reinforcement threshold ${reinforcement.threshold}`);
      }
      previousThreshold = reinforcement.threshold;
    }
  }

  for (const requiredRecipe of ['medicine', 'grilledMeat', 'herbSteak', 'ironSword', 'ironAxe', 'ironPickaxe', 'barricade', 'spikeTrap', 'fireTalismanTrap', 'repairKit'] satisfies RecipeId[]) {
    if (!recipeIds.has(requiredRecipe)) errors.push(`Missing required prototype recipe ${requiredRecipe}`);
  }

  return { valid: errors.length === 0, errors };
}

function validateInventoryIds(label: string, inventory: Partial<Record<ItemId, number>>, itemIds: Set<string>, errors: string[]): void {
  for (const [itemId, count] of Object.entries(inventory)) {
    if (!itemIds.has(itemId)) errors.push(`${label} references unknown item ${itemId}`);
    if (typeof count !== 'number' || count <= 0) errors.push(`${label} has invalid count for ${itemId}`);
  }
}
