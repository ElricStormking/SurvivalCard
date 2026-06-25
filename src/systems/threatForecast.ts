import type { GameSave, Inventory, ItemId } from '../types';
import { siegeScalingProfile } from './siegeScaling';

export interface SiegeThreatForecast {
  cyclePhase: string;
  revealTier: number;
  summary: string;
  waves: string[];
  recommendations: string[];
  readiness: {
    score: number;
    label: string;
    notes: string[];
  };
}

export function siegeThreatForecast(save: GameSave): SiegeThreatForecast {
  const revealTier = threatRevealTier(save);
  const readiness = siegeReadiness(save);
  const pressure = siegeScalingProfile(save);
  return {
    cyclePhase: cyclePhase(save.world.day),
    revealTier,
    summary: `${threatSummary(revealTier)} ${pressure.pressureSummary}`,
    waves: revealedWaves(revealTier, pressure.cycle),
    recommendations: threatRecommendations(revealTier, readiness.score, pressure.cycle),
    readiness
  };
}

function threatRevealTier(save: GameSave): number {
  const scouting = Object.values(save.world.expeditionStats)
    .reduce((score, stats) => score + stats.visits + stats.extractions * 2 + stats.clears * 3, 0);
  const dayTier = save.world.day >= 14 ? 3 : save.world.day >= 11 ? 2 : save.world.day >= 6 ? 1 : 0;
  const scoutTier = scouting >= 7 ? 3 : scouting >= 4 ? 2 : scouting >= 1 ? 1 : 0;
  return Math.max(dayTier, scoutTier);
}

function cyclePhase(day: number): string {
  if (day >= 15) return 'Major Siege';
  if (day >= 14) return 'Final Preparation';
  if (day >= 11) return 'Warning';
  if (day >= 6) return 'Expansion';
  return 'Survival';
}

function threatSummary(revealTier: number): string {
  if (revealTier >= 3) return 'Confirmed mixed ghost-beast siege. The Ghost Captain will lead the final wave.';
  if (revealTier === 2) return 'Tracks point to wandering ghosts, wolves, corpses, and a stronger spirit commander.';
  if (revealTier === 1) return 'Scattered signs show both beast tracks and cold spiritual residue.';
  return 'The mountain is quiet, but the Formation Core senses a distant hostile cycle.';
}

function revealedWaves(revealTier: number, cycle: number): string[] {
  const suffix = cycle > 0 ? ` + cycle ${cycle + 1} reinforcements` : '';
  if (revealTier >= 3) return [`Wave 1: Wandering Ghosts${suffix}`, `Wave 2: Wolves and Corpses${suffix}`, `Wave 3: Ghost Captain${suffix}`];
  if (revealTier === 2) return ['Early spirits', 'Beasts with corpse support', 'Unknown commander'];
  if (revealTier === 1) return ['Spiritual scouts', 'Beast pressure'];
  return ['Unknown siege family'];
}

function threatRecommendations(revealTier: number, readinessScore: number, cycle: number): string[] {
  const recommendations = ['Keep the Formation Core repaired before Day 15.'];
  if (revealTier >= 1) recommendations.push('Prepare medicine and cooked food before long fights.');
  if (revealTier >= 2) recommendations.push('Spikes help against beasts; fire talismans help against ghosts and corpses.');
  if (revealTier >= 3) recommendations.push('Save Sword Qi and spirit for the Ghost Captain wave.');
  if (cycle >= 1) recommendations.push('Later cycles add reinforcements; bring extra food, medicine, and repaired weapons.');
  if (readinessScore < 55) recommendations.push('Craft at least one defense and one emergency repair kit.');
  return recommendations;
}

function siegeReadiness(save: GameSave): SiegeThreatForecast['readiness'] {
  const defenses = save.world.defenses;
  const medicine = availableCount(save, 'medicine');
  const cookedFood = availableCount(save, 'grilledMeat') + availableCount(save, 'herbSteak');
  const repairKits = availableCount(save, 'repairKit');
  const hasIronSword = availableCount(save, 'ironSword') > 0 || save.player.equipped === 'ironSword';
  const coreScore = Math.round((Math.max(0, save.world.formationCoreHp) / 150) * 25);
  const defenseScore = Math.min(35, defenses.barricade * 10 + defenses.spikeTrap * 12 + defenses.fireTalismanTrap * 13);
  const supplyScore = Math.min(22, medicine * 5 + cookedFood * 3 + repairKits * 7);
  const combatScore = Math.min(18, (hasIronSword ? 8 : 0) + (save.player.skills.swordQiSlash.unlocked ? 6 : 0) + save.player.skills.sword.level);
  const score = Math.min(100, coreScore + defenseScore + supplyScore + combatScore);
  return {
    score,
    label: readinessLabel(score),
    notes: [
      `Core ${Math.ceil(save.world.formationCoreHp)}/150`,
      `Defenses B${defenses.barricade} S${defenses.spikeTrap} F${defenses.fireTalismanTrap}`,
      `Supplies Med ${medicine} Food ${cookedFood} Repair ${repairKits}`,
      hasIronSword ? 'Iron sword ready' : 'Iron sword not ready'
    ]
  };
}

function readinessLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Prepared';
  if (score >= 40) return 'Strained';
  return 'Critical';
}

function availableCount(save: GameSave, itemId: ItemId): number {
  let total = countInventory(save.player.inventory, itemId) + countInventory(save.player.storage, itemId);
  for (const outputs of Object.values(save.world.deviceOutputs)) total += countInventory(outputs, itemId);
  return total;
}

function countInventory(inventory: Inventory, itemId: ItemId): number {
  return inventory[itemId] ?? 0;
}
