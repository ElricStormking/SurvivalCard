import type { EnemyId, ExpeditionRouteId } from '../types';

export type ResourceNodeKind = 'tree' | 'ore' | 'herb';

export interface ExpeditionNodeSpec {
  kind: ResourceNodeKind;
  x: number;
  y: number;
}

export interface ExpeditionEnemySpec {
  id: EnemyId;
  x: number;
  y: number;
}

export interface ExpeditionRouteDef {
  id: ExpeditionRouteId;
  name: string;
  subtitle: string;
  threat: string;
  tint: number;
  foliageColor: number;
  extractionLabel: string;
  danger: {
    basePerSecond: number;
    gather: number;
    pickup: number;
    reinforcements: { threshold: number; enemy: EnemyId; label: string }[];
  };
  nodes: ExpeditionNodeSpec[];
  enemies: ExpeditionEnemySpec[];
}

export const EXPEDITION_ROUTE_IDS: ExpeditionRouteId[] = ['pineForest', 'ironRidge'];

export const EXPEDITIONS: Record<ExpeditionRouteId, ExpeditionRouteDef> = {
  pineForest: {
    id: 'pineForest',
    name: 'Pine Forest',
    subtitle: 'Balanced wood, herbs, and ore near the farm road.',
    threat: 'Boar, wolf, wandering ghost',
    tint: 0x152116,
    foliageColor: 0x263b22,
    extractionLabel: 'Forest Extraction Path',
    danger: {
      basePerSecond: 0.42,
      gather: 5,
      pickup: 0.8,
      reinforcements: [
        { threshold: 35, enemy: 'boar', label: 'A startled boar crashes through the brush.' },
        { threshold: 70, enemy: 'wolf', label: 'A demon wolf follows the noise.' },
        { threshold: 100, enemy: 'ghost', label: 'Cold mist condenses into a wandering ghost.' }
      ]
    },
    nodes: [
      { kind: 'tree', x: 520, y: 420 },
      { kind: 'tree', x: 720, y: 860 },
      { kind: 'ore', x: 1120, y: 420 },
      { kind: 'ore', x: 1380, y: 910 },
      { kind: 'herb', x: 900, y: 690 },
      { kind: 'herb', x: 1530, y: 650 }
    ],
    enemies: [
      { id: 'boar', x: 820, y: 520 },
      { id: 'wolf', x: 1200, y: 760 },
      { id: 'ghost', x: 1450, y: 520 }
    ]
  },
  ironRidge: {
    id: 'ironRidge',
    name: 'Iron Ridge Quarry',
    subtitle: 'Ore-rich broken cliffs with less food and more hostile spirits.',
    threat: 'Demon wolf, corpse, wandering ghosts',
    tint: 0x171b18,
    foliageColor: 0x303a2a,
    extractionLabel: 'Quarry Descent',
    danger: {
      basePerSecond: 0.62,
      gather: 7,
      pickup: 1.1,
      reinforcements: [
        { threshold: 30, enemy: 'ghost', label: 'A quarry ghost answers the echo.' },
        { threshold: 60, enemy: 'corpse', label: 'A buried corpse pulls itself from the ridge.' },
        { threshold: 90, enemy: 'wolf', label: 'A demon wolf circles the quarry exit.' }
      ]
    },
    nodes: [
      { kind: 'ore', x: 540, y: 410 },
      { kind: 'ore', x: 820, y: 700 },
      { kind: 'ore', x: 1200, y: 430 },
      { kind: 'ore', x: 1460, y: 860 },
      { kind: 'tree', x: 620, y: 980 },
      { kind: 'herb', x: 1550, y: 590 }
    ],
    enemies: [
      { id: 'wolf', x: 920, y: 520 },
      { id: 'corpse', x: 1180, y: 760 },
      { id: 'ghost', x: 1460, y: 460 },
      { id: 'ghost', x: 730, y: 900 }
    ]
  }
};
