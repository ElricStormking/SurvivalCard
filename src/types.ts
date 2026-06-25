export type ItemId =
  | 'unarmed'
  | 'log'
  | 'stone'
  | 'ore'
  | 'herb'
  | 'meat'
  | 'grilledMeat'
  | 'herbSteak'
  | 'spiritPaper'
  | 'resin'
  | 'woodenAxe'
  | 'ironAxe'
  | 'stonePickaxe'
  | 'ironPickaxe'
  | 'rustedSword'
  | 'ironSword'
  | 'medicine'
  | 'barricade'
  | 'spikeTrap'
  | 'fireTalismanTrap'
  | 'repairKit';

export type SkillId = 'sword' | 'gathering' | 'crafting' | 'swordQiSlash';
export type ProfessionId =
  | 'miner'
  | 'lumberjack'
  | 'herbalist'
  | 'farmer'
  | 'hunter'
  | 'trapper'
  | 'runner'
  | 'alchemist'
  | 'blacksmith'
  | 'scribe';

export type DeviceId = 'workbench' | 'cookingFire' | 'furnace' | 'alchemyFurnace' | 'talismanTable';
export type RecipeId = 'medicine' | 'grilledMeat' | 'herbSteak' | 'ironSword' | 'ironAxe' | 'ironPickaxe' | 'barricade' | 'spikeTrap' | 'fireTalismanTrap' | 'repairKit';
export type EnemyId = 'boar' | 'wolf' | 'ghost' | 'corpse' | 'captain';
export type ExpeditionRouteId = 'pineForest' | 'ironRidge';

export type Inventory = Partial<Record<ItemId, number>>;
export type AttributeId = keyof AttributeSet;
export type PrototypeAffinityId = 'metal' | 'wood' | 'fire' | 'light';
export type PrototypeAffinities = Record<PrototypeAffinityId, number>;
export type AttributeProgress = Record<AttributeId, number>;
export type SpiritDogCommand = 'follow' | 'attack' | 'guard' | 'retreat';
export type CultivationRealm = 'Mortal' | 'Qi Gathering';
export type NightEventId = 'wanderingGhost' | 'wildBeast' | 'moonlitHerb' | 'woundedTraveler' | 'thiefScout';
export type ActiveBuffId = 'warmMeal' | 'herbalFortitude' | 'mendingPoultice';

export interface AttributeSet {
  strength: number;
  constitution: number;
  agility: number;
  intelligence: number;
  spirit: number;
  luck: number;
}

export interface BackgroundRoll {
  seed: number;
  attributes: AttributeSet;
  affinities: Partial<Record<'metal' | 'wood' | 'fire' | 'light' | 'earth' | 'wind' | 'water', number>>;
  skillFamiliarity: Partial<Record<SkillId, number>>;
  items: Inventory;
  recipes: RecipeId[];
  positiveTrait: string;
  drawback: string;
}

export interface PlayerState {
  name: string;
  profession: ProfessionId;
  background: BackgroundRoll;
  hp: number;
  regenerate: number;
  energy: number;
  hunger: number;
  spirit: number;
  x: number;
  y: number;
  attributes: AttributeSet;
  attributeProgress: AttributeProgress;
  affinities: PrototypeAffinities;
  equipped: ItemId;
  itemDurability: Partial<Record<ItemId, number>>;
  hotbar: (ItemId | null)[];
  inventory: Inventory;
  unsecured: Inventory;
  storage: Inventory;
  unlockedRecipes: RecipeId[];
  skills: Record<SkillId, { xp: number; level: number; unlocked: boolean }>;
  skillPoints: number;
  cultivation: {
    realm: CultivationRealm;
    insight: number;
    breakthroughs: number;
  };
  passives: {
    orbitingSword: boolean;
    minorFlameAura: boolean;
  };
  buffs: {
    regenerationMultiplier: number;
    regenerationFlat: number;
  };
  activeBuffs: Partial<Record<ActiveBuffId, { remaining: number }>>;
  spiritDog: {
    unlocked: boolean;
    command: SpiritDogCommand;
    hp: number;
    regenerate: number;
    buffs: {
      regenerationMultiplier: number;
      regenerationFlat: number;
    };
  };
}

export interface DeviceQueueEntry {
  recipeId: RecipeId;
  remaining: number;
  total: number;
}

export interface NightEventRecord {
  id: NightEventId;
  day: number;
  title: string;
  summary: string;
  effects: string[];
}

export interface LostLootState {
  route: ExpeditionRouteId;
  items: Inventory;
  x: number;
  y: number;
  day: number;
}

export interface WorldState {
  day: number;
  minutes: number;
  timeScale: number;
  scene: 'farm' | 'forest' | 'siege';
  expeditionRoute: ExpeditionRouteId;
  expeditionStats: Record<ExpeditionRouteId, { visits: number; extractions: number; clears: number }>;
  formationCoreHp: number;
  devices: Record<DeviceId, DeviceQueueEntry[]>;
  deviceFuel: Record<DeviceId, number>;
  deviceCondition: Record<DeviceId, number>;
  deviceOutputs: Record<DeviceId, Inventory>;
  defenses: { barricade: number; spikeTrap: number; fireTalismanTrap: number };
  siegeWon: boolean;
  siegeCyclesSurvived: number;
  lostLoot: LostLootState | null;
  lastNightEventDay: number;
  nightEventLog: NightEventRecord[];
  objectives: {
    visitedForest: boolean;
    gatheredResource: boolean;
    extractedLoot: boolean;
    queuedProduction: boolean;
    craftedMedicine: boolean;
    craftedIronSword: boolean;
    placedDefense: boolean;
    startedSiege: boolean;
    wonSiege: boolean;
  };
  objectiveRewardsClaimed: Partial<Record<keyof WorldState['objectives'], boolean>>;
}

export interface GameSave {
  version: 2;
  seed: number;
  player: PlayerState;
  world: WorldState;
}
