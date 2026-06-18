import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/systems/save';
import { addItems, hasItems, removeItems } from '../src/systems/inventory';
import { collectDeviceOutputs, startRecipe, tickProduction } from '../src/systems/production';
import { grantSkillXp, spendSkillPoint, unlockSwordQiSlash } from '../src/systems/progression';
import { effectivePetRegenerationPerSecond, effectiveRegenerationPerSecond, hungerRegenerationMultiplier } from '../src/systems/regeneration';

describe('inventory', () => {
  it('adds, checks, and removes item stacks', () => {
    const inv = {};
    addItems(inv, { log: 3, stone: 1 });
    expect(hasItems(inv, { log: 2 })).toBe(true);
    expect(removeItems(inv, { log: 2, stone: 1 })).toBe(true);
    expect(inv).toEqual({ log: 1 });
  });
});

describe('production', () => {
  it('queues recipe timers and keeps outputs on the device until pickup', () => {
    const save = createNewSave('Tester', 1, 0, 100);
    addItems(save.player.inventory, { log: 10, stone: 10 });
    save.player.unlockedRecipes.push('barricade');
    expect(startRecipe(save, 'barricade')).toBe(true);
    tickProduction(save, 100);
    expect(save.world.deviceOutputs.workbench.barricade).toBe(1);
    expect(save.player.inventory.barricade).toBeUndefined();
    const collected = collectDeviceOutputs(save, 'workbench');
    expect(collected.barricade).toBe(1);
    expect(save.world.deviceOutputs.workbench).toEqual({});
    expect(save.player.inventory.barricade).toBe(1);
  });
});

describe('progression', () => {
  it('grants skill points and unlocks Sword Qi Slash', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.skillPoints = 0;
    grantSkillXp(save, 'sword', 90);
    expect(save.player.skillPoints).toBeGreaterThan(0);
    expect(unlockSwordQiSlash(save)).toBe(true);
    expect(save.player.skills.swordQiSlash.unlocked).toBe(true);
  });

  it('spends skill points on trained skills and locked Sword Qi Slash', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.skillPoints = 2;
    const gatheringLevel = save.player.skills.gathering.level;
    expect(spendSkillPoint(save, 'gathering')).toBe(true);
    expect(save.player.skills.gathering.level).toBe(gatheringLevel + 1);
    expect(save.player.skillPoints).toBe(1);
    expect(spendSkillPoint(save, 'swordQiSlash')).toBe(true);
    expect(save.player.skills.swordQiSlash.unlocked).toBe(true);
    expect(save.player.skillPoints).toBe(0);
    expect(spendSkillPoint(save, 'sword')).toBe(false);
  });
});

describe('regeneration', () => {
  it('uses hunger thresholds for player HP regeneration', () => {
    expect(hungerRegenerationMultiplier(75)).toBe(1);
    expect(hungerRegenerationMultiplier(50)).toBe(0.75);
    expect(hungerRegenerationMultiplier(49)).toBe(0.5);
    expect(hungerRegenerationMultiplier(24)).toBe(0);
  });

  it('applies skills and buffs to the regenerate attribute', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.hunger = 100;
    save.player.regenerate = 1;
    save.player.skills.gathering.level = 3;
    save.player.buffs.regenerationMultiplier = 2;
    save.player.buffs.regenerationFlat = 0.5;
    expect(effectiveRegenerationPerSecond(save)).toBeCloseTo(3.3);
    save.player.hunger = 20;
    expect(effectiveRegenerationPerSecond(save)).toBe(0);
  });

  it('applies pet regenerate, hunger gate, affinity bond, and pet buffs', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.hunger = 100;
    save.player.affinities.light = 5;
    save.player.spiritDog.regenerate = 1;
    save.player.spiritDog.buffs.regenerationMultiplier = 2;
    save.player.spiritDog.buffs.regenerationFlat = 0.5;
    expect(effectivePetRegenerationPerSecond(save)).toBeCloseTo(3.3);
    save.player.hunger = 20;
    expect(effectivePetRegenerationPerSecond(save)).toBe(0);
  });
});
