import type { DeviceId, GameSave, Inventory } from '../types';
import { hasItems, removeItems } from './inventory';

export const DEVICE_CONDITION_MAX = 100;
const DEVICE_REPAIR_AMOUNT = 40;
const REPAIR_COST: Inventory = { repairKit: 1 };
const DEVICE_WEAR_PER_OUTPUT: Record<DeviceId, number> = {
  workbench: 3,
  cookingFire: 4,
  furnace: 5,
  alchemyFurnace: 5,
  talismanTable: 5
};

export function deviceConditionPercent(save: GameSave, deviceId: DeviceId): number {
  return Math.max(0, Math.min(DEVICE_CONDITION_MAX, save.world.deviceCondition[deviceId] ?? DEVICE_CONDITION_MAX));
}

export function deviceConditionState(save: GameSave, deviceId: DeviceId): 'stable' | 'worn' | 'damaged' | 'broken' {
  const condition = deviceConditionPercent(save, deviceId);
  if (condition <= 0) return 'broken';
  if (condition < 25) return 'damaged';
  if (condition < 60) return 'worn';
  return 'stable';
}

export function deviceWorkMultiplier(save: GameSave, deviceId: DeviceId): number {
  const state = deviceConditionState(save, deviceId);
  if (state === 'broken') return 0;
  if (state === 'damaged') return 0.5;
  if (state === 'worn') return 0.75;
  return 1;
}

export function deviceConditionText(save: GameSave, deviceId: DeviceId): string {
  const condition = Math.ceil(deviceConditionPercent(save, deviceId));
  const state = deviceConditionState(save, deviceId);
  const rate = Math.round(deviceWorkMultiplier(save, deviceId) * 100);
  return `Condition: ${condition}/${DEVICE_CONDITION_MAX} ${state} Work ${rate}%`;
}

export function applyDeviceWear(save: GameSave, deviceId: DeviceId): void {
  const current = deviceConditionPercent(save, deviceId);
  save.world.deviceCondition[deviceId] = Math.max(0, current - DEVICE_WEAR_PER_OUTPUT[deviceId]);
}

export function repairDeviceCondition(save: GameSave, deviceId: DeviceId): { ok: boolean; message: string; before: number; after: number } {
  const before = deviceConditionPercent(save, deviceId);
  if (before >= DEVICE_CONDITION_MAX) return { ok: false, message: 'Device condition already full.', before, after: before };
  if (!consumeRepairCost(save)) return { ok: false, message: 'Need repairKit x1.', before, after: before };
  const after = Math.min(DEVICE_CONDITION_MAX, before + DEVICE_REPAIR_AMOUNT);
  save.world.deviceCondition[deviceId] = after;
  return { ok: true, message: `Device repaired ${Math.ceil(before)} -> ${Math.ceil(after)}.`, before, after };
}

function consumeRepairCost(save: GameSave): boolean {
  if (hasItems(save.player.inventory, REPAIR_COST)) return removeItems(save.player.inventory, REPAIR_COST);
  if (hasItems(save.player.storage, REPAIR_COST)) return removeItems(save.player.storage, REPAIR_COST);
  return false;
}
