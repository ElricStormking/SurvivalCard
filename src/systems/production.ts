import type { DeviceId, GameSave, Inventory, ItemId, RecipeId } from '../types';
import { RECIPES } from '../data/recipes';
import { TUNING } from '../data/tuning';
import { addItems, hasItems, removeItems } from './inventory';
import { grantSkillXp } from './progression';
import { consumeDeviceFuel, ensureDeviceFuel } from './deviceFuel';
import { applyDeviceWear, deviceWorkMultiplier } from './deviceCondition';

const HANDCRAFTABLE_RECIPES: RecipeId[] = ['repairKit', 'barricade', 'spikeTrap'];
const DEVICE_OUTPUT_CAPACITY: Record<DeviceId, number> = {
  workbench: 4,
  cookingFire: 4,
  furnace: 3,
  alchemyFurnace: 4,
  talismanTable: 3
};

export function startRecipe(save: GameSave, recipeId: RecipeId): boolean {
  const recipe = RECIPES[recipeId];
  const queue = save.world.devices[recipe.device];
  if (queue.length >= 3 || !save.player.unlockedRecipes.includes(recipeId)) return false;
  if (!canProvideRecipeInputs(save, recipe.inputs)) return false;
  if (!ensureDeviceFuel(save, recipe.device)) return false;
  if (!consumeRecipeInputs(save, recipe.inputs)) return false;

  const seconds = productionDurationSeconds(save, recipeId);
  queue.push({ recipeId, remaining: seconds, total: seconds });
  save.world.objectives.queuedProduction = true;
  grantSkillXp(save, 'crafting', 8);
  return true;
}

export function isHandCraftableRecipe(recipeId: RecipeId): boolean {
  return HANDCRAFTABLE_RECIPES.includes(recipeId);
}

export function canHandCraftRecipe(save: GameSave, recipeId: RecipeId): boolean {
  const recipe = RECIPES[recipeId];
  return isHandCraftableRecipe(recipeId)
    && save.player.unlockedRecipes.includes(recipeId)
    && canProvideRecipeInputs(save, recipe.inputs);
}

export function handCraftRecipe(save: GameSave, recipeId: RecipeId): boolean {
  const recipe = RECIPES[recipeId];
  if (!canHandCraftRecipe(save, recipeId)) return false;
  if (!consumeRecipeInputs(save, recipe.inputs)) return false;
  addItems(save.player.inventory, recipe.outputs);
  grantSkillXp(save, 'crafting', 4);
  return true;
}

export function productionDurationSeconds(save: GameSave, recipeId: RecipeId): number {
  const baseSeconds = RECIPES[recipeId].seconds;
  const craftingLevel = save.player.skills.crafting.level;
  const intelligence = save.player.attributes.intelligence;
  const skillReduction = Math.max(0, craftingLevel - 1) * TUNING.production.skillReductionPerLevel;
  const intelligenceReduction = Math.max(0, intelligence - 1) * TUNING.production.intelligenceReductionPerPoint;
  const multiplier = Math.max(TUNING.production.minimumDurationMultiplier, 1 - skillReduction - intelligenceReduction);
  return Math.max(1, Math.round(baseSeconds * multiplier));
}

export function tickProduction(save: GameSave, deltaSeconds: number): void {
  for (const deviceId of Object.keys(save.world.devices) as DeviceId[]) {
    const queue = save.world.devices[deviceId];
    const current = queue[0];
    if (!current) continue;
    const recipe = RECIPES[current.recipeId];
    if (!canAcceptDeviceOutput(save, deviceId, recipe.outputs)) continue;
    const workMultiplier = deviceWorkMultiplier(save, deviceId);
    if (workMultiplier <= 0) continue;
    const workedSeconds = consumeDeviceFuel(save, deviceId, deltaSeconds);
    if (workedSeconds <= 0) continue;
    current.remaining -= workedSeconds * workMultiplier;
    if (current.remaining <= 0) {
      addItems(save.world.deviceOutputs[deviceId], recipe.outputs);
      applyDeviceWear(save, deviceId);
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

export function deviceOutputCapacity(deviceId: DeviceId): number {
  return DEVICE_OUTPUT_CAPACITY[deviceId];
}

export function deviceOutputUsed(save: GameSave, deviceId: DeviceId): number {
  return inventoryCount(save.world.deviceOutputs[deviceId]);
}

export function canAcceptDeviceOutput(save: GameSave, deviceId: DeviceId, output: Inventory): boolean {
  return deviceOutputUsed(save, deviceId) + inventoryCount(output) <= DEVICE_OUTPUT_CAPACITY[deviceId];
}

export function deviceOutputIsFull(save: GameSave, deviceId: DeviceId): boolean {
  return deviceOutputUsed(save, deviceId) >= DEVICE_OUTPUT_CAPACITY[deviceId];
}

function canProvideRecipeInputs(save: GameSave, inputs: Inventory): boolean {
  const source = { ...save.player.inventory };
  addItems(source, save.player.storage);
  return hasItems(source, inputs);
}

function consumeRecipeInputs(save: GameSave, inputs: Inventory): boolean {
  if (!canProvideRecipeInputs(save, inputs)) return false;

  const storageRemainder: Inventory = {};
  for (const [id, count] of Object.entries(inputs) as [ItemId, number][]) {
    const inventoryAvailable = Math.min(save.player.inventory[id] ?? 0, count);
    if (inventoryAvailable > 0) removeItems(save.player.inventory, { [id]: inventoryAvailable });
    const storageNeeded = count - inventoryAvailable;
    if (storageNeeded > 0) storageRemainder[id] = storageNeeded;
  }

  if (Object.values(storageRemainder).some((count) => (count ?? 0) > 0)) {
    return removeItems(save.player.storage, storageRemainder);
  }
  return true;
}

function inventoryCount(inventory: Inventory): number {
  return Object.values(inventory).reduce((sum, count) => sum + (count ?? 0), 0);
}
