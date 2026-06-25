import Phaser from 'phaser';
import { EXPEDITIONS, EXPEDITION_ROUTE_IDS } from '../data/expeditions';
import { itemIconKey } from '../data/itemIcons';
import { DEVICE_NAMES, RECIPES } from '../data/recipes';
import { addItems, hasItems, inventoryText, removeItems } from '../systems/inventory';
import { canAcceptDeviceOutput, collectDeviceOutputs, deviceOutputCapacity, deviceOutputIsFull, deviceOutputUsed, handCraftRecipe, isHandCraftableRecipe, productionDurationSeconds, startRecipe } from '../systems/production';
import { playAudioCue } from '../systems/audio';
import { saveGame } from '../systems/save';
import { siegeThreatForecast } from '../systems/threatForecast';
import { latestNightEvent } from '../systems/nightEvents';
import { dailyCondition, conditionHudLine } from '../systems/dailyConditions';
import { equippedConditionLine, repairEquippedItem } from '../systems/maintenance';
import { deviceFuelText, deviceFuelMax, fuelInventoryCostText, refuelDevice } from '../systems/deviceFuel';
import { DEVICE_CONDITION_MAX, deviceConditionPercent, deviceConditionText, deviceWorkMultiplier, repairDeviceCondition } from '../systems/deviceCondition';
import { insightForNextBreakthrough, meditate, restUntilDawn, type CultivationResult } from '../systems/cultivation';
import { BasePlayScene } from './BasePlayScene';
import { GameStore } from '../state/GameStore';
import type { DeviceId, ExpeditionRouteId, Inventory, ItemId, RecipeId } from '../types';

const DEVICES: { id: DeviceId; x: number; y: number }[] = [
  { id: 'workbench', x: 500, y: 430 },
  { id: 'cookingFire', x: 650, y: 470 },
  { id: 'furnace', x: 820, y: 440 },
  { id: 'alchemyFurnace', x: 980, y: 500 },
  { id: 'talismanTable', x: 1120, y: 420 }
];

const DEVICE_ICON_ITEMS: Record<DeviceId, ItemId> = {
  workbench: 'woodenAxe',
  cookingFire: 'grilledMeat',
  furnace: 'ore',
  alchemyFurnace: 'medicine',
  talismanTable: 'spiritPaper'
};

const DEFENSE_MARKERS: { item: ItemId; key: keyof typeof GameStore.save.world.defenses; x: number; y: number; label: string }[] = [
  { item: 'barricade', key: 'barricade', x: 284, y: 510, label: 'Barricade' },
  { item: 'spikeTrap', key: 'spikeTrap', x: 406, y: 510, label: 'Spikes' },
  { item: 'fireTalismanTrap', key: 'fireTalismanTrap', x: 345, y: 574, label: 'Fire Seal' }
];

export class FarmScene extends BasePlayScene {
  private activeDevice?: DeviceId;
  private selectedRecipeIndex = 0;
  private devicePanel?: Phaser.GameObjects.Container;
  private lastDevicePanelRefresh = 0;
  private deviceOutputCounts!: Record<DeviceId, number>;
  private defenseDisplay?: Phaser.GameObjects.Container;
  private defenseSignature = '';
  private expeditionPanel?: Phaser.GameObjects.Container;
  private expeditionOpen = false;
  private expeditionMovementLock = false;
  private selectedRouteIndex = 0;
  private overviewPanel?: Phaser.GameObjects.Container;
  private overviewOpen = false;
  private overviewMovementLock = false;
  private lastOverviewPanelRefresh = 0;
  private cultivationPanel?: Phaser.GameObjects.Container;
  private cultivationOpen = false;
  private cultivationMovementLock = false;
  private nightEventSeenCount = 0;

  constructor() {
    super('FarmScene');
  }

  create(): void {
    GameStore.save.world.scene = 'farm';
    const condition = dailyCondition(GameStore.save);
    this.add.image(960, 700, 'farmBg').setDisplaySize(1920, 1920).setAlpha(0.72);
    this.add.rectangle(960, 720, 1800, 960, 0x172016, 0.22);
    this.add.rectangle(960, 700, 1920, 1400, condition.tint, condition.tintAlpha).setDepth(1_100);
    this.add.text(690, 250, 'Ruined Mountain Farm', { fontFamily: 'Georgia', fontSize: '30px', color: '#f1dfaa' }).setDepth(2_000);
    this.createPlayer();
    this.createControls();
    this.createHud();
    this.createFarmObjects();
    this.nightEventSeenCount = GameStore.save.world.nightEventLog.length;
    this.selectedRouteIndex = Math.max(0, EXPEDITION_ROUTE_IDS.indexOf(GameStore.save.world.expeditionRoute ?? 'pineForest'));
    this.deviceOutputCounts = this.snapshotDeviceOutputCounts();
    this.input.keyboard?.on('keydown-E', () => this.interact());
    this.input.keyboard?.on('keydown-UP', () => this.moveFarmMenuSelection(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveFarmMenuSelection(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmFarmMenu());
    this.input.keyboard?.on('keydown-P', () => this.pickupActiveDeviceOutputs());
    this.input.keyboard?.on('keydown-B', () => this.handCraftSelectedRecipe());
    this.input.keyboard?.on('keydown-H', () => this.refuelActiveDevice());
    this.input.keyboard?.on('keydown-J', () => this.repairActiveDevice());
    this.input.keyboard?.on('keydown-ESC', () => this.closeOpenFarmPanel());
    this.input.keyboard?.on('keydown-M', () => this.toggleExpeditionPanel());
    this.input.keyboard?.on('keydown-O', () => this.toggleOverviewPanel());
    this.input.keyboard?.on('keydown-C', () => this.toggleCultivationPanel());
    this.input.keyboard?.on('keydown-TAB', () => this.launchExpedition(GameStore.save.world.expeditionRoute ?? 'pineForest'));
    this.input.keyboard?.on('keydown-R', () => {
      if (this.cultivationOpen) {
        this.performCultivation('rest');
        return;
      }
      this.repairCore();
    });
    this.input.keyboard?.on('keydown-G', () => this.placeDefense());
    this.input.keyboard?.on('keydown-Y', () => this.repairEquippedGear());
    this.input.keyboard?.on('keydown-S', () => saveGame(GameStore.save));
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.detectCompletedProduction();
    this.detectNightEvent();
    this.updateDefenseDisplay();
    if (this.activeDevice && time - this.lastDevicePanelRefresh > 180) this.renderDevicePanel();
    if (this.overviewOpen && time - this.lastOverviewPanelRefresh > 500) this.renderOverviewPanel();
  }

  private createFarmObjects(): void {
    this.add.circle(345, 390, 54, 0x7fd6d1, 0.45).setStrokeStyle(3, 0xe9d78a).setDepth(390);
    this.add.text(292, 312, 'Formation Core', { fontFamily: 'Georgia', fontSize: '15px', color: '#fff0ba' }).setDepth(391);
    for (const device of DEVICES) {
      this.createDeviceStationCard(device);
      this.add.text(device.x, device.y - 52, DEVICE_NAMES[device.id], { fontFamily: 'Georgia', fontSize: '13px', color: '#f5e4b7' }).setOrigin(0.5).setDepth(device.y + 1);
    }
    this.updateDefenseDisplay(true);
  }

  private createDeviceStationCard(device: { id: DeviceId; x: number; y: number }): void {
    const container = this.add.container(device.x, device.y).setDepth(device.y);
    const iconKey = itemIconKey(DEVICE_ICON_ITEMS[device.id]);
    const shadow = this.add.ellipse(0, 34, 102, 19, 0x000000, 0.24);
    const bench = this.add.rectangle(0, 8, 100, 62, 0x3b2a1a, 0.9)
      .setStrokeStyle(2, 0xb89155, 0.98);
    const inset = this.add.rectangle(0, 4, 82, 42, 0x24170f, 0.68)
      .setStrokeStyle(1, 0x6f4f2b, 0.9);
    const icon = iconKey
      ? this.add.image(0, 0, iconKey).setDisplaySize(38, 38)
      : this.add.text(0, 0, DEVICE_NAMES[device.id].slice(0, 2), {
        fontFamily: 'Georgia',
        fontSize: '15px',
        color: '#fff0bd',
        stroke: '#21150c',
        strokeThickness: 3
      }).setOrigin(0.5);
    const glow = this.add.rectangle(0, -26, 58, 5, 0xf7dda2, 0.18);
    container.add([shadow, bench, inset, icon, glow]);
  }

  private interact(): void {
    if (this.activeDevice) {
      this.queueSelectedRecipe();
      return;
    }
    const nearest = DEVICES.find((device) => Phaser.Math.Distance.Between(this.player.x, this.player.y, device.x, device.y) < 120);
    if (!nearest) return;
    this.openDevicePanel(nearest.id);
  }

  private openDevicePanel(deviceId: DeviceId): void {
    if (this.overviewOpen) this.closeOverviewPanel();
    if (this.expeditionOpen) this.closeExpeditionPanel();
    if (this.cultivationOpen) this.closeCultivationPanel();
    this.activeDevice = deviceId;
    this.selectedRecipeIndex = 0;
    this.movementLocked = true;
    this.lastDevicePanelRefresh = 0;
    this.renderDevicePanel();
  }

  private closeDevicePanel(): void {
    this.activeDevice = undefined;
    this.movementLocked = false;
    this.devicePanel?.destroy(true);
    this.devicePanel = undefined;
  }

  private closeOpenFarmPanel(): void {
    if (this.cultivationOpen) {
      this.closeCultivationPanel();
      return;
    }
    if (this.overviewOpen) {
      this.closeOverviewPanel();
      return;
    }
    if (this.expeditionOpen) {
      this.closeExpeditionPanel();
      return;
    }
    this.closeDevicePanel();
  }

  private moveFarmMenuSelection(delta: number): void {
    if (this.expeditionOpen) {
      this.moveRouteSelection(delta);
      return;
    }
    this.moveRecipeSelection(delta);
  }

  private confirmFarmMenu(): void {
    if (this.cultivationOpen) {
      this.performCultivation('meditate');
      return;
    }
    if (this.expeditionOpen) {
      this.launchExpedition(EXPEDITION_ROUTE_IDS[this.selectedRouteIndex]);
      return;
    }
    this.queueSelectedRecipe();
  }

  private moveRecipeSelection(delta: number): void {
    if (!this.activeDevice) return;
    const recipes = this.availableRecipesForDevice(this.activeDevice);
    if (recipes.length === 0) return;
    this.selectedRecipeIndex = Phaser.Math.Wrap(this.selectedRecipeIndex + delta, 0, recipes.length);
    this.renderDevicePanel();
  }

  private queueSelectedRecipe(): void {
    if (!this.activeDevice) return;
    const recipe = this.availableRecipesForDevice(this.activeDevice)[this.selectedRecipeIndex];
    if (!recipe) return;
    const ok = startRecipe(GameStore.save, recipe.id);
    if (ok) playAudioCue('deviceQueued');
    this.flashDamage(this.player.x, this.player.y - 112, ok ? `Queued ${recipe.name}` : 'Missing materials, fuel, or queue full', ok ? '#dff0a8' : '#ff9f72');
    this.renderDevicePanel();
    if (this.overviewOpen) this.renderOverviewPanel();
  }

  private handCraftSelectedRecipe(): void {
    if (!this.activeDevice) return;
    const recipe = this.availableRecipesForDevice(this.activeDevice)[this.selectedRecipeIndex];
    if (!recipe) return;
    const ok = handCraftRecipe(GameStore.save, recipe.id);
    if (ok) {
      playAudioCue('deviceComplete', 0.5);
      saveGame(GameStore.save);
      this.updateHotbarHud();
    }
    const message = ok
      ? `Hand crafted ${recipe.name}`
      : isHandCraftableRecipe(recipe.id)
        ? 'Missing materials for hand craft'
        : `${recipe.name} needs a device queue`;
    this.flashDamage(this.player.x, this.player.y - 112, message, ok ? '#dff0a8' : '#ff9f72');
    this.renderDevicePanel();
    if (this.overviewOpen) this.renderOverviewPanel();
  }

  private toggleOverviewPanel(): void {
    if (this.overviewOpen) {
      this.closeOverviewPanel();
      return;
    }
    if (this.activeDevice) this.closeDevicePanel();
    if (this.expeditionOpen) this.closeExpeditionPanel();
    if (this.cultivationOpen) this.closeCultivationPanel();
    this.overviewOpen = true;
    this.overviewMovementLock = !this.movementLocked;
    if (this.overviewMovementLock) this.movementLocked = true;
    this.renderOverviewPanel();
  }

  private closeOverviewPanel(): void {
    this.overviewOpen = false;
    this.overviewPanel?.destroy(true);
    this.overviewPanel = undefined;
    if (this.overviewMovementLock) this.movementLocked = false;
    this.overviewMovementLock = false;
  }

  private renderOverviewPanel(): void {
    this.overviewPanel?.destroy(true);
    if (!this.overviewOpen) return;
    this.lastOverviewPanelRefresh = this.time.now;

    const save = GameStore.save;
    const forecast = siegeThreatForecast(save);
    const panel = this.add.container(318, 70).setScrollFactor(0).setDepth(10_076);
    const bg = this.add.rectangle(0, 0, 704, 506, 0x15100b, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xd0ad61, 0.92);
    const title = this.add.text(18, 14, 'Farm Overview', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#f8e7b8'
    });
    const help = this.add.text(18, 48, 'O close   E devices   M expedition map   F7 siege debug', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#cdbb91'
    });
    panel.add([bg, title, help]);

    this.addOverviewBlock(panel, 18, 82, 322, 164, 'Threat Forecast', [
      `${forecast.cyclePhase}  Day ${save.world.day}/15  Intel Tier ${forecast.revealTier}`,
      conditionHudLine(save),
      forecast.summary,
      this.nightEventOverviewLine(),
      ...forecast.waves.map((wave) => `- ${wave}`)
    ], '#f5e2b2');

    this.addOverviewBlock(panel, 364, 82, 322, 164, `Readiness: ${forecast.readiness.label} ${forecast.readiness.score}/100`, [
      ...forecast.readiness.notes,
      ...forecast.recommendations.slice(0, 2)
    ], forecast.readiness.score >= 60 ? '#dff0a8' : '#ffcf9c');

    const deviceLines = DEVICES.map((device) => this.deviceOverviewLine(device.id));
    this.addOverviewBlock(panel, 18, 266, 322, 206, 'Devices', deviceLines, '#d7c595');

    const storageLines = [
      this.storageOverviewLine(['log', 'stone', 'ore', 'herb']),
      this.storageOverviewLine(['meat', 'grilledMeat', 'herbSteak', 'medicine']),
      this.storageOverviewLine(['resin', 'spiritPaper', 'repairKit']),
      this.storageOverviewLine(['barricade', 'spikeTrap', 'fireTalismanTrap']),
      equippedConditionLine(save),
      `Route saved: ${EXPEDITIONS[save.world.expeditionRoute].name}`
    ];
    this.addOverviewBlock(panel, 364, 266, 322, 206, 'Storage & Route', storageLines, '#d7c595');

    this.overviewPanel = panel;
  }

  private addOverviewBlock(
    panel: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    lines: string[],
    lineColor: string
  ): void {
    const block = this.add.rectangle(x, y, width, height, 0x100c08, 0.48)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x4f3b22, 0.78);
    const header = this.add.text(x + 12, y + 10, title, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f8e7b8'
    });
    const body = this.add.text(x + 12, y + 38, lines.join('\n'), {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: lineColor,
      lineSpacing: 4,
      wordWrap: { width: width - 24 }
    });
    panel.add([block, header, body]);
  }

  private deviceOverviewLine(deviceId: DeviceId): string {
    const queue = GameStore.save.world.devices[deviceId];
    const current = queue[0];
    const outputs = GameStore.save.world.deviceOutputs[deviceId];
    const done = this.hasItems(outputs) ? ` Done ${inventoryText(outputs)}` : '';
    const fuel = deviceFuelMax(deviceId) > 0 ? ` ${deviceFuelText(GameStore.save, deviceId)}` : '';
    const outputLoad = ` Output ${deviceOutputUsed(GameStore.save, deviceId)}/${deviceOutputCapacity(deviceId)}`;
    const condition = ` Cond ${Math.ceil(deviceConditionPercent(GameStore.save, deviceId))}%`;
    if (!current) return `${DEVICE_NAMES[deviceId]}: idle${done}`;
    const progress = Math.round(((current.total - current.remaining) / current.total) * 100);
    const blocked = canAcceptDeviceOutput(GameStore.save, deviceId, RECIPES[current.recipeId].outputs) ? '' : ' Output full';
    const broken = deviceWorkMultiplier(GameStore.save, deviceId) <= 0 ? ' Broken' : '';
    return `${DEVICE_NAMES[deviceId]}: ${RECIPES[current.recipeId].name} ${Math.max(0, Math.ceil(current.remaining))}s ${progress}%${done}${fuel}${outputLoad}${condition}${blocked}${broken}`;
  }

  private nightEventOverviewLine(): string {
    const event = latestNightEvent(GameStore.save);
    if (!event) return 'Recent night: quiet.';
    return `Night ${event.day}: ${event.title} - ${event.effects.join(' ')}`;
  }

  private storageOverviewLine(items: ItemId[]): string {
    return items.map((itemId) => `${this.shortItemName(itemId)} ${this.availableCount(itemId)}`).join('  ');
  }

  private shortItemName(itemId: ItemId): string {
    const shortNames: Partial<Record<ItemId, string>> = {
      grilledMeat: 'G.Meat',
      herbSteak: 'Steak',
      spiritPaper: 'Paper',
      repairKit: 'Repair',
      spikeTrap: 'Spike',
      fireTalismanTrap: 'Fire',
      barricade: 'Barr'
    };
    return shortNames[itemId] ?? itemId;
  }

  private availableCount(itemId: ItemId): number {
    let total = (GameStore.save.player.inventory[itemId] ?? 0) + (GameStore.save.player.storage[itemId] ?? 0);
    for (const outputs of Object.values(GameStore.save.world.deviceOutputs)) total += outputs[itemId] ?? 0;
    return total;
  }

  private toggleCultivationPanel(): void {
    if (this.cultivationOpen) {
      this.closeCultivationPanel();
      return;
    }
    if (this.activeDevice) this.closeDevicePanel();
    if (this.expeditionOpen) this.closeExpeditionPanel();
    if (this.overviewOpen) this.closeOverviewPanel();
    this.cultivationOpen = true;
    this.cultivationMovementLock = !this.movementLocked;
    if (this.cultivationMovementLock) this.movementLocked = true;
    this.renderCultivationPanel();
  }

  private closeCultivationPanel(): void {
    this.cultivationOpen = false;
    this.cultivationPanel?.destroy(true);
    this.cultivationPanel = undefined;
    if (this.cultivationMovementLock) this.movementLocked = false;
    this.cultivationMovementLock = false;
  }

  private renderCultivationPanel(lastResult?: CultivationResult): void {
    this.cultivationPanel?.destroy(true);
    if (!this.cultivationOpen) return;
    const cultivation = GameStore.save.player.cultivation;
    const threshold = insightForNextBreakthrough(cultivation.breakthroughs);
    const ratio = Phaser.Math.Clamp(cultivation.insight / threshold, 0, 1);
    const panel = this.add.container(396, 118).setScrollFactor(0).setDepth(10_077);
    const bg = this.add.rectangle(0, 0, 488, 306, 0x15100b, 0.93)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xd0ad61, 0.92);
    const title = this.add.text(18, 16, 'Cultivation & Rest', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#f8e7b8'
    });
    const help = this.add.text(18, 50, 'Enter meditate 2h   R rest until dawn   Esc close', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#cdbb91'
    });
    const realm = this.add.text(18, 82, `${cultivation.realm}  Breakthroughs ${cultivation.breakthroughs}`, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f5e2b2'
    });
    const barBg = this.add.rectangle(18, 116, 452, 12, 0x24180f, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x5c4227, 0.9);
    const bar = this.add.rectangle(18, 116, 452 * ratio, 12, 0x80b7e6, 0.96).setOrigin(0, 0);
    const insight = this.add.text(18, 134, `Insight ${Math.floor(cultivation.insight)}/${threshold}  Skill points ${GameStore.save.player.skillPoints}`, {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#d7c595'
    });
    panel.add([bg, title, help, realm, barBg, bar, insight]);

    this.addCultivationAction(panel, 18, 168, 'Meditate 2 Hours', 'Gain insight, restore spirit, and let devices work.', () => this.performCultivation('meditate'));
    this.addCultivationAction(panel, 252, 168, 'Rest Until Dawn', 'Recover more HP and energy with lighter insight gain.', () => this.performCultivation('rest'));

    if (lastResult) {
      const outcome = [
        `${Math.round(lastResult.minutes)} min  Insight +${lastResult.insightGained}`,
        `HP +${Math.round(lastResult.hpRestored)}  Energy +${Math.round(lastResult.energyRestored)}  Spirit +${Math.round(lastResult.spiritRestored)}  Hunger -${Math.round(lastResult.hungerSpent)}`,
        lastResult.breakthrough ? 'Breakthrough: +1 skill point, regeneration improved.' : 'No breakthrough yet.'
      ];
      panel.add(this.add.text(18, 246, outcome.join('\n'), {
        fontFamily: 'Georgia',
        fontSize: '12px',
        color: lastResult.breakthrough ? '#dff0a8' : '#cdbb91',
        lineSpacing: 4,
        wordWrap: { width: 450 }
      }));
    }
    this.cultivationPanel = panel;
  }

  private addCultivationAction(
    panel: Phaser.GameObjects.Container,
    x: number,
    y: number,
    title: string,
    detail: string,
    action: () => void
  ): void {
    const card = this.add.rectangle(x, y, 216, 56, 0x241a11, 0.94)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x8f6a35, 0.92)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x + 12, y + 9, title, {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: '#f8e7b8'
    });
    const body = this.add.text(x + 12, y + 30, detail, {
      fontFamily: 'Georgia',
      fontSize: '10px',
      color: '#cdbb91',
      wordWrap: { width: 188 }
    });
    card.on('pointerdown', action);
    panel.add([card, label, body]);
  }

  private performCultivation(mode: 'meditate' | 'rest'): void {
    const result = mode === 'meditate' ? meditate(GameStore.save) : restUntilDawn(GameStore.save);
    this.player.setHp(GameStore.save.player.hp);
    playAudioCue(result.breakthrough ? 'skillSpend' : 'cast');
    saveGame(GameStore.save);
    this.flashDamage(this.player.x, this.player.y - 120, result.breakthrough ? 'Breakthrough' : `Insight +${result.insightGained}`, result.breakthrough ? '#dff0a8' : '#c7e5ff');
    this.renderCultivationPanel(result);
    this.refreshHud();
  }

  private toggleExpeditionPanel(): void {
    if (this.expeditionOpen) {
      this.closeExpeditionPanel();
      return;
    }
    if (this.activeDevice) this.closeDevicePanel();
    if (this.overviewOpen) this.closeOverviewPanel();
    if (this.cultivationOpen) this.closeCultivationPanel();
    this.expeditionOpen = true;
    this.expeditionMovementLock = !this.movementLocked;
    if (this.expeditionMovementLock) this.movementLocked = true;
    this.selectedRouteIndex = Math.max(0, EXPEDITION_ROUTE_IDS.indexOf(GameStore.save.world.expeditionRoute ?? 'pineForest'));
    this.renderExpeditionPanel();
  }

  private closeExpeditionPanel(): void {
    this.expeditionOpen = false;
    this.expeditionPanel?.destroy(true);
    this.expeditionPanel = undefined;
    if (this.expeditionMovementLock) this.movementLocked = false;
    this.expeditionMovementLock = false;
  }

  private moveRouteSelection(delta: number): void {
    this.selectedRouteIndex = Phaser.Math.Wrap(this.selectedRouteIndex + delta, 0, EXPEDITION_ROUTE_IDS.length);
    this.renderExpeditionPanel();
  }

  private launchExpedition(routeId: ExpeditionRouteId): void {
    GameStore.save.world.expeditionRoute = routeId;
    GameStore.save.world.expeditionStats[routeId].visits += 1;
    saveGame(GameStore.save);
    this.scene.start('ForestScene');
  }

  private renderExpeditionPanel(): void {
    this.expeditionPanel?.destroy(true);
    if (!this.expeditionOpen) return;

    const panel = this.add.container(386, 104).setScrollFactor(0).setDepth(10_075);
    const bg = this.add.rectangle(0, 0, 520, 332, 0x15100b, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xd0ad61, 0.92);
    const title = this.add.text(18, 16, 'Expedition Map', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#f8e7b8'
    });
    const help = this.add.text(18, 50, 'Up/Down select   Enter launch   Esc close   TAB quick-launch saved route', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#cdbb91'
    });
    panel.add([bg, title, help]);

    EXPEDITION_ROUTE_IDS.forEach((routeId, index) => {
      const route = EXPEDITIONS[routeId];
      const stats = GameStore.save.world.expeditionStats[routeId];
      const y = 86 + index * 104;
      const selected = index === this.selectedRouteIndex;
      const saved = GameStore.save.world.expeditionRoute === routeId;
      const row = this.add.rectangle(18, y, 484, 84, selected ? 0x4a351b : 0x241a11, 0.94)
        .setOrigin(0, 0)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0xf0ce78 : 0x5b4529, 0.95)
        .setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => {
        this.selectedRouteIndex = index;
        this.launchExpedition(routeId);
      });
      const iconItem: ItemId = routeId === 'ironRidge' ? 'ore' : 'log';
      const iconKey = itemIconKey(iconItem);
      const iconFrame = this.add.rectangle(46, y + 42, 52, 52, routeId === 'ironRidge' ? 0x35332b : 0x2b3a20, 0.95)
        .setStrokeStyle(1, 0xd8c17b, 0.95);
      const icon = iconKey
        ? this.add.image(46, y + 42, iconKey).setDisplaySize(42, 42)
        : this.add.text(46, y + 42, route.name.slice(0, 2), {
          fontFamily: 'Georgia',
          fontSize: '13px',
          color: '#fff0bd',
          stroke: '#21150c',
          strokeThickness: 2
        }).setOrigin(0.5);
      const name = this.add.text(86, y + 10, `${selected ? '> ' : '  '}${route.name}${saved ? '  Saved' : ''}`, {
        fontFamily: 'Georgia',
        fontSize: '16px',
        color: '#f8e7b8'
      });
      const subtitle = this.add.text(86, y + 35, route.subtitle, {
        fontFamily: 'Georgia',
        fontSize: '12px',
        color: '#d7c595',
        wordWrap: { width: 380 }
      });
      const threat = this.add.text(86, y + 62, `Threat: ${route.threat}`, {
        fontFamily: 'Georgia',
        fontSize: '11px',
        color: '#ffcf9c',
        wordWrap: { width: 250 }
      });
      const intel = this.add.text(350, y + 48, [
        `Visits ${stats.visits}`,
        `Extract ${stats.extractions}`,
        `Clear ${stats.clears}`
      ].join('\n'), {
        fontFamily: 'Georgia',
        fontSize: '11px',
        color: selected ? '#dff0a8' : '#bda978',
        align: 'right',
        lineSpacing: 2
      }).setOrigin(0, 0);
      panel.add([row, iconFrame, icon, name, subtitle, threat, intel]);
    });

    const selectedRoute = EXPEDITIONS[EXPEDITION_ROUTE_IDS[this.selectedRouteIndex]];
    panel.add(this.add.text(18, 302, `Selected route becomes your TAB quick-launch route: ${selectedRoute.name}`, {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#dff0a8'
    }));
    this.expeditionPanel = panel;
  }

  private pickupActiveDeviceOutputs(): void {
    if (!this.activeDevice) return;
    const outputs = GameStore.save.world.deviceOutputs[this.activeDevice];
    if (!this.hasItems(outputs)) {
      this.flashDamage(this.player.x, this.player.y - 112, 'No completed output', '#ffcf9c');
      return;
    }
    const collected = collectDeviceOutputs(GameStore.save, this.activeDevice);
    playAudioCue('outputPickup');
    saveGame(GameStore.save);
    this.deviceOutputCounts = this.snapshotDeviceOutputCounts();
    this.flashDamage(this.player.x, this.player.y - 112, `Picked up ${inventoryText(collected)}`, '#dff0a8');
    this.renderDevicePanel();
    if (this.overviewOpen) this.renderOverviewPanel();
  }

  private refuelActiveDevice(): void {
    if (!this.activeDevice) return;
    const beforeFuel = GameStore.save.world.deviceFuel[this.activeDevice] ?? 0;
    const ok = refuelDevice(GameStore.save, this.activeDevice);
    const afterFuel = GameStore.save.world.deviceFuel[this.activeDevice] ?? 0;
    const changed = afterFuel > beforeFuel;
    const message = changed
      ? `${DEVICE_NAMES[this.activeDevice]} fuel +${Math.ceil(afterFuel - beforeFuel)}s`
      : ok
        ? `${DEVICE_NAMES[this.activeDevice]} fuel full`
        : `No accepted fuel: ${fuelInventoryCostText(this.activeDevice)}`;
    this.flashDamage(this.player.x, this.player.y - 112, message, changed || ok ? '#dff0a8' : '#ff9f72');
    if (changed) playAudioCue('deviceQueued', 0.42);
    saveGame(GameStore.save);
    this.renderDevicePanel();
    if (this.overviewOpen) this.renderOverviewPanel();
  }

  private repairActiveDevice(): void {
    if (!this.activeDevice) return;
    const result = repairDeviceCondition(GameStore.save, this.activeDevice);
    this.flashDamage(this.player.x, this.player.y - 112, result.message, result.ok ? '#dff0a8' : '#ffcf9c');
    if (result.ok) {
      playAudioCue('deviceComplete', 0.45);
      saveGame(GameStore.save);
    }
    this.renderDevicePanel();
    if (this.overviewOpen) this.renderOverviewPanel();
  }

  private availableRecipesForDevice(deviceId: DeviceId) {
    return Object.values(RECIPES)
      .filter((candidate) => candidate.device === deviceId && GameStore.save.player.unlockedRecipes.includes(candidate.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private renderDevicePanel(): void {
    this.devicePanel?.destroy(true);
    if (!this.activeDevice) return;

    const recipes = this.availableRecipesForDevice(this.activeDevice);
    this.lastDevicePanelRefresh = this.time.now;
    const queue = GameStore.save.world.devices[this.activeDevice];
    const outputs = GameStore.save.world.deviceOutputs[this.activeDevice];
    const outputUsed = deviceOutputUsed(GameStore.save, this.activeDevice);
    const outputCapacity = deviceOutputCapacity(this.activeDevice);
    const outputFull = deviceOutputIsFull(GameStore.save, this.activeDevice);
    const panel = this.add.container(735, 92).setScrollFactor(0).setDepth(10_050);
    const bg = this.add.rectangle(0, 0, 560, 460, 0x17120d, 0.88)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xd0ad61, 0.9);
    const title = this.add.text(18, 16, DEVICE_NAMES[this.activeDevice], {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#f8e7b8'
    });
    const help = this.add.text(18, 48, 'Up/Down select   Enter/E queue   B hand   H fuel   J repair   P pickup   Esc close', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#cdbb91'
    });
    panel.add([bg, title, help]);

    panel.add(this.add.text(18, 80, `Production Queue ${queue.length}/3   ${deviceFuelText(GameStore.save, this.activeDevice)}`, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f8e7b8'
    }));
    panel.add(this.add.text(18, 99, `Accepted fuel: ${fuelInventoryCostText(this.activeDevice)}`, {
      fontFamily: 'Georgia',
      fontSize: '11px',
      color: '#bba77a'
    }));
    panel.add(this.add.text(300, 99, deviceConditionText(GameStore.save, this.activeDevice), {
      fontFamily: 'Georgia',
      fontSize: '11px',
      color: deviceWorkMultiplier(GameStore.save, this.activeDevice) <= 0 ? '#ff9f72' : '#bba77a'
    }));
    if (deviceFuelMax(this.activeDevice) > 0) {
      const maxFuel = deviceFuelMax(this.activeDevice);
      const fuelRatio = Phaser.Math.Clamp((GameStore.save.world.deviceFuel[this.activeDevice] ?? 0) / maxFuel, 0, 1);
      const fuelColor = fuelRatio <= 0 ? 0x9c3e31 : fuelRatio < 0.3 ? 0xb9782f : 0xd0ad61;
      const fuelBg = this.add.rectangle(18, 115, 220, 8, 0x100b07, 0.94)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x594224);
      const fuelBar = this.add.rectangle(18, 115, 220 * fuelRatio, 8, fuelColor, 0.96)
        .setOrigin(0, 0.5);
      panel.add([fuelBg, fuelBar]);
    }
    const conditionRatio = Phaser.Math.Clamp(deviceConditionPercent(GameStore.save, this.activeDevice) / DEVICE_CONDITION_MAX, 0, 1);
    const conditionColor = conditionRatio <= 0 ? 0x9c3e31 : conditionRatio < 0.25 ? 0xb24d36 : conditionRatio < 0.6 ? 0xb9782f : 0xaed083;
    const conditionBg = this.add.rectangle(300, 115, 220, 8, 0x100b07, 0.94)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x594224);
    const conditionBar = this.add.rectangle(300, 115, 220 * conditionRatio, 8, conditionColor, 0.96)
      .setOrigin(0, 0.5);
    panel.add([conditionBg, conditionBar]);

    for (let index = 0; index < 3; index += 1) {
      const entry = queue[index];
      const y = 132 + index * 34;
      const row = this.add.rectangle(18, y, 524, 30, 0x21170f, 0.86)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x4d3922);
      panel.add(row);

      if (!entry) {
        panel.add(this.add.text(30, y + 8, `Slot ${index + 1}: empty`, {
          fontFamily: 'Georgia',
          fontSize: '12px',
          color: '#7f715c'
        }));
        continue;
      }

      const recipe = RECIPES[entry.recipeId];
      const progress = Phaser.Math.Clamp((entry.total - Math.max(0, entry.remaining)) / entry.total, 0, 1);
      const outOfFuel = index === 0 && deviceFuelMax(this.activeDevice) > 0 && (GameStore.save.world.deviceFuel[this.activeDevice] ?? 0) <= 0;
      const outputBlocked = index === 0 && !canAcceptDeviceOutput(GameStore.save, this.activeDevice, recipe.outputs);
      const broken = index === 0 && deviceWorkMultiplier(GameStore.save, this.activeDevice) <= 0;
      const status = index === 0 ? (broken ? 'Broken' : outputBlocked ? 'Output full' : outOfFuel ? 'No fuel' : `${Math.ceil(Math.max(0, entry.remaining))}s`) : 'Waiting';
      const barBg = this.add.rectangle(230, y + 18, 190, 8, 0x100b07, 0.95)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x594224);
      const bar = this.add.rectangle(230, y + 18, 190 * progress, 8, 0xd0ad61, 0.95)
        .setOrigin(0, 0.5);
      const label = this.add.text(30, y + 7, `${recipe.name}`, {
        fontFamily: 'Georgia',
        fontSize: '12px',
        color: '#f5e2b2'
      });
      const state = this.add.text(432, y + 7, status, {
        fontFamily: 'Georgia',
        fontSize: '12px',
        color: outOfFuel || outputBlocked || broken ? '#ff9f72' : '#e5d1a1'
      });
      panel.add([barBg, bar, label, state]);
    }

    const outputY = 246;
    panel.add(this.add.text(18, outputY - 24, `Completed Output ${outputUsed}/${outputCapacity}`, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: outputFull ? '#ffcf9c' : '#f8e7b8'
    }));
    const outputFill = outputFull ? 0x4b2419 : this.hasItems(outputs) ? 0x25351e : 0x21170f;
    const outputStroke = outputFull ? 0xd78b5f : this.hasItems(outputs) ? 0xaed083 : 0x4d3922;
    const outputRow = this.add.rectangle(18, outputY, 524, 38, outputFill, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1, outputStroke)
      .setInteractive({ useHandCursor: this.hasItems(outputs) });
    panel.add(outputRow);
    const outputEntries = Object.entries(outputs).filter(([, count]) => (count ?? 0) > 0) as [ItemId, number][];
    outputEntries.slice(0, 6).forEach(([itemId, count], index) => {
      const x = 32 + index * 34;
      const iconKey = itemIconKey(itemId);
      const backing = this.add.rectangle(x, outputY + 19, 26, 26, 0x1d160f, 0.9)
        .setStrokeStyle(1, 0xaed083, 0.75);
      const icon = iconKey
        ? this.add.image(x, outputY + 19, iconKey).setDisplaySize(22, 22)
        : this.add.text(x, outputY + 19, itemId.slice(0, 2).toUpperCase(), {
          fontFamily: 'Georgia',
          fontSize: '10px',
          color: '#fff0bd',
          stroke: '#21150c',
          strokeThickness: 2
        }).setOrigin(0.5);
      const badge = this.add.text(x + 11, outputY + 29, String(count), {
        fontFamily: 'Georgia',
        fontSize: '9px',
        color: '#f6deb0',
        stroke: '#21150c',
        strokeThickness: 2
      }).setOrigin(1, 1);
      panel.add([backing, icon, badge]);
    });
    const outputTextX = this.hasItems(outputs) ? 42 + Math.min(outputEntries.length, 6) * 34 : 30;
    const outputMessage = this.hasItems(outputs)
      ? `${outputFull ? 'Full' : 'Done'}: ${inventoryText(outputs)}   Click or press P to pick up`
      : 'Done: empty';
    const outputText = this.add.text(outputTextX, outputY + 10, outputMessage, {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: outputFull ? '#ffcf9c' : this.hasItems(outputs) ? '#dff0a8' : '#7f715c'
    });
    outputRow.on('pointerdown', () => this.pickupActiveDeviceOutputs());
    panel.add(outputText);

    panel.add(this.add.text(18, 302, 'Recipes', {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f8e7b8'
    }));

    recipes.forEach((recipe, index) => {
      const col = index % 2;
      const rowIndex = Math.floor(index / 2);
      const x = 18 + col * 262;
      const y = 330 + rowIndex * 58;
      const selected = index === this.selectedRecipeIndex;
      const row = this.add.rectangle(x, y, 252, 48, selected ? 0x4a351b : 0x241a11, 0.94)
        .setOrigin(0, 0)
        .setStrokeStyle(1, selected ? 0xf0ce78 : 0x5b4529);
      const inputText = Object.entries(recipe.inputs).map(([id, count]) => `${id}x${count}`).join(', ');
      const outputText = Object.entries(recipe.outputs).map(([id, count]) => `${id}x${count}`).join(', ');
      const effectiveSeconds = productionDurationSeconds(GameStore.save, recipe.id);
      const baseHint = effectiveSeconds < recipe.seconds ? ` (${recipe.seconds}s base)` : '';
      const handHint = isHandCraftableRecipe(recipe.id) ? '  Hand' : '';
      const label = this.add.text(x + 14, y + 6, `${selected ? '> ' : '  '}${recipe.name}  ${effectiveSeconds}s${baseHint}${handHint}`, {
        fontFamily: 'Georgia',
        fontSize: '14px',
        color: '#f5e2b2'
      });
      const detail = this.add.text(x + 14, y + 28, `${inputText}  ->  ${outputText}`, {
        fontFamily: 'Georgia',
        fontSize: '12px',
        color: '#cdbb91',
        wordWrap: { width: 224 }
      });
      panel.add([row, label, detail]);
    });

    if (recipes.length === 0) {
      panel.add(this.add.text(18, 330, 'No unlocked recipes for this device yet.', {
        fontFamily: 'Georgia',
        fontSize: '16px',
        color: '#ffcf9c'
      }));
    }

    this.devicePanel = panel;
  }

  private hasItems(inventory: Inventory): boolean {
    return Object.values(inventory).some((count) => (count ?? 0) > 0);
  }

  private placeDefense(): void {
    const order: { item: RecipeId; key: keyof typeof GameStore.save.world.defenses }[] = [
      { item: 'barricade', key: 'barricade' },
      { item: 'spikeTrap', key: 'spikeTrap' },
      { item: 'fireTalismanTrap', key: 'fireTalismanTrap' }
    ];
    for (const option of order) {
      if (hasItems(GameStore.save.player.inventory, { [option.item]: 1 })) {
        removeItems(GameStore.save.player.inventory, { [option.item]: 1 });
        GameStore.save.world.defenses[option.key] += 1;
        GameStore.save.world.objectives.placedDefense = true;
        playAudioCue('deviceQueued');
        this.updateDefenseDisplay(true);
        if (this.overviewOpen) this.renderOverviewPanel();
        return;
      }
      if (hasItems(GameStore.save.player.storage, { [option.item]: 1 })) {
        removeItems(GameStore.save.player.storage, { [option.item]: 1 });
        GameStore.save.world.defenses[option.key] += 1;
        GameStore.save.world.objectives.placedDefense = true;
        playAudioCue('deviceQueued');
        this.updateDefenseDisplay(true);
        if (this.overviewOpen) this.renderOverviewPanel();
        return;
      }
    }
  }

  private repairCore(): void {
    if (removeItems(GameStore.save.player.inventory, { repairKit: 1 }) || removeItems(GameStore.save.player.storage, { repairKit: 1 })) {
      GameStore.save.world.formationCoreHp = Math.min(150, GameStore.save.world.formationCoreHp + 35);
      playAudioCue('deviceComplete');
      if (this.overviewOpen) this.renderOverviewPanel();
    }
  }

  private repairEquippedGear(): void {
    const result = repairEquippedItem(GameStore.save);
    this.flashDamage(this.player.x, this.player.y - 122, result.message, result.ok ? '#dff0a8' : '#ffcf9c');
    if (result.ok) playAudioCue('deviceComplete');
    saveGame(GameStore.save);
    this.updateHotbarHud();
    if (this.overviewOpen) this.renderOverviewPanel();
  }

  private detectCompletedProduction(): void {
    const nextCounts = this.snapshotDeviceOutputCounts();
    for (const device of DEVICES) {
      if (nextCounts[device.id] > (this.deviceOutputCounts[device.id] ?? 0)) {
        playAudioCue('deviceComplete');
        this.flashDamage(device.x, device.y - 80, 'Done', '#dff0a8');
      }
    }
    this.deviceOutputCounts = nextCounts;
  }

  private detectNightEvent(): void {
    const count = GameStore.save.world.nightEventLog.length;
    if (count <= this.nightEventSeenCount) return;
    this.nightEventSeenCount = count;
    const event = latestNightEvent(GameStore.save);
    if (!event) return;
    playAudioCue(event.id === 'wanderingGhost' ? 'siegeWave' : 'uiOpen', event.id === 'wanderingGhost' ? 0.55 : 0.45);
    this.flashDamage(this.player.x, this.player.y - 132, `${event.title}: ${event.effects[0]}`, event.id === 'moonlitHerb' || event.id === 'woundedTraveler' ? '#dff0a8' : '#ffcf9c');
    if (this.overviewOpen) this.renderOverviewPanel();
  }

  private snapshotDeviceOutputCounts(): Record<DeviceId, number> {
    return DEVICES.reduce((counts, device) => {
      counts[device.id] = Object.values(GameStore.save.world.deviceOutputs[device.id]).reduce((sum, count) => sum + (count ?? 0), 0);
      return counts;
    }, {} as Record<DeviceId, number>);
  }

  private updateDefenseDisplay(force = false): void {
    const defenses = GameStore.save.world.defenses;
    const signature = `${defenses.barricade}:${defenses.spikeTrap}:${defenses.fireTalismanTrap}`;
    if (!force && signature === this.defenseSignature) return;
    this.defenseSignature = signature;
    this.defenseDisplay?.destroy(true);
    const display = this.add.container(0, 0).setDepth(602);

    DEFENSE_MARKERS.forEach((marker) => {
      const count = defenses[marker.key];
      const markerCard = this.createDefenseMarker(marker, count);
      display.add(markerCard);
    });

    this.defenseDisplay = display;
  }

  private createDefenseMarker(marker: typeof DEFENSE_MARKERS[number], count: number): Phaser.GameObjects.Container {
    const container = this.add.container(marker.x, marker.y).setDepth(marker.y + 10);
    const iconKey = itemIconKey(marker.item);
    const active = count > 0;
    const frameColor = active ? 0xe7c76f : 0x6c5636;
    const fillColor = marker.item === 'barricade' ? 0x49331d : marker.item === 'spikeTrap' ? 0x2f3028 : 0x4b2419;
    const shadow = this.add.ellipse(0, 22, 74, 15, 0x000000, 0.26);
    const frame = this.add.rectangle(0, -4, 62, 58, fillColor, active ? 0.9 : 0.42)
      .setStrokeStyle(active ? 2 : 1, frameColor, active ? 0.98 : 0.55);
    const icon = iconKey
      ? this.add.image(0, -10, iconKey).setDisplaySize(33, 33).setAlpha(active ? 0.95 : 0.38)
      : this.add.text(0, -10, marker.label.slice(0, 2), {
        fontFamily: 'Georgia',
        fontSize: '13px',
        color: '#fff0bd',
        stroke: '#21150c',
        strokeThickness: 2
      }).setOrigin(0.5).setAlpha(active ? 1 : 0.4);
    const countText = this.add.text(24, 18, String(count), {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: active ? '#fff0bd' : '#8e7f67',
      stroke: '#21150c',
      strokeThickness: 3
    }).setOrigin(1, 1);
    const label = this.add.text(0, 36, marker.label, {
      fontFamily: 'Georgia',
      fontSize: '10px',
      color: active ? '#f4e4b3' : '#8e7f67',
      stroke: '#21150c',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add([shadow, frame, icon, countText, label]);
    return container;
  }

  protected refreshHud(): void {
    super.refreshHud();
    const save = GameStore.save;
    const queues = Object.entries(save.world.devices).flatMap(([id, queue]) => {
      const first = queue[0];
      const output = save.world.deviceOutputs[id as DeviceId];
      if (!first && !this.hasItems(output)) return [];
      return [`${DEVICE_NAMES[id as DeviceId]}: ${first ? `${first.recipeId} ${Math.ceil(first.remaining)}s` : 'ready'}${this.hasItems(output) ? `  Done ${inventoryText(output)}` : ''}`];
    });
    const deviceLine = this.activeDevice ? `Device UI open: ${DEVICE_NAMES[this.activeDevice]}. Up/Down select, Enter queue, B hand craft, H fuel, J repair, P pickup, Esc close.` : 'TAB Expedition. Right Click/Ctrl Dodge. M Map. O Overview. C Cultivate. E Device/Craft. I Inventory. K Skills. 1-8 Hotbar. G Defense. R Repair core. Y Repair gear. F7 Siege.';
    this.prompt.setText([
      `Core ${Math.ceil(save.world.formationCoreHp)}/150  Defenses B${save.world.defenses.barricade} S${save.world.defenses.spikeTrap} F${save.world.defenses.fireTalismanTrap}`,
      deviceLine,
      conditionHudLine(save),
      equippedConditionLine(save),
      this.nightEventOverviewLine(),
      `Storage: ${inventoryText(save.player.storage)}`,
      ...queues
    ].join('\n'));
  }
}
