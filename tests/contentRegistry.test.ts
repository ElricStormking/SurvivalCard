import { describe, expect, it } from 'vitest';
import { validateContentRegistry } from '../src/data/contentRegistry';
import { activeObjective, objectiveSteps } from '../src/systems/objectives';
import { createNewSave } from '../src/systems/save';
import { grantSkillXp } from '../src/systems/progression';

describe('content registry', () => {
  it('validates prototype content references', () => {
    const result = validateContentRegistry();
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});

describe('save v2 foundation', () => {
  it('creates attributes, affinities, and shared tool recipe unlocks', () => {
    const save = createNewSave('Tester', 0, 0, 42);
    expect(save.version).toBe(2);
    expect(save.player.attributes.strength).toBeGreaterThan(0);
    expect(save.player.attributeProgress.strength).toBe(0);
    expect(save.player.affinities.metal).toBeGreaterThanOrEqual(0);
    expect(save.player.unlockedRecipes).toContain('ironAxe');
    expect(save.player.unlockedRecipes).toContain('ironPickaxe');
    expect(save.player.unlockedRecipes).toContain('grilledMeat');
    expect(save.player.unlockedRecipes).toContain('herbSteak');
    expect(save.player.passives.orbitingSword).toBe(true);
    expect(save.player.passives.minorFlameAura).toBe(true);
    expect(save.player.regenerate).toBeGreaterThan(0);
    expect(save.player.buffs.regenerationMultiplier).toBe(1);
    expect(save.player.spiritDog.command).toBe('follow');
    expect(save.player.spiritDog.regenerate).toBeGreaterThan(0);
    expect(save.player.spiritDog.buffs.regenerationMultiplier).toBe(1);
    expect(save.player.hotbar).toHaveLength(8);
    expect(save.player.hotbar).toEqual(expect.arrayContaining(['rustedSword', 'woodenAxe', 'stonePickaxe', 'medicine']));
    expect(save.world.objectives.visitedForest).toBe(false);
    expect(objectiveSteps(save)).toHaveLength(9);
    expect(activeObjective(save).id).toBe('visitedForest');
  });

  it('practice XP contributes to attributes and affinities', () => {
    const save = createNewSave('Tester', 0, 0, 42);
    const beforeMetal = save.player.affinities.metal;
    grantSkillXp(save, 'sword', 20);
    expect(save.player.attributeProgress.strength).toBeGreaterThan(0);
    expect(save.player.affinities.metal).toBeGreaterThan(beforeMetal);
  });
});
