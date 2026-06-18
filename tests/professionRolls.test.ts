import { describe, expect, it } from 'vitest';
import { PROFESSIONS } from '../src/data/professions';
import { createBackgroundRolls } from '../src/systems/professionRolls';

describe('profession rolls', () => {
  it('creates three bounded records with eight attribute points', () => {
    for (const profession of PROFESSIONS) {
      const rolls = createBackgroundRolls(profession, 1234);
      expect(rolls).toHaveLength(3);
      for (const roll of rolls) {
        expect(Object.values(roll.attributes).reduce((sum, value) => sum + value, 0)).toBe(8);
        for (const [attribute, value] of Object.entries(roll.attributes)) {
          if (!profession.favored.includes(attribute as keyof typeof roll.attributes)) expect(value).toBeLessThanOrEqual(1);
        }
        expect(Object.values(roll.affinities).reduce((sum, value) => sum + Number(value), 0)).toBe(2);
      }
    }
  });
});
