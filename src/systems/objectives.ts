import type { GameSave } from '../types';

export interface ObjectiveStep {
  id: keyof GameSave['world']['objectives'];
  title: string;
  detail: string;
  done: boolean;
}

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
