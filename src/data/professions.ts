import type { AttributeSet, Inventory, ProfessionId, RecipeId, SkillId } from '../types';

export interface ProfessionDef {
  id: ProfessionId;
  name: string;
  emblem: string;
  favored: (keyof AttributeSet)[];
  affinities: string[];
  skills: SkillId[];
  items: Inventory;
  recipes: RecipeId[];
  fixedTrait: string;
  traitPool: string[];
  drawback: string;
}

export const PROFESSIONS: ProfessionDef[] = [
  { id: 'miner', name: 'Miner', emblem: 'Ore', favored: ['strength', 'constitution', 'intelligence'], affinities: ['earth', 'metal'], skills: ['gathering'], items: { stonePickaxe: 1, ore: 2 }, recipes: ['ironSword'], fixedTrait: 'Stone Sense', traitPool: ['Calloused Hands', 'Pack Mule'], drawback: 'Dust-Worn Lungs' },
  { id: 'lumberjack', name: 'Lumberjack', emblem: 'Axe', favored: ['strength', 'constitution', 'agility'], affinities: ['wood', 'wind'], skills: ['gathering'], items: { woodenAxe: 1, log: 3 }, recipes: ['barricade'], fixedTrait: 'Clean Cut', traitPool: ['Axe Rhythm', 'Resin Collector'], drawback: 'Heavy Step' },
  { id: 'herbalist', name: 'Herbalist', emblem: 'Leaf', favored: ['intelligence', 'spirit', 'luck'], affinities: ['wood', 'water'], skills: ['gathering'], items: { herb: 4 }, recipes: ['medicine'], fixedTrait: 'Herb Eye', traitPool: ['Gentle Hands', 'Toxicology'], drawback: 'Frail Frame' },
  { id: 'farmer', name: 'Farmer', emblem: 'Seed', favored: ['constitution', 'strength', 'luck'], affinities: ['wood', 'earth'], skills: ['gathering'], items: { log: 2, herb: 2 }, recipes: ['repairKit'], fixedTrait: 'Green Thumb', traitPool: ['Seed Saver', 'Hearty Meals'], drawback: 'Untrained Fighter' },
  { id: 'hunter', name: 'Hunter', emblem: 'Fang', favored: ['agility', 'intelligence', 'luck'], affinities: ['wind', 'metal'], skills: ['sword'], items: { meat: 3, rustedSword: 1 }, recipes: ['medicine'], fixedTrait: 'Track Prey', traitPool: ['First Shot', 'Clean Kill'], drawback: 'Field Habit' },
  { id: 'trapper', name: 'Trapper', emblem: 'Snare', favored: ['intelligence', 'agility', 'luck'], affinities: ['earth', 'wood'], skills: ['crafting'], items: { stone: 3, resin: 2 }, recipes: ['spikeTrap'], fixedTrait: 'Efficient Mechanisms', traitPool: ['Patient Ambush', 'Salvager'], drawback: 'Weak Duelist' },
  { id: 'runner', name: 'Mountain Courier', emblem: 'Wind', favored: ['agility', 'constitution', 'luck'], affinities: ['wind'], skills: ['gathering'], items: { meat: 1, herb: 2 }, recipes: ['repairKit'], fixedTrait: 'Mountain Legs', traitPool: ['Quick Extraction', 'Sure Footing'], drawback: 'Light Load' },
  { id: 'alchemist', name: 'Alchemist Apprentice', emblem: 'Furnace', favored: ['intelligence', 'spirit', 'luck'], affinities: ['fire', 'wood'], skills: ['crafting'], items: { herb: 3, resin: 1 }, recipes: ['medicine'], fixedTrait: 'Furnace Familiarity', traitPool: ['Material Saver', 'Stable Flame'], drawback: 'Smoke-Weakened' },
  { id: 'blacksmith', name: 'Blacksmith Apprentice', emblem: 'Hammer', favored: ['strength', 'intelligence', 'constitution'], affinities: ['metal', 'fire'], skills: ['crafting'], items: { ore: 3, stone: 2 }, recipes: ['ironSword'], fixedTrait: 'Tempered Craft', traitPool: ['Field Repair', 'Heat Endurance'], drawback: 'Slow Footwork' },
  { id: 'scribe', name: 'Talisman Scribe', emblem: 'Seal', favored: ['intelligence', 'spirit', 'luck'], affinities: ['light', 'fire'], skills: ['crafting'], items: { spiritPaper: 4, resin: 1 }, recipes: ['fireTalismanTrap'], fixedTrait: 'Steady Brush', traitPool: ['Ink Saver', 'Quick Seal'], drawback: 'Weak Grip' }
];
