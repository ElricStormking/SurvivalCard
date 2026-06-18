import type { DeviceId, GameSave, Inventory, RecipeId } from '../types';
import { RECIPES } from '../data/recipes';
import { addItems, hasItems, removeItems } from './inventory';
import { grantSkillXp } from './progression';

export function startRecipe(save: GameSave, recipeId: RecipeId): boolean {
  const recipe = RECIPES[recipeId];
  const queue = save.world.devices[recipe.device];
  if (queue.length >= 3 || !save.player.unlockedRecipes.includes(recipeId)) return false;
  const source = { ...save.player.inventory };
  addItems(source, save.player.storage);
  if (!hasItems(source, recipe.inputs)) return false;

  if (!removeItems(save.player.inventory, recipe.inputs)) {
    const remainder = { ...recipe.inputs };
    for (const [id, count] of Object.entries(recipe.inputs)) {
      const available = Math.min(save.player.inventory[id as keyof typeof save.player.inventory] ?? 0, count);
      if (available > 0) removeItems(save.player.inventory, { [id]: available });
      remainder[id as keyof typeof remainder] = count - available;
      if ((remainder[id as keyof typeof remainder] ?? 0) <= 0) delete remainder[id as keyof typeof remainder];
    }
    removeItems(save.player.storage, remainder);
  }

  queue.push({ recipeId, remaining: recipe.seconds, total: recipe.seconds });
  save.world.objectives.queuedProduction = true;
  grantSkillXp(save, 'crafting', 8);
  return true;
}

export function tickProduction(save: GameSave, deltaSeconds: number): void {
  for (const deviceId of Object.keys(save.world.devices) as DeviceId[]) {
    const queue = save.world.devices[deviceId];
    const current = queue[0];
    if (!current) continue;
    current.remaining -= deltaSeconds;
    if (current.remaining <= 0) {
      const recipe = RECIPES[current.recipeId];
      addItems(save.world.deviceOutputs[deviceId], recipe.outputs);
      if (current.recipeId === 'medicine') save.world.objectives.craftedMedicine = true;
      if (current.recipeId === 'ironSword') save.world.objectives.craftedIronSword = true;
      queue.shift();
    }
  }
}

export function collectDeviceOutputs(save: GameSave, deviceId: DeviceId): Inventory {
  const outputs = save.world.deviceOutputs[deviceId];
  const collected = { ...outputs };
  addItems(save.player.inventory, outputs);
  save.world.deviceOutputs[deviceId] = {};
  return collected;
}
