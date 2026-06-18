import type { EnemyId, Inventory } from '../types';

export interface EnemyDef {
  id: EnemyId;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  color: number;
  textureKey?: string;
  loot: Inventory;
}

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  boar: { id: 'boar', name: 'Wild Boar', hp: 28, speed: 52, damage: 8, color: 0x7f5a35, textureKey: 'enemyBoar', loot: { meat: 1, resin: 1 } },
  wolf: { id: 'wolf', name: 'Demon Wolf', hp: 36, speed: 72, damage: 10, color: 0x55616b, textureKey: 'enemyWolf', loot: { meat: 1, spiritPaper: 1 } },
  ghost: { id: 'ghost', name: 'Wandering Ghost', hp: 24, speed: 44, damage: 9, color: 0x9dc8d8, textureKey: 'enemyGhost', loot: { spiritPaper: 1, herb: 1 } },
  corpse: { id: 'corpse', name: 'Siege Corpse', hp: 42, speed: 36, damage: 12, color: 0x6b7152, textureKey: 'enemyGhost', loot: { stone: 1, spiritPaper: 1 } },
  captain: { id: 'captain', name: 'Ghost Captain', hp: 130, speed: 42, damage: 18, color: 0xd8d0a2, textureKey: 'enemyGhost', loot: { spiritPaper: 3, ore: 2 } }
};

export const SIEGE_WAVES: EnemyId[][] = [
  ['ghost', 'ghost', 'ghost'],
  ['wolf', 'wolf', 'corpse', 'corpse'],
  ['captain', 'ghost', 'corpse']
];
