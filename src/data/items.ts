import type { ItemId } from '../types';

export interface ItemDef {
  id: ItemId;
  name: string;
  kind: 'resource' | 'tool' | 'weapon' | 'consumable' | 'defense';
  weight: number;
  description: string;
  toolRole?: 'axe' | 'pickaxe';
  toolTier?: number;
  gatherSpeedMultiplier?: number;
  hungerRestore?: number;
  healthRestore?: number;
  coreRepair?: number;
  durabilityMax?: number;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  unarmed: { id: 'unarmed', name: 'Unarmed', kind: 'weapon', weight: 0, description: 'A body-checking melee attack with no held weapon.' },
  log: { id: 'log', name: 'Pine Log', kind: 'resource', weight: 2, description: 'Rough timber for repairs and barricades.' },
  stone: { id: 'stone', name: 'Mountain Stone', kind: 'resource', weight: 2, description: 'Useful for traps and crude tools.' },
  ore: { id: 'ore', name: 'Iron Ore', kind: 'resource', weight: 3, description: 'Needs furnace time before it becomes useful metalwork.' },
  herb: { id: 'herb', name: 'Bitterleaf Herb', kind: 'resource', weight: 1, description: 'A common medicinal herb.' },
  meat: { id: 'meat', name: 'Lean Meat', kind: 'resource', weight: 1, description: 'Food from hunted beasts.' },
  grilledMeat: { id: 'grilledMeat', name: 'Grilled Meat', kind: 'consumable', weight: 1, description: 'Simple cooked meat. Restores 15 Hunger.', hungerRestore: 15 },
  herbSteak: { id: 'herbSteak', name: 'Herb Steak', kind: 'consumable', weight: 1, description: 'Hearty meat cooked with mountain herbs. Restores 70 Hunger.', hungerRestore: 70 },
  spiritPaper: { id: 'spiritPaper', name: 'Spirit Paper', kind: 'resource', weight: 1, description: 'Conductive paper for talismans.' },
  resin: { id: 'resin', name: 'Pine Resin', kind: 'resource', weight: 1, description: 'Sticky fuel and binding agent.' },
  woodenAxe: { id: 'woodenAxe', name: 'Wooden Axe', kind: 'tool', weight: 4, description: 'Chops trees and hits slowly.', toolRole: 'axe', toolTier: 1, gatherSpeedMultiplier: 0.9, durabilityMax: 36 },
  ironAxe: { id: 'ironAxe', name: 'Iron Axe', kind: 'tool', weight: 5, description: 'A sharper axe that shortens lumbering time.', toolRole: 'axe', toolTier: 2, gatherSpeedMultiplier: 0.68, durabilityMax: 74 },
  stonePickaxe: { id: 'stonePickaxe', name: 'Stone Pickaxe', kind: 'tool', weight: 5, description: 'Mines ore and stone.', toolRole: 'pickaxe', toolTier: 1, gatherSpeedMultiplier: 0.9, durabilityMax: 42 },
  ironPickaxe: { id: 'ironPickaxe', name: 'Iron Pickaxe', kind: 'tool', weight: 6, description: 'A stronger pickaxe that bites through ore faster.', toolRole: 'pickaxe', toolTier: 2, gatherSpeedMultiplier: 0.68, durabilityMax: 82 },
  rustedSword: { id: 'rustedSword', name: 'Rusted Sword', kind: 'weapon', weight: 3, description: 'A poor blade with honest reach.', durabilityMax: 54 },
  ironSword: { id: 'ironSword', name: 'Iron Sword', kind: 'weapon', weight: 4, description: 'Reliable enough to channel Sword Qi.', durabilityMax: 96 },
  medicine: { id: 'medicine', name: 'Wound Medicine', kind: 'consumable', weight: 1, description: 'Restores 35 HP during preparation.', healthRestore: 35 },
  barricade: { id: 'barricade', name: 'Wooden Barricade', kind: 'defense', weight: 6, description: 'Absorbs siege pressure.' },
  spikeTrap: { id: 'spikeTrap', name: 'Spike Trap', kind: 'defense', weight: 5, description: 'Damages the first enemy wave that crosses it.' },
  fireTalismanTrap: { id: 'fireTalismanTrap', name: 'Fire Talisman Trap', kind: 'defense', weight: 2, description: 'Burns ghosts and siege corpses.' },
  repairKit: { id: 'repairKit', name: 'Repair Kit', kind: 'consumable', weight: 2, description: 'Repairs 35 Formation Core HP before the siege.', coreRepair: 35 }
};
