import type { GameSave, Inventory, SkillId } from '../types';
import { addItems } from './inventory';
import { grantSkillXp } from './progression';

type ObjectiveId = keyof GameSave['world']['objectives'];

export interface ObjectiveStep {
  id: ObjectiveId;
  title: string;
  detail: string;
  done: boolean;
}

export interface ObjectiveRewardClaim {
  id: ObjectiveId;
  title: string;
  summary: string;
}

interface ObjectiveReward {
  inventory?: Inventory;
  storage?: Inventory;
  skillXp?: Partial<Record<SkillId, number>>;
  skillPoints?: number;
  spirit?: number;
  coreHp?: number;
}

const OBJECTIVE_REWARDS: Record<ObjectiveId, ObjectiveReward> = {
  visitedForest: { inventory: { resin: 1 }, skillXp: { gathering: 6 } },
  gatheredResource: { skillXp: { gathering: 14 } },
  extractedLoot: { skillPoints: 1, inventory: { medicine: 1 } },
  queuedProduction: { skillXp: { crafting: 12 } },
  craftedMedicine: { skillXp: { crafting: 18 }, spirit: 5 },
  craftedIronSword: { skillXp: { sword: 20 }, spirit: 8 },
  placedDefense: { storage: { repairKit: 1 }, coreHp: 15 },
  startedSiege: { spirit: 15 },
  wonSiege: { storage: { spiritPaper: 2, resin: 2 } }
};

export function objectiveSteps(save: GameSave): ObjectiveStep[] {
  const flags = save.world.objectives;
  return [
    {
      id: 'visitedForest',
      title: 'Scout the pine forest',
      detail: 'Press TAB from the farm to enter the expedition map.',
      done: flags.visitedForest
    },
    {
      id: 'gatheredResource',
      title: 'Gather expedition supplies',
      detail: 'Use E near trees, ore, or herbs. Trees need an axe; ore needs a pickaxe.',
      done: flags.gatheredResource
    },
    {
      id: 'extractedLoot',
      title: 'Extract with unsecured loot',
      detail: 'Return to the green extraction path and press TAB.',
      done: flags.extractedLoot
    },
    {
      id: 'queuedProduction',
      title: 'Start production',
      detail: 'Stand near a device, press E, choose a recipe, then queue it.',
      done: flags.queuedProduction
    },
    {
      id: 'craftedMedicine',
      title: 'Craft wound medicine',
      detail: 'Use the Alchemy Furnace to produce medicine.',
      done: flags.craftedMedicine
    },
    {
      id: 'craftedIronSword',
      title: 'Forge an iron sword',
      detail: 'Use the Damaged Furnace to make an iron sword.',
      done: flags.craftedIronSword
    },
    {
      id: 'placedDefense',
      title: 'Place a siege defense',
      detail: 'Craft a barricade or trap, then press G on the farm.',
      done: flags.placedDefense
    },
    {
      id: 'startedSiege',
      title: 'Begin the Day 15 siege',
      detail: 'Wait for Day 15 or press F7 for a debug start.',
      done: flags.startedSiege
    },
    {
      id: 'wonSiege',
      title: 'Protect the Formation Core',
      detail: 'Defeat all three siege waves while the core survives.',
      done: flags.wonSiege || save.world.siegeWon
    }
  ];
}

export function activeObjective(save: GameSave): ObjectiveStep {
  return objectiveSteps(save).find((step) => !step.done) ?? {
    id: 'wonSiege',
    title: 'Vertical slice complete',
    detail: 'The full prototype loop has been completed.',
    done: true
  };
}

export function objectiveRewardSummary(id: ObjectiveId): string {
  return summarizeReward(OBJECTIVE_REWARDS[id]);
}

export function claimCompletedObjectiveRewards(save: GameSave): ObjectiveRewardClaim[] {
  const claims: ObjectiveRewardClaim[] = [];
  save.world.objectiveRewardsClaimed = save.world.objectiveRewardsClaimed ?? {};
  for (const step of objectiveSteps(save)) {
    if (!step.done || save.world.objectiveRewardsClaimed[step.id]) continue;
    const reward = OBJECTIVE_REWARDS[step.id];
    applyReward(save, reward);
    save.world.objectiveRewardsClaimed[step.id] = true;
    claims.push({
      id: step.id,
      title: step.title,
      summary: summarizeReward(reward)
    });
  }
  return claims;
}

function applyReward(save: GameSave, reward: ObjectiveReward): void {
  if (reward.inventory) addItems(save.player.inventory, reward.inventory);
  if (reward.storage) addItems(save.player.storage, reward.storage);
  if (reward.skillXp) {
    for (const [skillId, xp] of Object.entries(reward.skillXp) as [SkillId, number][]) {
      grantSkillXp(save, skillId, xp);
    }
  }
  if (reward.skillPoints) save.player.skillPoints += reward.skillPoints;
  if (reward.spirit) save.player.spirit = Math.min(100, save.player.spirit + reward.spirit);
  if (reward.coreHp) save.world.formationCoreHp = Math.min(150, save.world.formationCoreHp + reward.coreHp);
}

function summarizeReward(reward: ObjectiveReward): string {
  const parts: string[] = [];
  if (reward.inventory) parts.push(...Object.entries(reward.inventory).map(([id, count]) => `${id} x${count}`));
  if (reward.storage) parts.push(...Object.entries(reward.storage).map(([id, count]) => `${id} x${count} storage`));
  if (reward.skillXp) parts.push(...Object.entries(reward.skillXp).map(([id, xp]) => `${id} XP +${xp}`));
  if (reward.skillPoints) parts.push(`Skill point +${reward.skillPoints}`);
  if (reward.spirit) parts.push(`Spirit +${reward.spirit}`);
  if (reward.coreHp) parts.push(`Core +${reward.coreHp}`);
  return parts.join(', ');
}
