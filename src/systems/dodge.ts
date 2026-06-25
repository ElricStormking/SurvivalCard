import { TUNING } from '../data/tuning';
import type { GameSave } from '../types';
import { encumbrance } from './encumbrance';
import { survivalStatus } from './survivalStatus';

export interface DodgeProfile {
  canDodge: boolean;
  reason?: string;
  energyCost: number;
  cooldownMs: number;
  invulnerabilityMs: number;
  distance: number;
}

export function dodgeProfile(save: GameSave, hp = save.player.hp): DodgeProfile {
  const energyCost = TUNING.dodge.energyCost;
  const status = survivalStatus(save, hp);
  const carry = encumbrance(save);
  const agilityBonus = Math.max(0, save.player.attributes.agility - 1) * TUNING.dodge.agilityDistanceBonus;
  const exhaustedMultiplier = save.player.energy < energyCost ? TUNING.dodge.exhaustedDistanceMultiplier : 1;
  const distance = Math.round((TUNING.dodge.baseDistance + agilityBonus) * status.movementMultiplier * carry.dodgeMultiplier * exhaustedMultiplier);
  if (save.player.energy < energyCost) {
    return {
      canDodge: false,
      reason: 'Too exhausted to dodge',
      energyCost,
      cooldownMs: TUNING.dodge.cooldownMs,
      invulnerabilityMs: TUNING.dodge.invulnerabilityMs,
      distance
    };
  }
  return {
    canDodge: true,
    energyCost,
    cooldownMs: TUNING.dodge.cooldownMs,
    invulnerabilityMs: TUNING.dodge.invulnerabilityMs,
    distance
  };
}
