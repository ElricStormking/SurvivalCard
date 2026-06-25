import { describe, expect, it } from 'vitest';
import { createNewSave } from '../src/systems/save';
import { addItems, hasItems, removeItems } from '../src/systems/inventory';
import { collectDeviceOutputs, deviceOutputCapacity, deviceOutputIsFull, deviceOutputUsed, handCraftRecipe, isHandCraftableRecipe, productionDurationSeconds, startRecipe, tickProduction } from '../src/systems/production';
import { grantSkillXp, spendSkillPoint, unlockSwordQiSlash } from '../src/systems/progression';
import { effectivePetRegenerationPerSecond, effectiveRegenerationPerSecond, hungerRegenerationMultiplier } from '../src/systems/regeneration';
import { resolveNightEvent } from '../src/systems/nightEvents';
import { tickWorld } from '../src/systems/time';
import { dailyCondition } from '../src/systems/dailyConditions';
import { damageDurability, durabilityCurrent, durabilityMax, repairDurability } from '../src/systems/durability';
import { equippedCombatDamage, equippedConditionLine, equipmentConditionMultiplier, itemConditionState, repairEquippedItem, toolWorkDurationMultiplier } from '../src/systems/maintenance';
import { deviceFuelText, refuelDevice } from '../src/systems/deviceFuel';
import { deviceConditionPercent, deviceWorkMultiplier, repairDeviceCondition } from '../src/systems/deviceCondition';
import { survivalStatus } from '../src/systems/survivalStatus';
import { activeBuffLine, applyConsumableBuff, tickActiveBuffs } from '../src/systems/buffs';
import { dodgeProfile } from '../src/systems/dodge';
import { carryCapacity, encumbrance, inventoryWeight } from '../src/systems/encumbrance';
import { createLostLootFromDefeat, lostLootText, recoverLostLoot } from '../src/systems/lostLoot';

describe('inventory', () => {
  it('adds, checks, and removes item stacks', () => {
    const inv = {};
    addItems(inv, { log: 3, stone: 1 });
    expect(hasItems(inv, { log: 2 })).toBe(true);
    expect(removeItems(inv, { log: 2, stone: 1 })).toBe(true);
    expect(inv).toEqual({ log: 1 });
  });

  it('calculates carried weight from item definitions', () => {
    expect(inventoryWeight({ log: 3, ore: 2, herb: 1 })).toBe(13);
  });

  it('stores half of unsecured defeat loss as a recoverable route pack', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.unsecured = { ore: 5, herb: 1, log: 2 };

    const lost = createLostLootFromDefeat(save, 'pineForest', 520, 680);

    expect(lost).toEqual({ ore: 2, log: 1 });
    expect(save.player.unsecured).toEqual({ ore: 3, herb: 1, log: 1 });
    expect(save.world.lostLoot?.route).toBe('pineForest');
    expect(save.world.lostLoot?.items).toEqual({ ore: 2, log: 1 });
    expect(lostLootText(save)).toContain('Lost pack');

    const recovered = recoverLostLoot(save);
    expect(recovered).toEqual({ ore: 2, log: 1 });
    expect(save.player.inventory.ore).toBe((save.player.background.items.ore ?? 0) + 2);
    expect(save.player.inventory.log).toBe((save.player.background.items.log ?? 0) + 1);
    expect(save.world.lostLoot).toBeNull();
  });

  it('does not create a lost pack when no stack loses at least one item', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.unsecured = { herb: 1 };

    expect(createLostLootFromDefeat(save, 'pineForest', 520, 680)).toEqual({});
    expect(save.player.unsecured).toEqual({ herb: 1 });
    expect(save.world.lostLoot).toBeNull();
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

  it('shortens production timers with crafting skill and intelligence', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    addItems(save.player.inventory, { log: 10, stone: 10, resin: 10 });
    save.player.unlockedRecipes.push('repairKit');
    save.player.skills.crafting.level = 5;
    save.player.attributes.intelligence = 6;
    const duration = productionDurationSeconds(save, 'repairKit');

    expect(duration).toBeLessThan(14);
    expect(startRecipe(save, 'repairKit')).toBe(true);
    expect(save.world.devices.workbench[0].total).toBe(duration);
    expect(save.world.devices.workbench[0].remaining).toBe(duration);
  });

  it('requires and consumes fuel for fire devices', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.inventory = { meat: 1 };
    save.player.storage = {};
    expect(startRecipe(save, 'grilledMeat')).toBe(false);
    addItems(save.player.storage, { log: 1 });
    expect(startRecipe(save, 'grilledMeat')).toBe(true);
    expect(save.world.deviceFuel.cookingFire).toBeGreaterThan(0);
    const beforeFuel = save.world.deviceFuel.cookingFire;
    tickProduction(save, 5);
    expect(save.world.deviceFuel.cookingFire).toBeLessThan(beforeFuel);
    tickProduction(save, 100);
    expect(save.world.deviceOutputs.cookingFire.grilledMeat).toBe(1);
    expect(deviceFuelText(save, 'cookingFire')).toContain('Fuel:');
  });

  it('pauses queued production while completed output storage is full', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    addItems(save.player.inventory, { log: 8, stone: 8 });
    save.player.unlockedRecipes.push('barricade');
    save.world.deviceOutputs.workbench = { repairKit: deviceOutputCapacity('workbench') };

    expect(startRecipe(save, 'barricade')).toBe(true);
    const beforeRemaining = save.world.devices.workbench[0].remaining;
    tickProduction(save, 100);

    expect(deviceOutputIsFull(save, 'workbench')).toBe(true);
    expect(save.world.devices.workbench[0].remaining).toBe(beforeRemaining);
    expect(save.world.deviceOutputs.workbench.barricade).toBeUndefined();

    const collected = collectDeviceOutputs(save, 'workbench');
    expect(collected.repairKit).toBe(deviceOutputCapacity('workbench'));
    tickProduction(save, 100);
    expect(save.world.deviceOutputs.workbench.barricade).toBe(1);
    expect(deviceOutputUsed(save, 'workbench')).toBe(1);
  });

  it('wears device condition when production completes', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    addItems(save.player.inventory, { log: 3, stone: 1 });
    save.player.unlockedRecipes.push('barricade');

    expect(deviceConditionPercent(save, 'workbench')).toBe(100);
    expect(startRecipe(save, 'barricade')).toBe(true);
    tickProduction(save, 100);

    expect(save.world.deviceOutputs.workbench.barricade).toBe(1);
    expect(deviceConditionPercent(save, 'workbench')).toBe(97);
  });

  it('pauses broken devices and resumes after repair', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    addItems(save.player.inventory, { log: 3, stone: 1, repairKit: 1 });
    save.player.unlockedRecipes.push('barricade');

    expect(startRecipe(save, 'barricade')).toBe(true);
    save.world.deviceCondition.workbench = 0;
    const beforeRemaining = save.world.devices.workbench[0].remaining;
    tickProduction(save, 100);

    expect(deviceWorkMultiplier(save, 'workbench')).toBe(0);
    expect(save.world.devices.workbench[0].remaining).toBe(beforeRemaining);
    expect(save.world.deviceOutputs.workbench.barricade).toBeUndefined();

    const repair = repairDeviceCondition(save, 'workbench');
    expect(repair.ok).toBe(true);
    expect(deviceConditionPercent(save, 'workbench')).toBe(40);
    tickProduction(save, 100);
    expect(save.world.deviceOutputs.workbench.barricade).toBe(1);
    expect(save.player.inventory.repairKit).toBeUndefined();
  });

  it('does not spend fuel when queued production is missing recipe inputs', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.inventory = {};
    save.player.storage = { log: 1 };

    expect(startRecipe(save, 'grilledMeat')).toBe(false);
    expect(save.world.deviceFuel.cookingFire).toBe(0);
    expect(save.player.storage.log).toBe(1);
  });

  it('hand crafts simple survival recipes directly into inventory', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.inventory = { log: 1 };
    save.player.storage = { stone: 1, resin: 1 };
    save.player.unlockedRecipes.push('repairKit');

    expect(isHandCraftableRecipe('repairKit')).toBe(true);
    expect(handCraftRecipe(save, 'repairKit')).toBe(true);
    expect(save.player.inventory.repairKit).toBe(1);
    expect(save.player.inventory.log).toBeUndefined();
    expect(save.player.storage).toEqual({});
    expect(save.world.devices.workbench).toEqual([]);
  });

  it('keeps advanced recipes device-only for the current slice', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    addItems(save.player.inventory, { ore: 3, log: 1 });
    save.player.unlockedRecipes.push('ironSword');

    expect(isHandCraftableRecipe('ironSword')).toBe(false);
    expect(handCraftRecipe(save, 'ironSword')).toBe(false);
    expect(save.player.inventory.ironSword).toBeUndefined();
  });

  it('lets players manually refuel devices from inventory or storage without exceeding the fuel cap', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.inventory = { resin: 1 };
    save.player.storage = { log: 4 };

    expect(refuelDevice(save, 'furnace')).toBe(true);
    expect(save.world.deviceFuel.furnace).toBe(36);
    expect(save.player.storage.log).toBe(3);

    expect(refuelDevice(save, 'alchemyFurnace')).toBe(true);
    expect(save.world.deviceFuel.alchemyFurnace).toBe(28);
    expect(save.player.inventory.resin).toBeUndefined();

    refuelDevice(save, 'furnace');
    refuelDevice(save, 'furnace');
    refuelDevice(save, 'furnace');
    expect(save.world.deviceFuel.furnace).toBeLessThanOrEqual(90);
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
    expect(effectiveRegenerationPerSecond(save)).toBeCloseTo(3.3 * dailyCondition(save).regenerationMultiplier);
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
    expect(effectivePetRegenerationPerSecond(save)).toBeCloseTo(3.3 * dailyCondition(save).regenerationMultiplier);
    save.player.hunger = 20;
    expect(effectivePetRegenerationPerSecond(save)).toBe(0);
  });
});

describe('active buffs', () => {
  it('applies timed consumable buffs to player and pet regeneration', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.hunger = 100;
    save.player.hp = 50;
    save.player.spiritDog.hp = 40;
    const beforePlayer = effectiveRegenerationPerSecond(save);
    const beforePet = effectivePetRegenerationPerSecond(save);

    expect(applyConsumableBuff(save, 'herbSteak')).toBe('Herbal Fortitude');
    expect(activeBuffLine(save)).toContain('Herbal Fortitude');
    expect(effectiveRegenerationPerSecond(save)).toBeGreaterThan(beforePlayer);
    expect(effectivePetRegenerationPerSecond(save)).toBeGreaterThan(beforePet);

    tickActiveBuffs(save, 200);
    expect(activeBuffLine(save)).toBe('Buffs: none');
    expect(effectiveRegenerationPerSecond(save)).toBeCloseTo(beforePlayer);
  });

  it('refreshes matching consumable buff duration instead of duplicating it', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    expect(applyConsumableBuff(save, 'grilledMeat')).toBe('Warm Meal');
    tickActiveBuffs(save, 60);
    const reduced = save.player.activeBuffs.warmMeal?.remaining ?? 0;
    expect(reduced).toBeLessThan(90);

    expect(applyConsumableBuff(save, 'grilledMeat')).toBe('Warm Meal');
    expect(save.player.activeBuffs.warmMeal?.remaining).toBe(90);
    expect(Object.keys(save.player.activeBuffs)).toEqual(['warmMeal']);
  });
});

describe('survival status', () => {
  it('derives penalties from hunger, energy, and wounds without mutating the save', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.hunger = 0;
    save.player.energy = 10;
    save.player.hp = 20;

    const status = survivalStatus(save);
    expect(status.labels).toEqual(['Starving', 'Exhausted', 'Wounded']);
    expect(status.movementMultiplier).toBeLessThan(0.7);
    expect(status.outgoingDamageMultiplier).toBeLessThan(0.8);
    expect(status.incomingDamageMultiplier).toBeGreaterThan(1);
    expect(save.player.hunger).toBe(0);
  });

  it('reports stable or well fed states for healthy characters', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.hunger = 60;
    save.player.energy = 80;
    save.player.hp = 100;
    expect(survivalStatus(save).warningLine).toBe('Condition: Stable');

    save.player.hunger = 90;
    expect(survivalStatus(save).labels).toContain('Well fed');
  });

  it('includes encumbrance when carried inventory exceeds capacity', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.inventory = { ore: Math.ceil(carryCapacity(save) / 3) + 5 };
    const carry = encumbrance(save);
    expect(carry.label === 'Encumbered' || carry.label === 'Overloaded').toBe(true);
    const status = survivalStatus(save);
    expect(status.labels).toContain(carry.label);
    expect(status.movementMultiplier).toBeLessThan(1);
  });
});

describe('dodge', () => {
  it('requires enough energy and scales distance with agility and condition', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.energy = 100;
    save.player.hunger = 100;
    save.player.attributes.agility = 8;
    const healthy = dodgeProfile(save);
    expect(healthy.canDodge).toBe(true);
    expect(healthy.energyCost).toBe(16);
    expect(healthy.distance).toBeGreaterThan(118);
    expect(healthy.invulnerabilityMs).toBeGreaterThan(0);

    save.player.energy = 4;
    const tired = dodgeProfile(save);
    expect(tired.canDodge).toBe(false);
    expect(tired.reason).toContain('exhausted');
    expect(tired.distance).toBeLessThan(healthy.distance);
  });

  it('shortens dodge distance while starving or wounded', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.energy = 100;
    const healthy = dodgeProfile(save).distance;
    save.player.hunger = 0;
    save.player.hp = 20;
    expect(dodgeProfile(save).distance).toBeLessThan(healthy);
  });

  it('shortens dodge distance while encumbered', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.energy = 100;
    const light = dodgeProfile(save).distance;
    save.player.inventory = { ore: Math.ceil(carryCapacity(save) / 3) + 5 };
    expect(encumbrance(save).label).not.toBe('Light');
    expect(dodgeProfile(save).distance).toBeLessThan(light);
  });
});

describe('night events', () => {
  it('resolves one deterministic minor event after a normal night', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.world.minutes = 23 * 60 + 59;
    tickWorld(save, 20_000);
    expect(save.world.day).toBe(2);
    expect(save.world.nightEventLog).toHaveLength(1);
    expect(save.world.lastNightEventDay).toBe(1);
    expect(save.world.nightEventLog[0].effects.length).toBeGreaterThan(0);
  });

  it('does not duplicate a night event for the same completed day', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    const first = resolveNightEvent(save, 3);
    const duplicate = resolveNightEvent(save, 3);
    expect(first).toBeDefined();
    expect(duplicate).toBeUndefined();
    expect(save.world.nightEventLog).toHaveLength(1);
  });
});

describe('daily conditions', () => {
  it('derives deterministic weather and moon modifiers from the save state', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    const first = dailyCondition(save);
    const second = dailyCondition(save);
    expect(second).toEqual(first);
    expect(first.dangerMultiplier).toBeGreaterThan(0);
    expect(first.gatheringMultiplier).toBeGreaterThan(0);
    expect(first.regenerationMultiplier).toBeGreaterThan(0);

    save.world.day = 14;
    expect(dailyCondition(save).weatherId).toBe('spiritWind');
  });

  it('applies daily condition regeneration modifiers', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.hunger = 100;
    save.player.regenerate = 1;
    save.player.skills.gathering.level = 1;
    save.player.buffs.regenerationMultiplier = 1;
    save.player.buffs.regenerationFlat = 0;
    expect(effectiveRegenerationPerSecond(save)).toBeCloseTo(dailyCondition(save).regenerationMultiplier);
  });
});

describe('durability', () => {
  it('tracks durability and consumes one item when a tool breaks', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.inventory.woodenAxe = 1;
    expect(durabilityCurrent(save, 'woodenAxe')).toBe(durabilityMax('woodenAxe'));
    const result = damageDurability(save, 'woodenAxe', durabilityMax('woodenAxe'));
    expect(result?.broke).toBe(true);
    expect(save.player.inventory.woodenAxe).toBeUndefined();
    expect(save.player.itemDurability.woodenAxe).toBeUndefined();
  });

  it('repairs a damaged durable item back to full', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.inventory.rustedSword = 1;
    damageDurability(save, 'rustedSword', 12);
    expect(durabilityCurrent(save, 'rustedSword')).toBeLessThan(durabilityMax('rustedSword'));
    expect(repairDurability(save, 'rustedSword')).toBe(true);
    expect(durabilityCurrent(save, 'rustedSword')).toBe(durabilityMax('rustedSword'));
  });

  it('slows work duration when a gathering tool is worn or fragile', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.inventory.woodenAxe = 1;

    expect(itemConditionState(save, 'woodenAxe')).toBe('stable');
    expect(toolWorkDurationMultiplier(save, 'woodenAxe')).toBe(1);

    damageDurability(save, 'woodenAxe', durabilityMax('woodenAxe') * 0.6);
    expect(itemConditionState(save, 'woodenAxe')).toBe('worn');
    expect(toolWorkDurationMultiplier(save, 'woodenAxe')).toBe(1.15);

    damageDurability(save, 'woodenAxe', durabilityMax('woodenAxe') * 0.2);
    expect(itemConditionState(save, 'woodenAxe')).toBe('fragile');
    expect(toolWorkDurationMultiplier(save, 'woodenAxe')).toBe(1.4);

    expect(repairDurability(save, 'woodenAxe')).toBe(true);
    expect(itemConditionState(save, 'woodenAxe')).toBe('stable');
    expect(toolWorkDurationMultiplier(save, 'woodenAxe')).toBe(1);
  });
});

describe('maintenance', () => {
  it('reduces equipped combat damage as weapon condition degrades', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.equipped = 'rustedSword';
    save.player.inventory.rustedSword = 1;

    expect(equipmentConditionMultiplier(save, 'rustedSword')).toBe(1);
    expect(equippedCombatDamage(save)).toBe(16);

    damageDurability(save, 'rustedSword', durabilityMax('rustedSword') * 0.6);
    expect(equipmentConditionMultiplier(save, 'rustedSword')).toBe(0.85);
    expect(equippedCombatDamage(save)).toBe(14);
    expect(equippedConditionLine(save)).toContain('damage 85%');

    damageDurability(save, 'rustedSword', durabilityMax('rustedSword') * 0.2);
    expect(equipmentConditionMultiplier(save, 'rustedSword')).toBe(0.65);
    expect(equippedCombatDamage(save)).toBe(11);
    expect(equippedConditionLine(save)).toContain('fragile');
  });

  it('repairs the equipped durable item by consuming one repair kit', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.equipped = 'rustedSword';
    save.player.inventory.repairKit = 1;
    damageDurability(save, 'rustedSword', 12);
    const before = durabilityCurrent(save, 'rustedSword');
    const result = repairEquippedItem(save);
    expect(result.ok).toBe(true);
    expect(result.before).toBe(before);
    expect(save.player.inventory.repairKit).toBeUndefined();
    expect(durabilityCurrent(save, 'rustedSword')).toBe(durabilityMax('rustedSword'));
    expect(equippedConditionLine(save)).toContain('Rusted Sword');
  });

  it('does not spend repair kits when equipped gear is full', () => {
    const save = createNewSave('Tester', 0, 0, 100);
    save.player.equipped = 'rustedSword';
    save.player.inventory.repairKit = 1;
    const result = repairEquippedItem(save);
    expect(result.ok).toBe(false);
    expect(save.player.inventory.repairKit).toBe(1);
  });
});
