import Phaser from 'phaser';
import { itemIconKey } from '../data/itemIcons';
import { DEVICE_NAMES, RECIPES } from '../data/recipes';
import { addItems, hasItems, inventoryText, removeItems } from '../systems/inventory';
import { collectDeviceOutputs, startRecipe } from '../systems/production';
import { saveGame } from '../systems/save';
import { BasePlayScene } from './BasePlayScene';
import { GameStore } from '../state/GameStore';
import type { DeviceId, Inventory, ItemId, RecipeId } from '../types';

const DEVICES: { id: DeviceId; x: number; y: number }[] = [
  { id: 'workbench', x: 500, y: 430 },
  { id: 'cookingFire', x: 650, y: 470 },
  { id: 'furnace', x: 820, y: 440 },
  { id: 'alchemyFurnace', x: 980, y: 500 },
  { id: 'talismanTable', x: 1120, y: 420 }
];

export class FarmScene extends BasePlayScene {
  private activeDevice?: DeviceId;
  private selectedRecipeIndex = 0;
  private devicePanel?: Phaser.GameObjects.Container;
  private lastDevicePanelRefresh = 0;

  constructor() {
    super('FarmScene');
  }

  create(): void {
    GameStore.save.world.scene = 'farm';
    this.add.image(960, 700, 'farmBg').setDisplaySize(1920, 1920).setAlpha(0.72);
    this.add.rectangle(960, 720, 1800, 960, 0x172016, 0.22);
    this.add.text(690, 250, 'Ruined Mountain Farm', { fontFamily: 'Georgia', fontSize: '30px', color: '#f1dfaa' }).setDepth(2_000);
    this.createPlayer();
    this.createControls();
    this.createHud();
    this.createFarmObjects();
    this.input.keyboard?.on('keydown-E', () => this.interact());
    this.input.keyboard?.on('keydown-UP', () => this.moveRecipeSelection(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveRecipeSelection(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.queueSelectedRecipe());
    this.input.keyboard?.on('keydown-P', () => this.pickupActiveDeviceOutputs());
    this.input.keyboard?.on('keydown-ESC', () => this.closeDevicePanel());
    this.input.keyboard?.on('keydown-TAB', () => this.scene.start('ForestScene'));
    this.input.keyboard?.on('keydown-R', () => this.repairCore());
    this.input.keyboard?.on('keydown-G', () => this.placeDefense());
    this.input.keyboard?.on('keydown-S', () => saveGame(GameStore.save));
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.activeDevice && time - this.lastDevicePanelRefresh > 180) this.renderDevicePanel();
  }

  private createFarmObjects(): void {
    this.add.circle(345, 390, 54, 0x7fd6d1, 0.45).setStrokeStyle(3, 0xe9d78a).setDepth(390);
    this.add.text(292, 312, 'Formation Core', { fontFamily: 'Georgia', fontSize: '15px', color: '#fff0ba' }).setDepth(391);
    for (const device of DEVICES) {
      this.add.rectangle(device.x, device.y, 92, 62, 0x3b2a1a, 0.9).setStrokeStyle(2, 0xb89155).setDepth(device.y);
      this.add.text(device.x, device.y - 52, DEVICE_NAMES[device.id], { fontFamily: 'Georgia', fontSize: '13px', color: '#f5e4b7' }).setOrigin(0.5).setDepth(device.y + 1);
    }
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
    this.flashDamage(this.player.x, this.player.y - 112, ok ? `Queued ${recipe.name}` : 'Missing materials or queue full', ok ? '#dff0a8' : '#ff9f72');
    this.renderDevicePanel();
  }

  private pickupActiveDeviceOutputs(): void {
    if (!this.activeDevice) return;
    const outputs = GameStore.save.world.deviceOutputs[this.activeDevice];
    if (!this.hasItems(outputs)) {
      this.flashDamage(this.player.x, this.player.y - 112, 'No completed output', '#ffcf9c');
      return;
    }
    const collected = collectDeviceOutputs(GameStore.save, this.activeDevice);
    saveGame(GameStore.save);
    this.flashDamage(this.player.x, this.player.y - 112, `Picked up ${inventoryText(collected)}`, '#dff0a8');
    this.renderDevicePanel();
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
    const panel = this.add.container(735, 92).setScrollFactor(0).setDepth(10_050);
    const bg = this.add.rectangle(0, 0, 560, 460, 0x17120d, 0.88)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xd0ad61, 0.9);
    const title = this.add.text(18, 16, DEVICE_NAMES[this.activeDevice], {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#f8e7b8'
    });
    const help = this.add.text(18, 48, 'Up/Down select   Enter/E queue   P pickup   Esc close', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#cdbb91'
    });
    panel.add([bg, title, help]);

    panel.add(this.add.text(18, 80, `Production Queue ${queue.length}/3`, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f8e7b8'
    }));

    for (let index = 0; index < 3; index += 1) {
      const entry = queue[index];
      const y = 108 + index * 38;
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
      const status = index === 0 ? `${Math.ceil(Math.max(0, entry.remaining))}s` : 'Waiting';
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
        color: '#e5d1a1'
      });
      panel.add([barBg, bar, label, state]);
    }

    const outputY = 232;
    panel.add(this.add.text(18, outputY - 24, 'Completed Output', {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f8e7b8'
    }));
    const outputRow = this.add.rectangle(18, outputY, 524, 38, this.hasItems(outputs) ? 0x25351e : 0x21170f, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1, this.hasItems(outputs) ? 0xaed083 : 0x4d3922)
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
    const outputText = this.add.text(outputTextX, outputY + 10, this.hasItems(outputs) ? `Done: ${inventoryText(outputs)}   Click or press P to pick up` : 'Done: empty', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: this.hasItems(outputs) ? '#dff0a8' : '#7f715c'
    });
    outputRow.on('pointerdown', () => this.pickupActiveDeviceOutputs());
    panel.add(outputText);

    panel.add(this.add.text(18, 290, 'Recipes', {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f8e7b8'
    }));

    recipes.forEach((recipe, index) => {
      const col = index % 2;
      const rowIndex = Math.floor(index / 2);
      const x = 18 + col * 262;
      const y = 318 + rowIndex * 58;
      const selected = index === this.selectedRecipeIndex;
      const row = this.add.rectangle(x, y, 252, 48, selected ? 0x4a351b : 0x241a11, 0.94)
        .setOrigin(0, 0)
        .setStrokeStyle(1, selected ? 0xf0ce78 : 0x5b4529);
      const inputText = Object.entries(recipe.inputs).map(([id, count]) => `${id}x${count}`).join(', ');
      const outputText = Object.entries(recipe.outputs).map(([id, count]) => `${id}x${count}`).join(', ');
      const label = this.add.text(x + 14, y + 6, `${selected ? '> ' : '  '}${recipe.name}  ${recipe.seconds}s`, {
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
      panel.add(this.add.text(18, 318, 'No unlocked recipes for this device yet.', {
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
        return;
      }
      if (hasItems(GameStore.save.player.storage, { [option.item]: 1 })) {
        removeItems(GameStore.save.player.storage, { [option.item]: 1 });
        GameStore.save.world.defenses[option.key] += 1;
        GameStore.save.world.objectives.placedDefense = true;
        return;
      }
    }
  }

  private repairCore(): void {
    if (removeItems(GameStore.save.player.inventory, { repairKit: 1 }) || removeItems(GameStore.save.player.storage, { repairKit: 1 })) {
      GameStore.save.world.formationCoreHp = Math.min(150, GameStore.save.world.formationCoreHp + 35);
    }
  }

  protected refreshHud(): void {
    super.refreshHud();
    const save = GameStore.save;
    const queues = Object.entries(save.world.devices).map(([id, queue]) => {
      const first = queue[0];
      const output = save.world.deviceOutputs[id as DeviceId];
      return `${DEVICE_NAMES[id as DeviceId]}: ${first ? `${first.recipeId} ${Math.ceil(first.remaining)}s` : 'idle'}${this.hasItems(output) ? `  Done ${inventoryText(output)}` : ''}`;
    });
    const deviceLine = this.activeDevice ? `Device UI open: ${DEVICE_NAMES[this.activeDevice]}. Up/Down select, Enter queue, P pickup, Esc close.` : 'TAB Forest. E Device/Craft. I Inventory. K Skills. 1-8 Hotbar. G Defense. R Repair. F7 Siege. Stand near device and press E to open recipes.';
    this.prompt.setText([
      `Core ${Math.ceil(save.world.formationCoreHp)}/150  Defenses B${save.world.defenses.barricade} S${save.world.defenses.spikeTrap} F${save.world.defenses.fireTalismanTrap}`,
      deviceLine,
      `Storage: ${inventoryText(save.player.storage)}`,
      ...queues
    ].join('\n'));
  }
}
