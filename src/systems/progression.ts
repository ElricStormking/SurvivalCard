import type { AttributeId, GameSave, PrototypeAffinityId, SkillId } from '../types';

export const XP_PER_LEVEL = 30;
const ATTRIBUTE_PROGRESS_PER_POINT = 0.35;
const AFFINITY_PROGRESS_PER_POINT = 0.025;

const PRACTICE_MAP: Record<SkillId, { attributes: AttributeId[]; affinities: PrototypeAffinityId[] }> = {
  sword: { attributes: ['strength', 'agility'], affinities: ['metal'] },
  gathering: { attributes: ['constitution', 'luck'], affinities: ['wood'] },
  crafting: { attributes: ['intelligence', 'luck'], affinities: ['fire', 'metal'] },
  swordQiSlash: { attributes: ['spirit', 'agility'], affinities: ['metal', 'light'] }
};

export function grantSkillXp(save: GameSave, skill: SkillId, amount: number): void {
  const state = save.player.skills[skill];
  state.xp += amount;
  grantPractice(save, skill, amount);
  while (state.xp >= state.level * XP_PER_LEVEL) {
    state.xp -= state.level * XP_PER_LEVEL;
    state.level += 1;
    save.player.skillPoints += 1;
  }
}

export function unlockSwordQiSlash(save: GameSave): boolean {
  if (save.player.skillPoints < 1 || save.player.skills.swordQiSlash.unlocked) return false;
  save.player.skillPoints -= 1;
  save.player.skills.swordQiSlash.unlocked = true;
  return true;
}

export function skillXpForNextLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function spendSkillPoint(save: GameSave, skill: SkillId): boolean {
  if (skill === 'swordQiSlash' && !save.player.skills.swordQiSlash.unlocked) return unlockSwordQiSlash(save);
  if (save.player.skillPoints < 1 || !save.player.skills[skill].unlocked) return false;
  save.player.skillPoints -= 1;
  save.player.skills[skill].level += 1;
  grantPractice(save, skill, skillXpForNextLevel(save.player.skills[skill].level) * 0.35);
  return true;
}

function grantPractice(save: GameSave, skill: SkillId, amount: number): void {
  const map = PRACTICE_MAP[skill];
  for (const attribute of map.attributes) {
    save.player.attributeProgress[attribute] += amount * ATTRIBUTE_PROGRESS_PER_POINT / map.attributes.length;
    while (save.player.attributeProgress[attribute] >= 100) {
      save.player.attributeProgress[attribute] -= 100;
      save.player.attributes[attribute] += 1;
    }
  }
  for (const affinity of map.affinities) {
    save.player.affinities[affinity] += amount * AFFINITY_PROGRESS_PER_POINT / map.affinities.length;
  }
}
