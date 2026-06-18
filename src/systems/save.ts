import type { AttributeProgress, AttributeSet, DeviceId, GameSave, ItemId, PlayerState, PrototypeAffinities, RecipeId, WorldState } from '../types';
import { TUNING } from '../data/tuning';
import { PROFESSIONS } from '../data/professions';
import { createBackgroundRolls } from './professionRolls';

const SAVE_KEY = 'mountain-hermit-save-v1';
const CURRENT_SAVE_VERSION = 2;
const SHARED_RECIPE_UNLOCKS: RecipeId[] = ['medicine', 'grilledMeat', 'herbSteak', 'ironAxe', 'ironPickaxe'];
const DEFAULT_HOTBAR: (ItemId | null)[] = ['rustedSword', 'woodenAxe', 'stonePickaxe', 'medicine', 'grilledMeat', 'herbSteak', 'repairKit', 'unarmed'];

const DEFAULT_ATTRIBUTES: AttributeSet = {
  strength: 1,
  constitution: 1,
  agility: 1,
  intelligence: 1,
  spirit: 1,
  luck: 1
};

const DEFAULT_ATTRIBUTE_PROGRESS: AttributeProgress = {
  strength: 0,
  constitution: 0,
  agility: 0,
  intelligence: 0,
  spirit: 0,
  luck: 0
};

const DEFAULT_AFFINITIES: PrototypeAffinities = {
  metal: 0,
  wood: 0,
  fire: 0,
  light: 0
};

const DEFAULT_OBJECTIVES: WorldState['objectives'] = {
  visitedForest: false,
  gatheredResource: false,
  extractedLoot: false,
  queuedProduction: false,
  craftedMedicine: false,
  craftedIronSword: false,
  placedDefense: false,
  startedSiege: false,
  wonSiege: false
};

export function createNewSave(name = 'Nameless Hermit', professionIndex = 0, rollIndex = 0, seed = Date.now()): GameSave {
  const profession = PROFESSIONS[professionIndex] ?? PROFESSIONS[0];
  const background = createBackgroundRolls(profession, seed)[rollIndex] ?? createBackgroundRolls(profession, seed)[0];
  const player: PlayerState = {
    name,
    profession: profession.id,
    background,
    hp: profession.id === 'herbalist' ? 82 : 100,
    regenerate: TUNING.survival.baseRegenerationPerSecond,
    energy: profession.id === 'alchemist' ? 82 : 100,
    hunger: 100,
    spirit: 45,
    x: 640,
    y: 380,
    attributes: mergeAttributes(DEFAULT_ATTRIBUTES, background.attributes),
    attributeProgress: { ...DEFAULT_ATTRIBUTE_PROGRESS },
    affinities: {
      metal: background.affinities.metal ?? 0,
      wood: background.affinities.wood ?? 0,
      fire: background.affinities.fire ?? 0,
      light: background.affinities.light ?? 0
    },
    equipped: background.items.ironSword ? 'ironSword' : 'rustedSword',
    hotbar: normalizeHotbar([background.items.ironSword ? 'ironSword' : 'rustedSword', 'woodenAxe', 'stonePickaxe', 'medicine', 'grilledMeat', 'herbSteak', 'repairKit', 'unarmed']),
    inventory: { ...background.items, herb: (background.items.herb ?? 0) + 2, meat: (background.items.meat ?? 0) + 1 },
    unsecured: {},
    storage: { log: 3, stone: 2, herb: 2, resin: 1 },
    unlockedRecipes: uniqueRecipes([...SHARED_RECIPE_UNLOCKS, ...background.recipes]),
    skills: {
      sword: { xp: 0, level: background.skillFamiliarity.sword ?? 1, unlocked: true },
      gathering: { xp: 0, level: background.skillFamiliarity.gathering ?? 1, unlocked: true },
      crafting: { xp: 0, level: background.skillFamiliarity.crafting ?? 1, unlocked: true },
      swordQiSlash: { xp: 0, level: 1, unlocked: false }
    },
    skillPoints: 1,
    passives: {
      orbitingSword: true,
      minorFlameAura: true
    },
    buffs: {
      regenerationMultiplier: 1,
      regenerationFlat: 0
    },
    spiritDog: {
      unlocked: true,
      command: 'follow',
      hp: 80,
      regenerate: TUNING.survival.basePetRegenerationPerSecond,
      buffs: {
        regenerationMultiplier: 1,
        regenerationFlat: 0
      }
    }
  };

  const emptyDevices: WorldState['devices'] = {
    workbench: [],
    cookingFire: [],
    furnace: [],
    alchemyFurnace: [],
    talismanTable: []
  };
  const emptyDeviceOutputs: WorldState['deviceOutputs'] = {
    workbench: {},
    cookingFire: {},
    furnace: {},
    alchemyFurnace: {},
    talismanTable: {}
  };

  return {
    version: CURRENT_SAVE_VERSION,
    seed,
    player,
    world: {
      day: 1,
      minutes: 6 * 60,
      timeScale: 6,
      scene: 'farm',
      formationCoreHp: 150,
      devices: emptyDevices,
      deviceOutputs: emptyDeviceOutputs,
      defenses: { barricade: 0, spikeTrap: 0, fireTalismanTrap: 0 },
      siegeWon: false,
      objectives: { ...DEFAULT_OBJECTIVES }
    }
  };
}

export function saveGame(save: GameSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function loadGame(): GameSave | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GameSave> & { version?: number };
    if (parsed.version === CURRENT_SAVE_VERSION) return hydrateSave(parsed as GameSave);
    if (parsed.version === 1) {
      const migrated = migrateV1ToV2(parsed);
      saveGame(migrated);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function ensureSaveShape(save: GameSave): GameSave {
  return hydrateSave(save);
}

function hydrateSave(save: GameSave): GameSave {
  save.version = CURRENT_SAVE_VERSION;
  save.player.attributes = mergeAttributes(DEFAULT_ATTRIBUTES, save.player.attributes ?? save.player.background?.attributes ?? {});
  save.player.attributeProgress = { ...DEFAULT_ATTRIBUTE_PROGRESS, ...(save.player.attributeProgress ?? {}) };
  save.player.affinities = { ...DEFAULT_AFFINITIES, ...(save.player.affinities ?? {}) };
  save.player.regenerate = save.player.regenerate ?? TUNING.survival.baseRegenerationPerSecond;
  save.player.hotbar = normalizeHotbar(save.player.hotbar);
  save.player.unlockedRecipes = uniqueRecipes([...SHARED_RECIPE_UNLOCKS, ...(save.player.unlockedRecipes ?? [])]);
  save.player.passives = {
    orbitingSword: save.player.passives?.orbitingSword ?? true,
    minorFlameAura: save.player.passives?.minorFlameAura ?? true
  };
  save.player.buffs = {
    regenerationMultiplier: save.player.buffs?.regenerationMultiplier ?? 1,
    regenerationFlat: save.player.buffs?.regenerationFlat ?? 0
  };
  save.player.spiritDog = {
    unlocked: save.player.spiritDog?.unlocked ?? true,
    command: save.player.spiritDog?.command ?? 'follow',
    hp: save.player.spiritDog?.hp ?? 80,
    regenerate: save.player.spiritDog?.regenerate ?? TUNING.survival.basePetRegenerationPerSecond,
    buffs: {
      regenerationMultiplier: save.player.spiritDog?.buffs?.regenerationMultiplier ?? 1,
      regenerationFlat: save.player.spiritDog?.buffs?.regenerationFlat ?? 0
    }
  };
  save.world.deviceOutputs = hydrateDeviceOutputs(save.world.deviceOutputs);
  save.world.objectives = { ...DEFAULT_OBJECTIVES, ...(save.world.objectives ?? {}) };
  return save;
}

function migrateV1ToV2(save: Partial<GameSave>): GameSave {
  const fallback = createNewSave();
  const migrated = save as GameSave;
  migrated.version = CURRENT_SAVE_VERSION;
  migrated.player = { ...fallback.player, ...(save.player ?? {}) };
  migrated.world = { ...fallback.world, ...(save.world ?? {}) };
  return hydrateSave(migrated);
}

function mergeAttributes(base: AttributeSet, bonus: Partial<AttributeSet>): AttributeSet {
  return {
    strength: base.strength + (bonus.strength ?? 0),
    constitution: base.constitution + (bonus.constitution ?? 0),
    agility: base.agility + (bonus.agility ?? 0),
    intelligence: base.intelligence + (bonus.intelligence ?? 0),
    spirit: base.spirit + (bonus.spirit ?? 0),
    luck: base.luck + (bonus.luck ?? 0)
  };
}

function uniqueRecipes(recipes: RecipeId[]): RecipeId[] {
  return Array.from(new Set(recipes));
}

function hydrateDeviceOutputs(outputs: Partial<WorldState['deviceOutputs']> | undefined): WorldState['deviceOutputs'] {
  return {
    workbench: { ...(outputs?.workbench ?? {}) },
    cookingFire: { ...(outputs?.cookingFire ?? {}) },
    furnace: { ...(outputs?.furnace ?? {}) },
    alchemyFurnace: { ...(outputs?.alchemyFurnace ?? {}) },
    talismanTable: { ...(outputs?.talismanTable ?? {}) }
  };
}

function normalizeHotbar(hotbar: unknown): (ItemId | null)[] {
  const slots = Array.isArray(hotbar) ? hotbar : [];
  return Array.from({ length: 8 }, (_, index) => {
    const item = slots[index] ?? DEFAULT_HOTBAR[index] ?? null;
    return typeof item === 'string' ? item as ItemId : null;
  });
}
