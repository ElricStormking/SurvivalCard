import { describe, expect, it } from 'vitest';
import { validateContentRegistry } from '../src/data/contentRegistry';
import { activeObjective, claimCompletedObjectiveRewards, objectiveRewardSummary, objectiveSteps } from '../src/systems/objectives';
import { createNewSave } from '../src/systems/save';
import { grantSkillXp } from '../src/systems/progression';
import { siegeThreatForecast } from '../src/systems/threatForecast';
import { insightForNextBreakthrough, meditate } from '../src/systems/cultivation';
import { beginNextSiegeCycle, resolveSiegeVictory } from '../src/systems/siegeCycle';
import { scaledSiegeWave, siegeScalingProfile, scaledVictoryRewards } from '../src/systems/siegeScaling';

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
    expect(save.world.expeditionRoute).toBe('pineForest');
    expect(save.world.expeditionStats.pineForest.visits).toBe(0);
    expect(save.world.expeditionStats.ironRidge.clears).toBe(0);
    expect(save.player.unlockedRecipes).toContain('ironAxe');
    expect(save.player.unlockedRecipes).toContain('ironPickaxe');
    expect(save.player.unlockedRecipes).toContain('grilledMeat');
    expect(save.player.unlockedRecipes).toContain('herbSteak');
    expect(save.player.passives.orbitingSword).toBe(true);
    expect(save.player.passives.minorFlameAura).toBe(true);
    expect(save.player.regenerate).toBeGreaterThan(0);
    expect(save.player.buffs.regenerationMultiplier).toBe(1);
    expect(save.player.activeBuffs).toEqual({});
    expect(save.player.spiritDog.command).toBe('follow');
    expect(save.player.spiritDog.regenerate).toBeGreaterThan(0);
    expect(save.player.spiritDog.buffs.regenerationMultiplier).toBe(1);
    expect(save.player.cultivation.realm).toBe('Mortal');
    expect(save.player.cultivation.insight).toBe(0);
    expect(save.world.siegeCyclesSurvived).toBe(0);
    expect(save.player.hotbar).toHaveLength(8);
    expect(save.player.hotbar).toEqual(expect.arrayContaining(['rustedSword', 'woodenAxe', 'stonePickaxe', 'medicine']));
    expect(save.world.objectives.visitedForest).toBe(false);
    expect(objectiveSteps(save)).toHaveLength(9);
    expect(activeObjective(save).id).toBe('visitedForest');
    expect(objectiveRewardSummary('visitedForest')).toContain('resin');
  });

  it('claims onboarding objective rewards once', () => {
    const save = createNewSave('Tester', 0, 0, 42);
    save.player.inventory = {};
    save.player.skillPoints = 0;
    save.world.objectives.visitedForest = true;
    save.world.objectives.extractedLoot = true;

    const firstClaims = claimCompletedObjectiveRewards(save);
    expect(firstClaims.map((claim) => claim.id)).toEqual(['visitedForest', 'extractedLoot']);
    expect(save.player.inventory.resin).toBe(1);
    expect(save.player.inventory.medicine).toBe(1);
    expect(save.player.skillPoints).toBe(1);
    expect(save.world.objectiveRewardsClaimed.visitedForest).toBe(true);

    const secondClaims = claimCompletedObjectiveRewards(save);
    expect(secondClaims).toEqual([]);
    expect(save.player.inventory.resin).toBe(1);
    expect(save.player.skillPoints).toBe(1);
  });

  it('practice XP contributes to attributes and affinities', () => {
    const save = createNewSave('Tester', 0, 0, 42);
    const beforeMetal = save.player.affinities.metal;
    grantSkillXp(save, 'sword', 20);
    expect(save.player.attributeProgress.strength).toBeGreaterThan(0);
    expect(save.player.affinities.metal).toBeGreaterThan(beforeMetal);
  });

  it('derives siege forecast from day, scouting, and farm readiness', () => {
    const save = createNewSave('Tester', 0, 0, 42);
    let forecast = siegeThreatForecast(save);
    expect(forecast.cyclePhase).toBe('Survival');
    expect(forecast.revealTier).toBe(0);
    expect(forecast.readiness.score).toBeGreaterThan(0);

    save.world.expeditionStats.pineForest.extractions = 2;
    save.world.expeditionStats.ironRidge.clears = 1;
    save.world.defenses = { barricade: 1, spikeTrap: 1, fireTalismanTrap: 1 };
    save.player.storage.medicine = 2;
    save.player.storage.repairKit = 1;
    save.player.inventory.ironSword = 1;
    save.player.skills.swordQiSlash.unlocked = true;
    forecast = siegeThreatForecast(save);
    expect(forecast.revealTier).toBe(3);
    expect(forecast.waves).toContain('Wave 3: Ghost Captain');
    expect(forecast.readiness.label).not.toBe('Critical');

    save.world.siegeCyclesSurvived = 2;
    forecast = siegeThreatForecast(save);
    expect(forecast.summary).toContain('Cycle 3 pressure');
    expect(forecast.recommendations).toContain('Later cycles add reinforcements; bring extra food, medicine, and repaired weapons.');
  });

  it('scales siege pressure, wave bodies, and victory rewards after survived cycles', () => {
    const save = createNewSave('Tester', 0, 0, 42);
    expect(siegeScalingProfile(save).hpMultiplier).toBe(1);
    expect(scaledSiegeWave(['ghost', 'ghost'], 0, save)).toEqual(['ghost', 'ghost']);

    save.world.siegeCyclesSurvived = 3;
    const profile = siegeScalingProfile(save);
    expect(profile.hpMultiplier).toBeGreaterThan(1);
    expect(profile.damageMultiplier).toBeGreaterThan(1);
    expect(scaledSiegeWave(['captain'], 2, save).length).toBeGreaterThan(1);
    const rewards = scaledVictoryRewards(save, { spiritPaper: 4, ore: 3, herb: 3 });
    expect(rewards.spiritPaper).toBeGreaterThan(4);
    expect(rewards.ore).toBeGreaterThan(3);
  });

  it('meditation advances time, restores resources, and can grant breakthrough skill points', () => {
    const save = createNewSave('Tester', 0, 0, 42);
    save.player.hp = 50;
    save.player.energy = 20;
    save.player.spirit = 10;
    save.player.hunger = 80;
    const beforeMinutes = save.world.minutes;
    const result = meditate(save, 60);
    expect(save.world.minutes).toBeGreaterThan(beforeMinutes);
    expect(result.insightGained).toBeGreaterThan(0);
    expect(save.player.hp).toBeGreaterThan(50);
    expect(save.player.energy).toBeGreaterThan(20);
    expect(save.player.spirit).toBeGreaterThan(10);
    expect(save.player.hunger).toBeLessThan(80);

    save.player.cultivation.insight = insightForNextBreakthrough(save.player.cultivation.breakthroughs) - 1;
    const beforeSkillPoints = save.player.skillPoints;
    const breakthrough = meditate(save, 5);
    expect(breakthrough.breakthrough).toBe(true);
    expect(save.player.cultivation.realm).toBe('Qi Gathering');
    expect(save.player.skillPoints).toBe(beforeSkillPoints + 1);
  });

  it('resolves a siege victory through an aftermath cycle reset', () => {
    const save = createNewSave('Tester', 0, 0, 42);
    save.world.day = 15;
    save.world.formationCoreHp = 92;
    save.world.defenses = { barricade: 2, spikeTrap: 3, fireTalismanTrap: 1 };
    const beforeSkillPoints = save.player.skillPoints;
    const report = resolveSiegeVictory(save);

    expect(report.outcome).toBe('victory');
    expect(save.world.siegeWon).toBe(true);
    expect(save.world.objectives.wonSiege).toBe(true);
    expect(save.world.siegeCyclesSurvived).toBe(1);
    expect(save.player.skillPoints).toBe(beforeSkillPoints + 1);
    expect(save.player.storage.spiritPaper).toBeGreaterThanOrEqual(4);
    expect(save.world.defenses.barricade).toBe(1);
    expect(save.world.defenses.fireTalismanTrap).toBe(0);

    beginNextSiegeCycle(save);
    expect(save.world.day).toBe(1);
    expect(save.world.minutes).toBe(7 * 60);
    expect(save.world.scene).toBe('farm');
    expect(save.world.siegeWon).toBe(false);
    expect(save.world.objectives.startedSiege).toBe(false);
    expect(save.world.objectives.wonSiege).toBe(true);
  });
});
