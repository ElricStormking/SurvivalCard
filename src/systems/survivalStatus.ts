import type { GameSave } from '../types';
import { encumbrance } from './encumbrance';

export interface SurvivalStatusSnapshot {
  labels: string[];
  movementMultiplier: number;
  outgoingDamageMultiplier: number;
  incomingDamageMultiplier: number;
  warningLine: string;
}

export function survivalStatus(save: GameSave, hp = save.player.hp): SurvivalStatusSnapshot {
  const labels: string[] = [];
  let movementMultiplier = 1;
  let outgoingDamageMultiplier = 1;
  let incomingDamageMultiplier = 1;
  const carry = encumbrance(save);

  if (save.player.hunger <= 0) {
    labels.push('Starving');
    movementMultiplier *= 0.82;
    outgoingDamageMultiplier *= 0.82;
    incomingDamageMultiplier *= 1.12;
  } else if (save.player.hunger < 25) {
    labels.push('Ravenous');
    movementMultiplier *= 0.9;
    outgoingDamageMultiplier *= 0.92;
  } else if (save.player.hunger >= 75) {
    labels.push('Well fed');
  }

  if (save.player.energy < 15) {
    labels.push('Exhausted');
    movementMultiplier *= 0.88;
    outgoingDamageMultiplier *= 0.9;
  }

  if (hp > 0 && hp < 25) {
    labels.push('Wounded');
    movementMultiplier *= 0.9;
    incomingDamageMultiplier *= 1.08;
  }

  if (carry.label === 'Encumbered' || carry.label === 'Overloaded') {
    labels.push(carry.label);
    movementMultiplier *= carry.movementMultiplier;
    outgoingDamageMultiplier *= carry.label === 'Overloaded' ? 0.9 : 0.96;
  } else if (carry.label === 'Loaded') {
    movementMultiplier *= carry.movementMultiplier;
  }

  const roundedMove = round2(Math.max(0.62, movementMultiplier));
  const roundedDamage = round2(Math.max(0.6, outgoingDamageMultiplier));
  const roundedIncoming = round2(Math.max(1, incomingDamageMultiplier));

  return {
    labels,
    movementMultiplier: roundedMove,
    outgoingDamageMultiplier: roundedDamage,
    incomingDamageMultiplier: roundedIncoming,
    warningLine: labels.length
      ? `Condition: ${labels.join(', ')}  Move x${roundedMove.toFixed(2)}  Damage x${roundedDamage.toFixed(2)}`
      : 'Condition: Stable'
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
