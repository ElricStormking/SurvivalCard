import type { AttributeSet, BackgroundRoll } from '../types';
import type { ProfessionDef } from '../data/professions';
import { addItems } from './inventory';
import { mulberry32, pick } from './random';

const ATTRIBUTES: (keyof AttributeSet)[] = ['strength', 'constitution', 'agility', 'intelligence', 'spirit', 'luck'];

export function createBackgroundRolls(profession: ProfessionDef, baseSeed: number): BackgroundRoll[] {
  return [0, 1, 2].map((offset) => createRoll(profession, baseSeed + offset * 101));
}

function createRoll(profession: ProfessionDef, seed: number): BackgroundRoll {
  const rng = mulberry32(seed);
  const attributes = Object.fromEntries(ATTRIBUTES.map((id) => [id, 0])) as unknown as AttributeSet;
  let remaining = 8;

  for (const attr of profession.favored) {
    const value = 1 + Math.floor(rng() * 3);
    attributes[attr] += value;
    remaining -= value;
  }

  while (remaining > 0) {
    const pool = rng() > 0.2 ? profession.favored : ATTRIBUTES;
    const attr = pick(pool, rng);
    const cap = profession.favored.includes(attr) ? 4 : 1;
    if (attributes[attr] < cap) {
      attributes[attr] += 1;
      remaining -= 1;
    }
  }

  const affinities: BackgroundRoll['affinities'] = {};
  for (let i = 0; i < 2; i += 1) {
    const affinity = pick(profession.affinities, rng) as keyof BackgroundRoll['affinities'];
    affinities[affinity] = (affinities[affinity] ?? 0) + 1;
  }

  const skillFamiliarity: BackgroundRoll['skillFamiliarity'] = {};
  for (const skill of profession.skills) skillFamiliarity[skill] = 2;

  return {
    seed,
    attributes,
    affinities,
    skillFamiliarity,
    items: addItems({ rustedSword: 1, woodenAxe: 1, stonePickaxe: 1 }, profession.items),
    recipes: Array.from(new Set(['medicine', ...profession.recipes])),
    positiveTrait: `${profession.fixedTrait} + ${pick(profession.traitPool, rng)}`,
    drawback: profession.drawback
  };
}
