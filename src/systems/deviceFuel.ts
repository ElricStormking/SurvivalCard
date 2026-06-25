import type { DeviceId, GameSave, Inventory, ItemId } from '../types';
import { hasItems, removeItems } from './inventory';

export const DEVICE_FUEL_CAPACITY: Record<DeviceId, number> = {
  workbench: 0,
  cookingFire: 60,
  furnace: 90,
  alchemyFurnace: 80,
  talismanTable: 70
};

const FUEL_VALUES: Partial<Record<ItemId, number>> = {
  log: 36,
  resin: 28,
  spiritPaper: 18
};

const DEVICE_FUEL_ITEMS: Record<DeviceId, ItemId[]> = {
  workbench: [],
  cookingFire: ['log', 'resin'],
  furnace: ['log', 'resin'],
  alchemyFurnace: ['resin', 'log'],
  talismanTable: ['spiritPaper', 'resin']
};

export function deviceNeedsFuel(deviceId: DeviceId): boolean {
  return DEVICE_FUEL_CAPACITY[deviceId] > 0;
}

export function deviceFuelMax(deviceId: DeviceId): number {
  return DEVICE_FUEL_CAPACITY[deviceId];
}

export function deviceFuelText(save: GameSave, deviceId: DeviceId): string {
  if (!deviceNeedsFuel(deviceId)) return 'Fuel: none required';
  const current = Math.ceil(save.world.deviceFuel[deviceId] ?? 0);
  const max = DEVICE_FUEL_CAPACITY[deviceId];
  const accepted = DEVICE_FUEL_ITEMS[deviceId].join('/');
  return `Fuel: ${current}/${max}s (${accepted})`;
}

export function ensureDeviceFuel(save: GameSave, deviceId: DeviceId, minimumSeconds = 1): boolean {
  if (!deviceNeedsFuel(deviceId)) return true;
  if ((save.world.deviceFuel[deviceId] ?? 0) >= minimumSeconds) return true;
  return refuelDevice(save, deviceId);
}

export function consumeDeviceFuel(save: GameSave, deviceId: DeviceId, deltaSeconds: number): number {
  if (!deviceNeedsFuel(deviceId)) return deltaSeconds;
  if ((save.world.deviceFuel[deviceId] ?? 0) <= 0 && !refuelDevice(save, deviceId)) return 0;
  const available = Math.max(0, save.world.deviceFuel[deviceId] ?? 0);
  const consumed = Math.min(deltaSeconds, available);
  save.world.deviceFuel[deviceId] = available - consumed;
  return consumed;
}

export function refuelDevice(save: GameSave, deviceId: DeviceId): boolean {
  if (!deviceNeedsFuel(deviceId)) return true;
  const max = DEVICE_FUEL_CAPACITY[deviceId];
  if ((save.world.deviceFuel[deviceId] ?? 0) >= max) return true;
  const fuel = takeFuelItem(save, DEVICE_FUEL_ITEMS[deviceId]);
  if (!fuel) return false;
  save.world.deviceFuel[deviceId] = Math.min(max, (save.world.deviceFuel[deviceId] ?? 0) + fuel.seconds);
  return true;
}

export function fuelInventoryCostText(deviceId: DeviceId): string {
  if (!deviceNeedsFuel(deviceId)) return 'no fuel';
  return DEVICE_FUEL_ITEMS[deviceId].map((itemId) => `${itemId}+${FUEL_VALUES[itemId]}s`).join(', ');
}

function takeFuelItem(save: GameSave, items: ItemId[]): { itemId: ItemId; seconds: number } | undefined {
  for (const itemId of items) {
    if (takeOne(save.player.inventory, itemId)) return { itemId, seconds: FUEL_VALUES[itemId] ?? 0 };
    if (takeOne(save.player.storage, itemId)) return { itemId, seconds: FUEL_VALUES[itemId] ?? 0 };
  }
  return undefined;
}

function takeOne(inventory: Inventory, itemId: ItemId): boolean {
  if (!hasItems(inventory, { [itemId]: 1 })) return false;
  return removeItems(inventory, { [itemId]: 1 });
}
