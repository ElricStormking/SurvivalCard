import Phaser from 'phaser';
import { ENEMIES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { itemIconKey } from '../data/itemIcons';
import { TUNING } from '../data/tuning';
import { addItems, inventoryText, removeItems } from '../systems/inventory';
import { grantSkillXp, skillXpForNextLevel, spendSkillPoint, unlockSwordQiSlash } from '../systems/progression';
import { activeObjective, claimCompletedObjectiveRewards, objectiveRewardSummary, objectiveSteps } from '../systems/objectives';
import { effectivePetRegenerationPerSecond, effectiveRegenerationPerSecond, hungerRegenerationMultiplier } from '../systems/regeneration';
import { installAudioUnlock, playAudioCue } from '../systems/audio';
import { conditionHudLine } from '../systems/dailyConditions';
import { damageDurability, durabilityCurrent, durabilityMax, durabilityRatio } from '../systems/durability';
import { saveGame } from '../systems/save';
import { survivalStatus } from '../systems/survivalStatus';
import { activeBuffLine, applyConsumableBuff, tickActiveBuffs } from '../systems/buffs';
import { dodgeProfile } from '../systems/dodge';
import { encumbrance } from '../systems/encumbrance';
import { createLostLootFromDefeat } from '../systems/lostLoot';
import { equippedCombatDamage } from '../systems/maintenance';
import { tickWorld } from '../systems/time';
import { CardActor } from '../objects/CardActor';
import { GameStore } from '../state/GameStore';
import type { EnemyId, Inventory, ItemId, SkillId } from '../types';

interface EnemyActor {
  id: EnemyId;
  actor: CardActor;
  attackTimer: number;
  damageMultiplier: number;
  defeated?: boolean;
}

interface EnemySpawnOptions {
  hpMultiplier?: number;
  damageMultiplier?: number;
  labelSuffix?: string;
}

interface CollisionObstacle {
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

interface MovementBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

type InventorySource = 'inventory' | 'storage';

export abstract class BasePlayScene extends Phaser.Scene {
  protected player!: CardActor;
  protected spiritDog?: CardActor;
  protected cursors!: Record<'up' | 'down' | 'left' | 'right' | 'shift', Phaser.Input.Keyboard.Key>;
  protected enemies: EnemyActor[] = [];
  protected status!: Phaser.GameObjects.Text;
  protected prompt!: Phaser.GameObjects.Text;
  private survivalHudBars!: Record<'hp' | 'energy' | 'hunger', Phaser.GameObjects.Rectangle>;
  private debugPanel!: Phaser.GameObjects.Rectangle;
  private debugText!: Phaser.GameObjects.Text;
  private debugVisible = false;
  private objectivePanel!: Phaser.GameObjects.Rectangle;
  private objectiveText!: Phaser.GameObjects.Text;
  protected lastAttack = 0;
  protected invulnerable = false;
  protected showHitboxes = false;
  protected movementLocked = false;
  protected collisionObstacles: CollisionObstacle[] = [];
  private orbitingSword!: Phaser.GameObjects.Rectangle;
  private orbitingSwordTimer = 0;
  private flameAura!: Phaser.GameObjects.Arc;
  private flameAuraTimer = 0;
  private spiritDogAttackTimer = 0;
  private hotbarSlots: {
    frame: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image;
    fallback: Phaser.GameObjects.Text;
    count: Phaser.GameObjects.Text;
    key: Phaser.GameObjects.Text;
    durability: Phaser.GameObjects.Rectangle;
  }[] = [];
  private selectedHotbarSlot = 0;
  private inventoryOpen = false;
  private inventoryMovementLock = false;
  private inventoryPanel?: Phaser.GameObjects.Container;
  private draggedInventoryItem?: ItemId;
  private dragGhost?: Phaser.GameObjects.Container;
  private skillsOpen = false;
  private skillsMovementLock = false;
  private skillsPanel?: Phaser.GameObjects.Container;
  private dodgeKey!: Phaser.Input.Keyboard.Key;
  private lastDodge = -Infinity;
  private dodgeInvulnerableUntil = 0;
  private dodging = false;

  protected createControls(): void {
    installAudioUnlock();
    this.cursors = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      shift: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    };
    this.dodgeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
    this.input.keyboard?.on('keydown-SPACE', () => this.basicAttack());
    this.input.keyboard?.on('keydown-CTRL', () => this.performDodge());
    this.input.keyboard?.on('keydown-T', () => this.castSwordQi());
    this.input.keyboard?.on('keydown-Q', () => this.consumeBestFood());
    this.input.keyboard?.on('keydown-I', () => this.toggleInventoryPanel());
    this.input.keyboard?.on('keydown-K', () => this.toggleSkillsPanel());
    [
      'keydown-ONE',
      'keydown-TWO',
      'keydown-THREE',
      'keydown-FOUR',
      'keydown-FIVE',
      'keydown-SIX',
      'keydown-SEVEN',
      'keydown-EIGHT'
    ].forEach((eventName, index) => {
      this.input.keyboard?.on(eventName, () => this.useHotbarSlot(index));
    });
    this.input.keyboard?.on('keydown-Z', () => this.setSpiritDogCommand('follow'));
    this.input.keyboard?.on('keydown-X', () => this.setSpiritDogCommand('guard'));
    this.input.keyboard?.on('keydown-V', () => this.setSpiritDogCommand('retreat'));
    this.input.keyboard?.on('keydown-F', () => this.setSpiritDogCommand('attack'));
    this.input.keyboard?.on('keydown-U', () => unlockSwordQiSlash(GameStore.save));
    this.input.keyboard?.on('keydown-F3', () => this.toggleDebugOverlay());
    this.input.keyboard?.on('keydown-F4', () => this.cycleTimeScale());
    this.input.keyboard?.on('keydown-F5', () => this.debugCompleteProduction());
    this.input.keyboard?.on('keydown-F6', () => { GameStore.save.world.day = 14; GameStore.save.world.minutes = 18 * 60; });
    this.input.keyboard?.on('keydown-F7', () => this.scene.start('SiegeScene'));
    this.input.keyboard?.on('keydown-F8', () => this.spawnEnemy('ghost', this.player.x + 180, this.player.y));
    this.input.keyboard?.on('keydown-F9', () => { this.showHitboxes = !this.showHitboxes; });
    this.input.keyboard?.on('keydown-F10', () => { this.invulnerable = !this.invulnerable; });
    this.input.keyboard?.on('keydown-F11', () => {
      addItems(GameStore.save.player.inventory, {
        log: TUNING.debug.resourceGrantAmount,
        stone: TUNING.debug.resourceGrantAmount,
        ore: TUNING.debug.resourceGrantAmount,
        herb: TUNING.debug.resourceGrantAmount,
        resin: TUNING.debug.resourceGrantAmount,
        spiritPaper: TUNING.debug.resourceGrantAmount,
        ironAxe: 1,
        ironPickaxe: 1
      });
    });
    this.input.keyboard?.on('keydown-F12', () => this.debugGrantProgression());
    this.input.keyboard?.on('keydown-BRACKETLEFT', () => this.toggleUnarmed());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.skillsOpen) {
        this.handleSkillsPanelPointer(pointer);
        return;
      }
      if (this.movementLocked) return;
      if (pointer.rightButtonDown()) {
        this.performDodge(pointer);
        return;
      }
      if (!this.inventoryOpen) this.basicAttack();
    });
    this.input.mouse?.disableContextMenu();
  }

  protected createHud(): void {
    this.resetHudReferences();
    this.events.once('shutdown', () => this.resetHudReferences());
    this.status = this.add.text(16, 14, '', {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f4e4b3',
      backgroundColor: 'rgba(19, 20, 14, 0.72)',
      padding: { x: 10, y: 8 }
    }).setScrollFactor(0).setDepth(10_000);
    this.prompt = this.add.text(936, 472, '', {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: '#f8e9b8',
      backgroundColor: 'rgba(19, 20, 14, 0.72)',
      padding: { x: 12, y: 10 },
      wordWrap: { width: 292 }
    }).setScrollFactor(0).setDepth(10_000);
    this.createSurvivalHud();
    this.createHotbarHud();
    this.createObjectiveHud();
    this.createDebugOverlay();
  }

  protected createPlayer(x = GameStore.save.player.x, y = GameStore.save.player.y): void {
    GameStore.hydrate();
    this.collisionObstacles = [];
    this.player = new CardActor(this, x, y, GameStore.save.player.name, 0x5d7147, 100, 145, 'avatar');
    this.player.setHp(GameStore.save.player.hp);
    this.createP1CombatVisuals();
    this.createSpiritDog();
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, 1920, 1400);
  }

  update(time: number, delta: number): void {
    tickWorld(GameStore.save, delta);
    this.movePlayer(time, delta);
    this.updateP1Combat(time, delta);
    this.updateSpiritDog(delta);
    this.updateEnemies(delta);
    GameStore.save.player.x = this.player.x;
    GameStore.save.player.y = this.player.y;
    GameStore.save.player.hp = this.player.hp;
    this.updateSurvivalHud();
    this.updateHotbarHud();
    this.refreshHud();
    this.claimObjectiveRewards();
    this.updateObjectiveHud();
    this.updateDebugOverlay();
    if (GameStore.save.world.day >= 15 && !GameStore.save.world.siegeWon && this.scene.key !== 'SiegeScene') this.scene.start('SiegeScene');
  }

  protected movePlayer(time: number, delta: number): void {
    if (this.movementLocked) {
      this.updateSurvivalMeters(delta, false, false);
      this.player.setDepth(this.player.y);
      this.player.wobble(time, false);
      return;
    }
    if (this.dodging) {
      this.updateSurvivalMeters(delta, false, false);
      this.player.setDepth(this.player.y);
      return;
    }

    const dir = new Phaser.Math.Vector2(
      (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0),
      (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0)
    );
    const moving = dir.lengthSq() > 0;
    if (moving) dir.normalize();
    const sprinting = moving && this.cursors.shift.isDown && GameStore.save.player.energy > 2;
    this.updateSurvivalMeters(delta, moving, sprinting);
    const status = survivalStatus(GameStore.save, this.player.hp);
    const speed = this.player.speed * (sprinting ? 1.45 : 1) * status.movementMultiplier;
    const moved = this.moveActorWithCollision(this.player, dir.x * speed * delta / 1000, dir.y * speed * delta / 1000, {
      minX: 60,
      maxX: 1860,
      minY: 80,
      maxY: 1320
    });
    this.player.setDepth(this.player.y);
    this.player.wobble(time, moving && moved, sprinting && moved, dir.x);
  }

  protected registerCollisionObstacle(x: number, y: number, radius: number): CollisionObstacle {
    const obstacle = { x, y, radius, active: true };
    this.collisionObstacles.push(obstacle);
    return obstacle;
  }

  protected unregisterCollisionObstacle(obstacle: CollisionObstacle): void {
    obstacle.active = false;
    this.collisionObstacles = this.collisionObstacles.filter((candidate) => candidate !== obstacle);
  }

  protected moveActorWithCollision(actor: CardActor, dx: number, dy: number, bounds?: MovementBounds): boolean {
    if (dx === 0 && dy === 0) return false;
    const targetX = this.clampMovementAxis(actor.x + dx, bounds?.minX, bounds?.maxX);
    const targetY = this.clampMovementAxis(actor.y + dy, bounds?.minY, bounds?.maxY);
    if (!this.actorBlockedAt(actor, targetX, targetY)) {
      actor.x = targetX;
      actor.y = targetY;
      return true;
    }

    let moved = false;
    if (!this.actorBlockedAt(actor, targetX, actor.y)) {
      actor.x = targetX;
      moved = true;
    }
    if (!this.actorBlockedAt(actor, actor.x, targetY)) {
      actor.y = targetY;
      moved = true;
    }
    return moved;
  }

  private clampMovementAxis(value: number, min?: number, max?: number): number {
    if (min === undefined || max === undefined) return value;
    return Phaser.Math.Clamp(value, min, max);
  }

  private actorBlockedAt(actor: CardActor, x: number, y: number): boolean {
    const actorRadius = Math.max(12, 20 * Math.max(actor.scaleX, actor.scaleY));
    return this.collisionObstacles.some((obstacle) => {
      if (!obstacle.active) return false;
      const minimumDistance = obstacle.radius + actorRadius;
      const currentDistance = Phaser.Math.Distance.Between(actor.x, actor.y, obstacle.x, obstacle.y);
      const nextDistance = Phaser.Math.Distance.Between(x, y, obstacle.x, obstacle.y);
      return nextDistance < minimumDistance && (currentDistance >= minimumDistance || nextDistance < currentDistance);
    });
  }

  private updateSurvivalMeters(delta: number, moving: boolean, sprinting: boolean): void {
    const seconds = delta / 1000;
    const player = GameStore.save.player;
    tickActiveBuffs(GameStore.save, seconds);
    if (sprinting) {
      player.energy = Phaser.Math.Clamp(player.energy - seconds * TUNING.survival.sprintEnergyDrainPerSecond, 0, 100);
    } else {
      player.energy = Phaser.Math.Clamp(player.energy + seconds * (moving ? TUNING.survival.movingEnergyRecoveryPerSecond : TUNING.survival.idleEnergyRecoveryPerSecond), 0, 100);
    }
    player.hunger = Phaser.Math.Clamp(player.hunger - seconds * TUNING.survival.hungerDrainPerWorldSecond * GameStore.save.world.timeScale, 0, 100);
    if (player.hunger <= 0 && !this.invulnerable) {
      this.player.setHp(this.player.hp - seconds * TUNING.survival.starvationDamagePerSecond);
    } else if (this.player.hp > 0 && this.player.hp < this.player.maxHp) {
      const regenPerSecond = effectiveRegenerationPerSecond(GameStore.save);
      if (regenPerSecond > 0) this.player.setHp(this.player.hp + regenPerSecond * seconds);
    }
  }

  private createSurvivalHud(): void {
    const x = 24;
    const y = 616;
    const width = 180;
    const height = 25;
    const gap = 4;
    const rows: { key: 'hp' | 'energy' | 'hunger'; label: string; color: number }[] = [
      { key: 'hp', label: 'HP', color: 0xc74434 },
      { key: 'energy', label: 'ENERGY', color: 0xd6a336 },
      { key: 'hunger', label: 'HUNGER', color: 0x69a84f }
    ];
    this.survivalHudBars = {} as Record<'hp' | 'energy' | 'hunger', Phaser.GameObjects.Rectangle>;

    const panelHeight = rows.length * height + (rows.length - 1) * gap + 18;
    this.add.rectangle(x - 10, y - 10, width + 20, panelHeight, 0x16130d, 0.72)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xc6a662, 0.82)
      .setScrollFactor(0)
      .setDepth(10_000);

    rows.forEach((row, index) => {
      const rowY = y + index * (height + gap);
      this.add.rectangle(x, rowY, width, height, 0x211810, 0.9)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x46351f, 0.9)
        .setScrollFactor(0)
        .setDepth(10_001);
      const fill = this.add.rectangle(x, rowY, width, height, row.color, 0.94)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(10_002);
      this.add.rectangle(x, rowY, width, 4, 0xfff0c8, 0.2)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(10_003);
      this.add.text(x + 16, rowY + height / 2, row.label, {
        fontFamily: 'Georgia',
        fontSize: '12px',
        color: '#fff0c2',
        stroke: '#25180d',
        strokeThickness: 2
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10_004);
      this.survivalHudBars[row.key] = fill;
    });

    this.updateSurvivalHud();
  }

  private updateSurvivalHud(): void {
    if (!this.survivalHudBars) return;
    const player = GameStore.save.player;
    this.survivalHudBars.hp.width = 180 * Phaser.Math.Clamp(this.player.hp, 0, 100) / 100;
    this.survivalHudBars.energy.width = 180 * Phaser.Math.Clamp(player.energy, 0, 100) / 100;
    this.survivalHudBars.hunger.width = 180 * Phaser.Math.Clamp(player.hunger, 0, 100) / 100;
  }

  private createHotbarHud(): void {
    this.hotbarSlots = [];
    const slotSize = 50;
    const gap = 6;
    const totalWidth = slotSize * 8 + gap * 7;
    const startX = 640 - totalWidth / 2;
    const y = 650;

    this.add.rectangle(startX - 12, y - 12, totalWidth + 24, slotSize + 24, 0x17120d, 0.76)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xc6a662, 0.76)
      .setScrollFactor(0)
      .setDepth(10_010);

    for (let index = 0; index < 8; index += 1) {
      const x = startX + index * (slotSize + gap);
      const frame = this.add.rectangle(x, y, slotSize, slotSize, 0x23190f, 0.95)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x6e542e, 0.95)
        .setScrollFactor(0)
        .setDepth(10_011)
        .setInteractive({ useHandCursor: true, dropZone: true });
      const fill = this.add.rectangle(x + 5, y + 8, slotSize - 10, slotSize - 14, 0x3b2a18, 0.94)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(10_012);
      const icon = this.add.image(x + slotSize / 2, y + slotSize / 2 + 1, 'iconLog')
        .setDisplaySize(34, 34)
        .setScrollFactor(0)
        .setDepth(10_013)
        .setVisible(false);
      const fallback = this.add.text(x + slotSize / 2, y + slotSize / 2 + 2, '', {
        fontFamily: 'Georgia',
        fontSize: '15px',
        color: '#fff0bd',
        stroke: '#21150c',
        strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10_013);
      const count = this.add.text(x + slotSize - 5, y + slotSize - 5, '', {
        fontFamily: 'Georgia',
        fontSize: '11px',
        color: '#f6deb0',
        stroke: '#21150c',
        strokeThickness: 2
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(10_014);
      const key = this.add.text(x + 4, y + 3, `${index + 1}`, {
        fontFamily: 'Georgia',
        fontSize: '10px',
        color: '#cdbb91'
      }).setScrollFactor(0).setDepth(10_014);
      const durability = this.add.rectangle(x + 5, y + slotSize - 7, 0, 4, 0x8fd16a, 0.95)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(10_014);

      frame.on('pointerdown', () => {
        this.selectedHotbarSlot = index;
        this.updateHotbarHud();
      });
      frame.on('drop', () => {
        if (!this.draggedInventoryItem) return;
        this.assignHotbarItem(this.draggedInventoryItem, index, false);
      });
      this.hotbarSlots.push({ frame, fill, icon, fallback, count, key, durability });
    }

    this.updateHotbarHud();
  }

  protected updateHotbarHud(): void {
    if (!this.hotbarSlots.length) return;
    const hotbar = GameStore.save.player.hotbar;
    this.hotbarSlots.forEach((slot, index) => {
      if (!slot.frame.active || !slot.fill.active || !slot.icon.active || !slot.fallback.active || !slot.count.active || !slot.key.active || !slot.durability.active) return;
      const itemId = hotbar[index] ?? null;
      const item = itemId ? ITEMS[itemId] : undefined;
      const count = itemId ? this.availableItemCount(itemId) : 0;
      const selected = index === this.selectedHotbarSlot;
      const iconKey = itemId ? itemIconKey(itemId) : undefined;
      slot.frame.setStrokeStyle(selected ? 3 : 2, selected ? 0xf0cf78 : 0x6e542e, selected ? 1 : 0.95);
      slot.frame.setFillStyle(selected ? 0x352212 : 0x23190f, 0.95);
      slot.fill.setFillStyle(item ? this.itemIconColor(item.id) : 0x1b140e, item && (count > 0 || item.id === 'unarmed') ? 0.94 : 0.4);
      if (iconKey) slot.icon.setTexture(iconKey);
      slot.icon.setVisible(Boolean(iconKey));
      slot.icon.setAlpha(item && (count > 0 || item.id === 'unarmed') ? 0.95 : 0.35);
      slot.fallback.setText(item && !iconKey ? this.itemIconLabel(item.id) : '');
      slot.fallback.setAlpha(item && (count > 0 || item.id === 'unarmed') ? 1 : 0.45);
      slot.count.setText(item && item.id !== 'unarmed' ? String(count) : '');
      slot.count.setColor(count > 0 ? '#f6deb0' : '#ff9f72');
      slot.key.setColor(selected ? '#fff0bd' : '#cdbb91');
      const durabilityMaxValue = itemId ? durabilityMax(itemId) : 0;
      const durabilityValue = itemId ? durabilityRatio(GameStore.save, itemId) : 0;
      slot.durability.setVisible(durabilityMaxValue > 0 && count > 0);
      slot.durability.width = 40 * durabilityValue;
      slot.durability.setFillStyle(durabilityValue > 0.5 ? 0x8fd16a : durabilityValue > 0.25 ? 0xd0ad3f : 0xc34d3b, 0.95);
    });
  }

  private resetHudReferences(): void {
    this.hotbarSlots = [];
    this.inventoryPanel = undefined;
    this.inventoryOpen = false;
    this.inventoryMovementLock = false;
    this.skillsPanel = undefined;
    this.skillsOpen = false;
    this.skillsMovementLock = false;
  }

  private toggleInventoryPanel(): void {
    this.inventoryOpen = !this.inventoryOpen;
    if (!this.inventoryOpen) {
      this.inventoryPanel?.destroy(true);
      this.inventoryPanel = undefined;
      if (this.inventoryMovementLock) this.movementLocked = false;
      this.inventoryMovementLock = false;
      return;
    }
    if (this.skillsOpen) this.toggleSkillsPanel();
    this.inventoryMovementLock = !this.movementLocked;
    if (this.inventoryMovementLock) this.movementLocked = true;
    this.renderInventoryPanel();
  }

  private renderInventoryPanel(): void {
    this.inventoryPanel?.destroy(true);
    if (!this.inventoryOpen) return;

    const panel = this.add.container(282, 76).setScrollFactor(0).setDepth(10_080);
    const bg = this.add.rectangle(0, 0, 716, 500, 0x15100b, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xd0ad61, 0.9);
    const carry = encumbrance(GameStore.save);
    const title = this.add.text(18, 14, 'Inventory, Storage & Toolbar', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f8e7b8'
    });
    const help = this.add.text(18, 46, `I close   Drag/click item to assign slot ${this.selectedHotbarSlot + 1}   Store/Take moves one item   ${carry.line}`, {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#cdbb91'
    });
    panel.add([bg, title, help]);

    const carriedEntries = this.inventoryEntries(GameStore.save.player.inventory);
    const storageEntries = this.inventoryEntries(GameStore.save.player.storage);
    this.renderInventorySection(panel, 'Carried Inventory', 'inventory', carriedEntries, 18, 82, 'Store');
    this.renderInventorySection(panel, 'Farm Storage', 'storage', storageEntries, 18, 288, 'Take');

    this.inventoryPanel = panel;
  }

  private renderInventorySection(
    panel: Phaser.GameObjects.Container,
    title: string,
    source: InventorySource,
    entries: { itemId: ItemId; count: number }[],
    startX: number,
    startY: number,
    transferLabel: string
  ): void {
    const sectionBg = this.add.rectangle(startX, startY, 680, 182, 0x100c08, 0.44)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x4f3b22, 0.72);
    const header = this.add.text(startX + 12, startY + 8, title, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f5e2b2'
    });
    const countSummary = this.add.text(startX + 548, startY + 10, `${entries.length} stacks`, {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#bba77a'
    });
    panel.add([sectionBg, header, countSummary]);

    if (entries.length === 0) {
      panel.add(this.add.text(startX + 14, startY + 58, source === 'inventory' ? 'Nothing carried.' : 'Storage empty.', {
        fontFamily: 'Georgia',
        fontSize: '14px',
        color: '#ffcf9c'
      }));
      return;
    }

    entries.slice(0, 12).forEach((entry, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = startX + 12 + col * 166;
      const y = startY + 34 + row * 48;
      this.createInventoryCard(panel, entry.itemId, entry.count, source, transferLabel, x, y);
    });

    if (entries.length > 12) {
      panel.add(this.add.text(startX + 560, startY + 160, `+${entries.length - 12} hidden`, {
        fontFamily: 'Georgia',
        fontSize: '11px',
        color: '#bba77a'
      }));
    }
  }

  private createInventoryCard(
    panel: Phaser.GameObjects.Container,
    itemId: ItemId,
    count: number,
    source: InventorySource,
    transferLabel: string,
    x: number,
    y: number
  ): void {
    const card = this.add.rectangle(x, y, 154, 42, 0x241a11, 0.94)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x5b4529)
      .setInteractive({ useHandCursor: true });
    const swatch = this.add.rectangle(x + 7, y + 7, 28, 28, this.itemIconColor(itemId), 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xe5c982, 0.8);
    const iconKey = itemIconKey(itemId);
    const icon = iconKey
      ? this.add.image(x + 21, y + 21, iconKey).setDisplaySize(24, 24)
      : this.add.text(x + 21, y + 22, this.itemIconLabel(itemId), {
        fontFamily: 'Georgia',
        fontSize: '10px',
        color: '#fff0bd',
        stroke: '#21150c',
        strokeThickness: 2
      }).setOrigin(0.5);
    const name = this.add.text(x + 42, y + 5, ITEMS[itemId].name, {
      fontFamily: 'Georgia',
      fontSize: '10px',
      color: '#f5e2b2',
      wordWrap: { width: 66 }
    });
    const durabilityText = durabilityMax(itemId) > 0 ? ` ${Math.ceil(durabilityCurrent(GameStore.save, itemId))}/${durabilityMax(itemId)}` : '';
    const meta = this.add.text(x + 42, y + 28, `${ITEMS[itemId].kind} x${count}${durabilityText}`, {
      fontFamily: 'Georgia',
      fontSize: '9px',
      color: '#cdbb91'
    });
    const transferButton = this.add.rectangle(x + 124, y + 21, 52, 26, 0x563a1d, 0.88)
      .setStrokeStyle(1, 0xcaa85e, 0.9)
      .setInteractive({ useHandCursor: true });
    const transferText = this.add.text(x + 124, y + 21, transferLabel, {
      fontFamily: 'Georgia',
      fontSize: '10px',
      color: '#fff0bd'
    }).setOrigin(0.5);

    let wasDragged = false;
    card.on('pointerup', () => {
      if (!wasDragged) this.assignHotbarItem(itemId);
    });
    transferButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: Phaser.Types.Input.EventData) => {
      event?.stopPropagation();
      this.transferInventoryItem(itemId, source, 1);
    });
    this.makeInventoryEntryDraggable(card, icon, itemId, () => {
      wasDragged = true;
    }, () => {
      this.time.delayedCall(0, () => { wasDragged = false; });
    });

    panel.add([card, swatch, icon, name, meta, transferButton, transferText]);
  }

  private makeInventoryEntryDraggable(
    card: Phaser.GameObjects.Rectangle,
    icon: Phaser.GameObjects.Image | Phaser.GameObjects.Text,
    itemId: ItemId,
    onDragStart: () => void,
    onDragEnd: () => void
  ): void {
    card.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      onDragStart();
      this.draggedInventoryItem = itemId;
      this.createDragGhost(icon, pointer.x, pointer.y, itemId);
      card.setStrokeStyle(2, 0xf0cf78, 1);
    });
    card.on('drag', (pointer: Phaser.Input.Pointer) => {
      this.moveDragGhost(pointer.x, pointer.y);
    });
    card.on('dragend', () => {
      this.draggedInventoryItem = undefined;
      this.destroyDragGhost();
      icon.setAlpha(1);
      card.setStrokeStyle(1, 0x5b4529);
      this.updateHotbarHud();
      if (this.inventoryOpen) this.renderInventoryPanel();
      onDragEnd();
    });
    this.input.setDraggable(card);
  }

  private createDragGhost(icon: Phaser.GameObjects.Image | Phaser.GameObjects.Text, x: number, y: number, itemId: ItemId): void {
    this.destroyDragGhost();
    const ghost = this.add.container(x, y).setScrollFactor(0).setDepth(20_000);
    const bg = this.add.rectangle(0, 0, 42, 42, 0x1f170f, 0.82)
      .setStrokeStyle(2, 0xf0cf78, 0.95);
    const iconKey = itemIconKey(itemId);
    const visual = iconKey
      ? this.add.image(0, 0, iconKey).setDisplaySize(34, 34)
      : this.add.text(0, 0, this.itemIconLabel(itemId), {
        fontFamily: 'Georgia',
        fontSize: '15px',
        color: '#fff0bd',
        stroke: '#21150c',
        strokeThickness: 3
      }).setOrigin(0.5);
    ghost.add([bg, visual]);
    ghost.setAlpha(0.88);
    icon.setAlpha(0.45);
    this.dragGhost = ghost;
  }

  private moveDragGhost(x: number, y: number): void {
    this.dragGhost?.setPosition(x, y);
  }

  private destroyDragGhost(): void {
    this.dragGhost?.destroy(true);
    this.dragGhost = undefined;
  }

  private assignHotbarItem(itemId: ItemId, slotIndex = this.selectedHotbarSlot, rerenderInventory = true): void {
    this.selectedHotbarSlot = slotIndex;
    GameStore.save.player.hotbar[slotIndex] = itemId;
    this.updateHotbarHud();
    if (rerenderInventory) this.renderInventoryPanel();
    this.flashDamage(this.player.x, this.player.y - 112, `Slot ${slotIndex + 1}: ${ITEMS[itemId].name}`, '#d9f0b0');
    saveGame(GameStore.save);
  }

  private toggleSkillsPanel(): void {
    this.skillsOpen = !this.skillsOpen;
    if (!this.skillsOpen) {
      this.skillsPanel?.destroy(true);
      this.skillsPanel = undefined;
      if (this.skillsMovementLock) this.movementLocked = false;
      this.skillsMovementLock = false;
      return;
    }

    if (this.inventoryOpen) this.toggleInventoryPanel();
    this.skillsMovementLock = !this.movementLocked;
    if (this.skillsMovementLock) this.movementLocked = true;
    this.renderSkillsPanel();
  }

  private renderSkillsPanel(): void {
    this.skillsPanel?.destroy(true);
    if (!this.skillsOpen) return;

    const save = GameStore.save;
    const panel = this.add.container(330, 104).setScrollFactor(0).setDepth(10_090);
    const bg = this.add.rectangle(0, 0, 620, 456, 0x15100b, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xd0ad61, 0.92);
    const title = this.add.text(18, 16, 'Skills & Cultivation', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f8e7b8'
    });
    const help = this.add.text(18, 48, `K close   Skill points ${save.player.skillPoints}   Click Train/Unlock or press 1-4`, {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#cdbb91'
    });
    panel.add([bg, title, help]);

    const attributes = Object.entries(save.player.attributes)
      .map(([id, value]) => `${this.labelFromId(id)} ${value}`)
      .join('  ');
    const affinities = Object.entries(save.player.affinities)
      .map(([id, value]) => `${this.labelFromId(id)} ${value.toFixed(1)}`)
      .join('  ');
    panel.add(this.add.text(18, 76, attributes, {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#f4e4b3',
      wordWrap: { width: 570 }
    }));
    panel.add(this.add.text(18, 98, `Affinities: ${affinities}`, {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#cdbb91',
      wordWrap: { width: 570 }
    }));

    const skills: { id: SkillId; name: string; detail: string }[] = [
      { id: 'sword', name: 'Sword', detail: 'Weapon damage, sword practice, and combat growth.' },
      { id: 'gathering', name: 'Gathering', detail: 'Faster gathering and stronger body recovery scaling.' },
      { id: 'crafting', name: 'Crafting', detail: 'Device practice, recipes, and production familiarity.' },
      { id: 'swordQiSlash', name: 'Sword Qi Slash', detail: 'T cast. Costs 8 Spirit and cuts through nearby enemies.' }
    ];

    skills.forEach((skill, index) => {
      const y = 130 + index * 76;
      this.addSkillRow(panel, skill.id, skill.name, skill.detail, y);
    });

    this.skillsPanel = panel;
  }

  private addSkillRow(panel: Phaser.GameObjects.Container, skillId: SkillId, name: string, detail: string, y: number): void {
    const save = GameStore.save;
    const skill = save.player.skills[skillId];
    const locked = !skill.unlocked;
    const next = skillXpForNextLevel(skill.level);
    const xpRatio = locked ? 0 : Phaser.Math.Clamp(skill.xp / next, 0, 1);
    const canSpend = save.player.skillPoints > 0 && (skill.unlocked || skillId === 'swordQiSlash');
    const row = this.add.rectangle(18, y, 584, 64, locked ? 0x1c1510 : 0x241a11, 0.94)
      .setOrigin(0, 0)
      .setStrokeStyle(1, locked ? 0x5b4529 : 0x8f6a35, 0.92);
    const title = this.add.text(34, y + 9, `${this.skillHotkeyLabel(skillId)}  ${name}  Lv ${skill.level}`, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: locked ? '#a99874' : '#f8e7b8'
    });
    const status = this.add.text(34, y + 31, locked ? 'Locked' : `${Math.floor(skill.xp)}/${next} XP`, {
      fontFamily: 'Georgia',
      fontSize: '11px',
      color: locked ? '#ff9f72' : '#cdbb91'
    });
    const detailText = this.add.text(150, y + 11, detail, {
      fontFamily: 'Georgia',
      fontSize: '11px',
      color: '#d7c595',
      wordWrap: { width: 250 }
    });
    const barBg = this.add.rectangle(34, y + 51, 250, 6, 0x2b1d12, 0.95).setOrigin(0, 0.5);
    const bar = this.add.rectangle(34, y + 51, 250 * xpRatio, 6, skillId === 'swordQiSlash' ? 0x80b7e6 : 0xd7a83a, 0.95).setOrigin(0, 0.5);
    const button = this.add.rectangle(452, y + 10, 132, 44, canSpend ? 0x533719 : 0x2a2117, 0.96)
      .setOrigin(0, 0)
      .setStrokeStyle(1, canSpend ? 0xf0cf78 : 0x5b4529, 0.95);
    const buttonLabel = locked ? 'Unlock 1 SP' : 'Train +1 1 SP';
    const buttonText = this.add.text(518, y + 32, save.player.skillPoints > 0 ? buttonLabel : 'Need SP', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: canSpend ? '#fff0bd' : '#8e7f67'
    }).setOrigin(0.5);
    const actionZone = this.add.rectangle(432, y, 170, 64, 0xffffff, 0.001)
      .setOrigin(0, 0);
    if (canSpend) {
      actionZone.setInteractive({ useHandCursor: true });
      actionZone.on('pointerover', () => button.setStrokeStyle(2, 0xffe29a, 1));
      actionZone.on('pointerout', () => button.setStrokeStyle(1, 0xf0cf78, 0.95));
      actionZone.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: Phaser.Types.Input.EventData) => {
        event?.stopPropagation();
        this.spendSkillPointFromPanel(skillId);
      });
    }
    panel.add([row, title, status, detailText, barBg, bar, button, buttonText, actionZone]);
  }

  private spendSkillPointFromPanel(skill: SkillId): void {
    if (!spendSkillPoint(GameStore.save, skill)) {
      this.flashDamage(this.player.x, this.player.y - 112, 'No skill point available', '#ff9f72');
      return;
    }
    playAudioCue('skillSpend');
    saveGame(GameStore.save);
    this.flashDamage(this.player.x, this.player.y - 112, `${this.labelFromId(skill)} improved`, '#d9f0b0');
    this.renderSkillsPanel();
    this.refreshHud();
  }

  private skillHotkeyLabel(skill: SkillId): string {
    return `${(['sword', 'gathering', 'crafting', 'swordQiSlash'] as SkillId[]).indexOf(skill) + 1}.`;
  }

  private handleSkillsPanelPointer(pointer: Phaser.Input.Pointer): boolean {
    const localX = pointer.x - 330;
    const localY = pointer.y - 104;
    if (localX < 0 || localX > 620 || localY < 0 || localY > 456) return false;

    const skills: SkillId[] = ['sword', 'gathering', 'crafting', 'swordQiSlash'];
    for (let index = 0; index < skills.length; index += 1) {
      const rowY = 130 + index * 76;
      const inActionColumn = localX >= 432 && localX <= 602;
      const inActionRow = localY >= rowY && localY <= rowY + 64;
      if (inActionColumn && inActionRow) {
        this.spendSkillPointFromPanel(skills[index]);
        return true;
      }
    }
    return true;
  }

  private labelFromId(id: string): string {
    return id.replace(/([A-Z])/g, ' $1').replace(/^./, (first) => first.toUpperCase());
  }

  private inventoryEntries(inventory: Inventory): { itemId: ItemId; count: number }[] {
    return (Object.entries(inventory) as [ItemId, number][])
      .filter(([itemId, count]) => count > 0 && itemId !== 'unarmed')
      .sort(([a], [b]) => {
        const kindOrder = ['weapon', 'tool', 'consumable', 'defense', 'resource'];
        const kindDelta = kindOrder.indexOf(ITEMS[a].kind) - kindOrder.indexOf(ITEMS[b].kind);
        return kindDelta || ITEMS[a].name.localeCompare(ITEMS[b].name);
      })
      .map(([itemId, count]) => ({ itemId, count }));
  }

  private transferInventoryItem(itemId: ItemId, source: InventorySource, amount: number): void {
    const sourceInventory = source === 'inventory' ? GameStore.save.player.inventory : GameStore.save.player.storage;
    const targetInventory = source === 'inventory' ? GameStore.save.player.storage : GameStore.save.player.inventory;
    const available = sourceInventory[itemId] ?? 0;
    const moved = Math.min(amount, available);
    if (moved <= 0) return;
    if (!removeItems(sourceInventory, { [itemId]: moved })) return;
    addItems(targetInventory, { [itemId]: moved });
    playAudioCue('pickup', 0.55);
    saveGame(GameStore.save);
    this.updateHotbarHud();
    this.renderInventoryPanel();
  }

  private useHotbarSlot(index: number): void {
    if (this.skillsOpen) {
      const skill = (['sword', 'gathering', 'crafting', 'swordQiSlash'] as SkillId[])[index];
      if (skill) this.spendSkillPointFromPanel(skill);
      return;
    }
    this.selectedHotbarSlot = index;
    const itemId = GameStore.save.player.hotbar[index];
    this.updateHotbarHud();
    if (!itemId) {
      this.flashDamage(this.player.x, this.player.y - 112, `Slot ${index + 1} empty`, '#ff9f72');
      return;
    }
    this.useItem(itemId);
    this.updateHotbarHud();
    if (this.inventoryOpen) this.renderInventoryPanel();
  }

  private useItem(itemId: ItemId): void {
    const item = ITEMS[itemId];
    if (!item) return;

    if (item.kind === 'weapon' || item.kind === 'tool') {
      if (itemId !== 'unarmed' && this.availableItemCount(itemId) <= 0) {
        this.flashDamage(this.player.x, this.player.y - 112, `Missing ${item.name}`, '#ff9f72');
        return;
      }
      GameStore.save.player.equipped = itemId;
      playAudioCue('uiOpen');
      this.flashDamage(this.player.x, this.player.y - 112, `Equipped ${item.name}`, '#d9f0b0');
      saveGame(GameStore.save);
      return;
    }

    if (item.kind === 'defense') {
      if (!this.removeOneAvailable(itemId)) {
        this.flashDamage(this.player.x, this.player.y - 112, `Missing ${item.name}`, '#ff9f72');
        return;
      }
      const key = itemId as 'barricade' | 'spikeTrap' | 'fireTalismanTrap';
      GameStore.save.world.defenses[key] += 1;
      GameStore.save.world.objectives.placedDefense = true;
      playAudioCue('deviceQueued');
      this.flashDamage(this.player.x, this.player.y - 112, `Placed ${item.name}`, '#d9f0b0');
      saveGame(GameStore.save);
      return;
    }

    if (item.hungerRestore) {
      if (GameStore.save.player.hunger >= 100) {
        this.flashDamage(this.player.x, this.player.y - 112, 'Hunger full', '#ffcf9c');
        return;
      }
      if (this.removeOneAvailable(itemId)) {
        GameStore.save.player.hunger = Phaser.Math.Clamp(GameStore.save.player.hunger + item.hungerRestore, 0, 100);
        const buffName = applyConsumableBuff(GameStore.save, itemId);
        playAudioCue('pickup');
        this.flashDamage(this.player.x, this.player.y - 112, `Ate ${item.name} +${item.hungerRestore} Hunger`, '#dff0a8');
        if (buffName) this.flashDamage(this.player.x, this.player.y - 136, buffName, '#f8e7b8');
        saveGame(GameStore.save);
      }
      return;
    }

    if (item.healthRestore) {
      if (this.player.hp >= 100) {
        this.flashDamage(this.player.x, this.player.y - 112, 'HP full', '#ffcf9c');
        return;
      }
      if (this.removeOneAvailable(itemId)) {
        this.player.setHp(Phaser.Math.Clamp(this.player.hp + item.healthRestore, 0, 100));
        GameStore.save.player.hp = this.player.hp;
        const buffName = applyConsumableBuff(GameStore.save, itemId);
        playAudioCue('pickup');
        this.flashDamage(this.player.x, this.player.y - 112, `Used ${item.name} +${item.healthRestore} HP`, '#dff0a8');
        if (buffName) this.flashDamage(this.player.x, this.player.y - 136, buffName, '#f8e7b8');
        saveGame(GameStore.save);
      }
      return;
    }

    if (item.coreRepair) {
      if (GameStore.save.world.formationCoreHp >= 150) {
        this.flashDamage(this.player.x, this.player.y - 112, 'Core already stable', '#ffcf9c');
        return;
      }
      if (this.removeOneAvailable(itemId)) {
        GameStore.save.world.formationCoreHp = Math.min(150, GameStore.save.world.formationCoreHp + item.coreRepair);
        playAudioCue('deviceComplete');
        this.flashDamage(this.player.x, this.player.y - 112, `Core +${item.coreRepair}`, '#dff0a8');
        saveGame(GameStore.save);
      }
      return;
    }

    this.flashDamage(this.player.x, this.player.y - 112, `${item.name} is not usable`, '#ff9f72');
  }

  private removeOneAvailable(itemId: ItemId): boolean {
    return removeItems(GameStore.save.player.inventory, { [itemId]: 1 }) || removeItems(GameStore.save.player.storage, { [itemId]: 1 });
  }

  private availableItemCount(itemId: ItemId): number {
    if (itemId === 'unarmed') return 1;
    return (GameStore.save.player.inventory[itemId] ?? 0) + (GameStore.save.player.storage[itemId] ?? 0);
  }

  private itemIconLabel(itemId: ItemId): string {
    const overrides: Partial<Record<ItemId, string>> = {
      unarmed: 'UA',
      rustedSword: 'Sw',
      ironSword: 'IS',
      woodenAxe: 'Ax',
      ironAxe: 'IA',
      stonePickaxe: 'Pk',
      ironPickaxe: 'IP',
      medicine: '+',
      grilledMeat: 'Me',
      herbSteak: 'Hs',
      repairKit: 'RK',
      barricade: 'Ba',
      spikeTrap: 'Sp',
      fireTalismanTrap: 'Fo'
    };
    return overrides[itemId] ?? itemId.slice(0, 2).toUpperCase();
  }

  private itemIconColor(itemId: ItemId): number {
    const item = ITEMS[itemId];
    if (item.kind === 'weapon') return 0x9b4a3b;
    if (item.kind === 'tool') return 0x8b7850;
    if (item.kind === 'consumable') return item.hungerRestore ? 0x8b5f34 : 0x4f8a5f;
    if (item.kind === 'defense') return 0x6f4c33;
    if (itemId === 'herb') return 0x5d9b54;
    if (itemId === 'ore' || itemId === 'stone') return 0x777568;
    if (itemId === 'meat') return 0x8f4e3d;
    return 0x6a4b2c;
  }

  private createObjectiveHud(): void {
    this.objectivePanel = this.add.rectangle(878, 14, 382, 156, 0x15110c, 0.76)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xc6a662, 0.82)
      .setScrollFactor(0)
      .setDepth(10_000);
    this.objectiveText = this.add.text(894, 26, '', {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: '#f6e5b8',
      lineSpacing: 4,
      wordWrap: { width: 348 }
    }).setScrollFactor(0).setDepth(10_001);
    this.updateObjectiveHud();
  }

  private updateObjectiveHud(): void {
    if (!this.objectiveText) return;
    const save = GameStore.save;
    const active = activeObjective(save);
    const doneCount = objectiveSteps(save).filter((step) => step.done).length;
    this.objectiveText.setText([
      `Path to Day 15  ${doneCount}/9`,
      `${active.done ? 'Complete' : 'Next'}: ${active.title}`,
      active.detail,
      `Reward: ${objectiveRewardSummary(active.id)}`,
      '',
      'F3 debug overlay'
    ].join('\n'));
  }

  private claimObjectiveRewards(): void {
    const claims = claimCompletedObjectiveRewards(GameStore.save);
    if (claims.length === 0) return;
    saveGame(GameStore.save);
    claims.slice(0, 3).forEach((claim, index) => {
      this.time.delayedCall(index * 280, () => {
        playAudioCue('skillSpend', 0.55);
        this.flashDamage(this.player.x, this.player.y - 132 - index * 22, `Objective: ${claim.title}`, '#dff0a8');
        this.flashDamage(this.player.x, this.player.y - 108 - index * 22, claim.summary, '#f8e7b8');
      });
    });
  }

  protected spawnEnemy(id: EnemyId, x: number, y: number, options: EnemySpawnOptions = {}): void {
    const def = ENEMIES[id];
    const hpMultiplier = options.hpMultiplier ?? 1;
    const actor = new CardActor(this, x, y, `${def.name}${options.labelSuffix ?? ''}`, def.color, Math.ceil(def.hp * hpMultiplier), def.speed, def.textureKey);
    actor.setDepth(y);
    this.enemies.push({ id, actor, attackTimer: 0, damageMultiplier: options.damageMultiplier ?? 1 });
  }

  protected updateEnemies(delta: number): void {
    for (const enemy of this.enemies) {
      if (enemy.actor.hp <= 0 || enemy.defeated) continue;
      const targetActor = this.enemyTarget(enemy);
      const target = new Phaser.Math.Vector2(targetActor.x, targetActor.y);
      const dist = enemy.actor.distanceTo(target);
      let moved = false;
      let facingX = 0;
      if (dist > 84) {
        const dir = target.subtract(new Phaser.Math.Vector2(enemy.actor.x, enemy.actor.y)).normalize();
        facingX = dir.x;
        moved = this.moveActorWithCollision(enemy.actor, dir.x * enemy.actor.speed * delta / 1000, dir.y * enemy.actor.speed * delta / 1000, {
          minX: 40,
          maxX: 1880,
          minY: 60,
          maxY: 1340
        });
      } else {
        enemy.attackTimer -= delta;
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = 1000;
          enemy.actor.playUnarmedMeleeLunge(new Phaser.Math.Vector2(targetActor.x, targetActor.y));
          if (targetActor === this.spiritDog) {
            this.damageActor(targetActor, this.enemyDamage(enemy), new Phaser.Math.Vector2(enemy.actor.x, enemy.actor.y), '#f06b55', 18);
            GameStore.save.player.spiritDog.hp = targetActor.hp;
            if (targetActor.hp <= 0) this.defeatSpiritDog(targetActor);
          } else {
            if (!this.isPlayerInvulnerable()) this.damageActor(this.player, Math.ceil(this.enemyDamage(enemy) * survivalStatus(GameStore.save, this.player.hp).incomingDamageMultiplier), new Phaser.Math.Vector2(enemy.actor.x, enemy.actor.y), '#f06b55', 18);
            else this.flashDamage(this.player.x, this.player.y - 80, 'blocked', '#d9f0b0');
            if (this.player.hp <= 0) this.onPlayerDefeated();
          }
        }
      }
      enemy.actor.setDepth(enemy.actor.y);
      enemy.actor.wobble(this.time.now, moved, false, facingX);
    }
    this.enemies = this.enemies.filter((enemy) => enemy.actor.active && !enemy.defeated);
  }

  private enemyDamage(enemy: EnemyActor): number {
    return Math.ceil(ENEMIES[enemy.id].damage * enemy.damageMultiplier);
  }

  protected basicAttack(): void {
    if (this.movementLocked || this.dodging) return;
    const now = this.time.now;
    if (now - this.lastAttack < 360) return;
    this.lastAttack = now;
    const target = this.nearestEnemy(this.player.x, this.player.y, 192);
    if (GameStore.save.player.equipped === 'unarmed' && target) {
      this.player.playUnarmedMeleeLunge(new Phaser.Math.Vector2(target.actor.x, target.actor.y));
    } else {
      this.weaponIcon(0xd5d5c8, 130);
    }
    playAudioCue('weaponSwing');
    const status = survivalStatus(GameStore.save, this.player.hp);
    this.damageNearest(Math.ceil(this.equippedDamage() * status.outgoingDamageMultiplier), GameStore.save.player.equipped === 'unarmed' ? 192 : 96);
    this.damageEquippedDurability();
    grantSkillXp(GameStore.save, 'sword', 6);
  }

  private damageEquippedDurability(): void {
    const equipped = GameStore.save.player.equipped;
    const result = damageDurability(GameStore.save, equipped, ITEMS[equipped].kind === 'tool' ? 1.5 : 1);
    if (!result) return;
    if (result.broke) this.flashDamage(this.player.x, this.player.y - 132, `${ITEMS[equipped].name} broke`, '#ff9f72');
    saveGame(GameStore.save);
    this.updateHotbarHud();
    if (this.inventoryOpen) this.renderInventoryPanel();
  }

  protected castSwordQi(): void {
    if (this.movementLocked || this.dodging) return;
    if (!GameStore.save.player.skills.swordQiSlash.unlocked || GameStore.save.player.spirit < 8) return;
    GameStore.save.player.spirit -= 8;
    this.player.playCastPulse();
    playAudioCue('cast');
    this.weaponIcon(0x8ed9f4, 220);
    this.damageNearest(34, 170);
    grantSkillXp(GameStore.save, 'swordQiSlash', 10);
  }

  private equippedDamage(): number {
    return equippedCombatDamage(GameStore.save);
  }

  private damageNearest(damage: number, range: number): void {
    const enemy = this.enemies
      .filter((candidate) => !candidate.defeated && candidate.actor.hp > 0 && candidate.actor.distanceTo(new Phaser.Math.Vector2(this.player.x, this.player.y)) <= range)
      .sort((a, b) => a.actor.distanceTo(new Phaser.Math.Vector2(this.player.x, this.player.y)) - b.actor.distanceTo(new Phaser.Math.Vector2(this.player.x, this.player.y)))[0];
    if (!enemy) return;
    this.damageEnemy(enemy, damage, new Phaser.Math.Vector2(this.player.x, this.player.y), '#f8e184', 28);
  }

  protected damageEnemy(enemy: EnemyActor, damage: number, source: Phaser.Math.Vector2, color = '#f8e184', knockback = 24): void {
    if (enemy.defeated || !enemy.actor.active || enemy.actor.hp <= 0) return;
    this.damageActor(enemy.actor, damage, source, color, knockback);
    if (enemy.actor.hp <= 0) this.defeatEnemy(enemy);
  }

  protected defeatEnemy(enemy: EnemyActor): void {
    if (enemy.defeated) return;
    enemy.defeated = true;
    addItems(GameStore.save.player.unsecured, ENEMIES[enemy.id].loot);
    enemy.actor.playDeathCollapse(() => enemy.actor.destroy());
  }

  private defeatSpiritDog(dog: CardActor): void {
    dog.playDeathCollapse(() => {
      dog.destroy();
      if (this.spiritDog === dog) this.spiritDog = undefined;
    });
  }

  protected damageActor(actor: CardActor, damage: number, source: Phaser.Math.Vector2, color = '#f06b55', knockback = 20): void {
    actor.setHp(actor.hp - damage);
    actor.playHitShake();
    actor.playKnockbackFrom(source, knockback);
    playAudioCue('combatHit');
    this.flashDamage(actor.x, actor.y - 80, `-${damage}`, color);
  }

  private performDodge(pointer?: Phaser.Input.Pointer): void {
    if (this.movementLocked || this.inventoryOpen || this.skillsOpen || this.dodging) return;
    const now = this.time.now;
    const profile = dodgeProfile(GameStore.save, this.player.hp);
    const cooldownRemaining = Math.ceil((this.lastDodge + profile.cooldownMs - now) / 100) / 10;
    if (cooldownRemaining > 0) {
      this.flashDamage(this.player.x, this.player.y - 112, `Dodge ${cooldownRemaining.toFixed(1)}s`, '#ffcf9c');
      return;
    }
    if (!profile.canDodge) {
      this.flashDamage(this.player.x, this.player.y - 112, profile.reason ?? 'Cannot dodge', '#ff9f72');
      return;
    }

    const dir = this.dodgeDirection(pointer);
    GameStore.save.player.energy = Phaser.Math.Clamp(GameStore.save.player.energy - profile.energyCost, 0, 100);
    this.lastDodge = now;
    this.dodgeInvulnerableUntil = now + profile.invulnerabilityMs;
    this.dodging = true;
    this.createDodgeAfterimage();

    const target = this.dodgeTarget(dir, profile.distance);
    playAudioCue('weaponSwing', 0.45);
    this.tweens.killTweensOf(this.player);
    this.tweens.killTweensOf(this.player.card);
    this.tweens.add({
      targets: this.player,
      x: target.x,
      y: target.y,
      duration: 150,
      ease: 'Cubic.easeOut',
      onUpdate: () => this.player.setDepth(this.player.y),
      onComplete: () => {
        this.player.setDepth(this.player.y);
        this.dodging = false;
      }
    });
    this.tweens.add({
      targets: this.player.card,
      alpha: 0.42,
      rotation: dir.x >= 0 ? 0.18 : -0.18,
      scaleX: 1.06,
      scaleY: 0.92,
      duration: 75,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.player.card.alpha = 1;
        this.player.card.rotation = 0;
        this.player.card.scaleX = 1;
        this.player.card.scaleY = 1;
      }
    });
    grantSkillXp(GameStore.save, 'gathering', 2);
  }

  private dodgeDirection(pointer?: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    const keyboardDir = new Phaser.Math.Vector2(
      (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0),
      (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0)
    );
    if (keyboardDir.lengthSq() > 0) return keyboardDir.normalize();
    const source = pointer ?? this.input.activePointer;
    const world = this.cameras.main.getWorldPoint(source.x, source.y);
    const pointerDir = new Phaser.Math.Vector2(world.x - this.player.x, world.y - this.player.y);
    if (pointerDir.lengthSq() > 0) return pointerDir.normalize();
    return new Phaser.Math.Vector2(1, 0);
  }

  private dodgeTarget(dir: Phaser.Math.Vector2, distance: number): Phaser.Math.Vector2 {
    const steps = 8;
    for (let step = steps; step >= 1; step -= 1) {
      const ratio = step / steps;
      const x = Phaser.Math.Clamp(this.player.x + dir.x * distance * ratio, 60, 1860);
      const y = Phaser.Math.Clamp(this.player.y + dir.y * distance * ratio, 80, 1320);
      if (!this.actorBlockedAt(this.player, x, y)) return new Phaser.Math.Vector2(x, y);
    }
    return new Phaser.Math.Vector2(this.player.x, this.player.y);
  }

  private createDodgeAfterimage(): void {
    const ghost = this.add.rectangle(this.player.x, this.player.y - 42, 78, 104, 0xd8eef2, 0.18)
      .setStrokeStyle(2, 0xf4e4b3, 0.3)
      .setDepth(this.player.depth - 1);
    this.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: 0.88,
      scaleY: 0.88,
      duration: 260,
      ease: 'Sine.easeOut',
      onComplete: () => ghost.destroy()
    });
  }

  private isPlayerInvulnerable(): boolean {
    return this.invulnerable || this.time.now <= this.dodgeInvulnerableUntil;
  }

  private weaponIcon(color: number, distance: number): void {
    const pointer = this.input.activePointer;
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dir = new Phaser.Math.Vector2(world.x - this.player.x, world.y - this.player.y).normalize();
    const icon = this.add.rectangle(this.player.x, this.player.y - 40, 42, 12, color, 0.95).setDepth(9_000);
    icon.rotation = dir.angle();
    this.tweens.add({
      targets: icon,
      x: this.player.x + dir.x * distance,
      y: this.player.y - 40 + dir.y * distance,
      alpha: 0,
      duration: 180,
      onComplete: () => icon.destroy()
    });
  }

  protected flashDamage(x: number, y: number, label: string, color: string): void {
    const text = this.add.text(x, y, label, { fontFamily: 'Georgia', fontSize: '18px', color }).setOrigin(0.5).setDepth(9_500);
    this.tweens.add({ targets: text, y: y - 28, alpha: 0, duration: 620, onComplete: () => text.destroy() });
  }

  protected collectLoot(items: Inventory): void {
    addItems(GameStore.save.player.unsecured, items);
    GameStore.save.world.objectives.gatheredResource = true;
    grantSkillXp(GameStore.save, 'gathering', 7);
  }

  protected secureLoot(): void {
    if (Object.values(GameStore.save.player.unsecured).some((count) => (count ?? 0) > 0)) {
      GameStore.save.world.objectives.extractedLoot = true;
    }
    addItems(GameStore.save.player.inventory, GameStore.save.player.unsecured);
    GameStore.save.player.unsecured = {};
    saveGame(GameStore.save);
  }

  protected onPlayerDefeated(): void {
    const lost = createLostLootFromDefeat(GameStore.save, GameStore.save.world.expeditionRoute, this.player.x, this.player.y);
    if (Object.values(lost).some((count) => (count ?? 0) > 0)) {
      this.flashDamage(this.player.x, this.player.y - 132, `Lost pack: ${inventoryText(lost)}`, '#ffcf9c');
    }
    this.player.setHp(65);
    GameStore.save.player.hp = 65;
    saveGame(GameStore.save);
    this.scene.start('FarmScene');
  }

  protected refreshHud(): void {
    const save = GameStore.save;
    this.status.setText([
      `Day ${save.world.day}  ${Math.floor(save.world.minutes / 60).toString().padStart(2, '0')}:${Math.floor(save.world.minutes % 60).toString().padStart(2, '0')}  Siege in ${Math.max(0, 15 - save.world.day)} days`,
      `HP ${Math.ceil(this.player.hp)}/100  Energy ${Math.ceil(save.player.energy)}  Hunger ${Math.ceil(save.player.hunger)}  Spirit ${Math.ceil(save.player.spirit)}  Regen ${effectiveRegenerationPerSecond(save).toFixed(2)}/s`,
      `Skill points ${save.player.skillPoints}  Sword Qi ${save.player.skills.swordQiSlash.unlocked ? 'ready' : 'locked'}  Dog ${save.player.spiritDog.command} ${Math.ceil(save.player.spiritDog.hp)}/80 R${effectivePetRegenerationPerSecond(save).toFixed(2)}/s`,
      encumbrance(save).line,
      survivalStatus(save, this.player.hp).warningLine,
      activeBuffLine(save),
      conditionHudLine(save)
    ].join('\n'));
  }

  protected debugCompleteProduction(): void {
    for (const queue of Object.values(GameStore.save.world.devices)) {
      if (queue[0]) queue[0].remaining = 0;
    }
  }

  private createDebugOverlay(): void {
    this.debugPanel = this.add.rectangle(820, 14, 438, 332, 0x16130d, 0.78)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xd0ad61, 0.88)
      .setScrollFactor(0)
      .setDepth(10_100)
      .setVisible(false);
    this.debugText = this.add.text(836, 28, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: '#f8e8ba',
      lineSpacing: 3,
      wordWrap: { width: 404 }
    }).setScrollFactor(0).setDepth(10_101).setVisible(false);
  }

  private toggleDebugOverlay(): void {
    this.debugVisible = !this.debugVisible;
    this.debugPanel.setVisible(this.debugVisible);
    this.debugText.setVisible(this.debugVisible);
    this.updateDebugOverlay();
  }

  private updateDebugOverlay(): void {
    if (!this.debugVisible) return;
    const save = GameStore.save;
    const attrs = Object.entries(save.player.attributes).map(([key, value]) => `${key.slice(0, 3)}:${value}`).join(' ');
    const affinities = Object.entries(save.player.affinities).map(([key, value]) => `${key}:${value.toFixed(2)}`).join(' ');
    this.debugText.setText([
      'DEBUG OVERLAY  F3 hide',
      `Scene ${this.scene.key}  TimeScale ${save.world.timeScale}  Invul ${this.invulnerable ? 'ON' : 'off'}  Hitboxes ${this.showHitboxes ? 'ON' : 'off'}`,
      `Day ${save.world.day}  Minutes ${save.world.minutes.toFixed(1)}  Core ${save.world.formationCoreHp.toFixed(0)}`,
      `Attributes ${attrs}`,
      `Affinities ${affinities}`,
      `Regeneration base:${save.player.regenerate.toFixed(2)}/s hunger:${Math.round(hungerRegenerationMultiplier(save.player.hunger) * 100)}% effective:${effectiveRegenerationPerSecond(save).toFixed(2)}/s buff:${save.player.buffs.regenerationMultiplier.toFixed(2)}x +${save.player.buffs.regenerationFlat.toFixed(2)}`,
      `Pet regen base:${save.player.spiritDog.regenerate.toFixed(2)}/s effective:${effectivePetRegenerationPerSecond(save).toFixed(2)}/s buff:${save.player.spiritDog.buffs.regenerationMultiplier.toFixed(2)}x +${save.player.spiritDog.buffs.regenerationFlat.toFixed(2)}`,
      `Tools axe:${this.bestToolName('axe')} pick:${this.bestToolName('pickaxe')}`,
      '',
      'F4 time x1/x3/x6/x12',
      'F5 complete production',
      'F6 skip to Day 14 dusk',
      'F7 start siege',
      'F8 spawn ghost near player',
      'F9 toggle hitbox flag',
      'F10 toggle invulnerability',
      'F11 grant resources + iron tools',
      'F12 grant skill point + unlock Sword Qi',
      'I inventory/hotbar assignment',
      '1-8 use hotbar slots',
      'Right Click/Ctrl dodge',
      'T Sword Qi Slash',
      'Q eat best cooked food',
      '[ toggle unarmed player attack'
    ].join('\n'));
  }

  private cycleTimeScale(): void {
    const scales = [1, 3, 6, 12];
    const currentIndex = scales.indexOf(GameStore.save.world.timeScale);
    GameStore.save.world.timeScale = scales[(currentIndex + 1) % scales.length];
  }

  private debugGrantProgression(): void {
    GameStore.save.player.skillPoints += 1;
    unlockSwordQiSlash(GameStore.save);
    grantSkillXp(GameStore.save, 'sword', 60);
    grantSkillXp(GameStore.save, 'gathering', 60);
    grantSkillXp(GameStore.save, 'crafting', 60);
  }

  private toggleUnarmed(): void {
    GameStore.save.player.equipped = GameStore.save.player.equipped === 'unarmed' ? 'rustedSword' : 'unarmed';
    this.flashDamage(this.player.x, this.player.y - 112, `Equipped: ${GameStore.save.player.equipped}`, '#d9f0b0');
  }

  private createP1CombatVisuals(): void {
    this.flameAura = this.add.circle(this.player.x, this.player.y, 82, 0xe05b2a, 0.1)
      .setStrokeStyle(2, 0xff9c4a, 0.5)
      .setDepth(this.player.y - 1)
      .setVisible(GameStore.save.player.passives.minorFlameAura);
    this.orbitingSword = this.add.rectangle(this.player.x + 78, this.player.y - 38, 36, 8, 0xbddbe9, 0.95)
      .setStrokeStyle(1, 0xffffff, 0.8)
      .setDepth(9_000)
      .setVisible(GameStore.save.player.passives.orbitingSword);
  }

  private updateP1Combat(time: number, delta: number): void {
    const save = GameStore.save;
    const metalBonus = 1 + save.player.affinities.metal * 0.03;
    const fireBonus = 1 + save.player.affinities.fire * 0.04;
    if (save.player.passives.orbitingSword) {
      const angle = time / 360;
      this.orbitingSword.setPosition(this.player.x + Math.cos(angle) * 84, this.player.y - 38 + Math.sin(angle) * 34);
      this.orbitingSword.rotation = angle + Math.PI / 2;
      this.orbitingSword.setDepth(this.player.y + 12);
      this.orbitingSwordTimer -= delta;
      if (this.orbitingSwordTimer <= 0) {
        this.orbitingSwordTimer = Math.max(700, 1700 - save.player.skills.sword.level * 90);
        this.damageNearest(Math.round(10 * metalBonus), 138);
        grantSkillXp(save, 'sword', 3);
      }
    }
    if (save.player.passives.minorFlameAura) {
      this.flameAura.setPosition(this.player.x, this.player.y);
      this.flameAura.setDepth(this.player.y - 2);
      this.flameAura.setAlpha(0.08 + Math.sin(time / 180) * 0.035);
      this.flameAuraTimer -= delta;
      if (this.flameAuraTimer <= 0) {
        this.flameAuraTimer = 900;
        for (const enemy of this.enemies) {
          if (enemy.actor.hp > 0 && Phaser.Math.Distance.Between(enemy.actor.x, enemy.actor.y, this.player.x, this.player.y) <= 84) {
            const damage = Math.round(5 * fireBonus);
            this.damageEnemy(enemy, damage, new Phaser.Math.Vector2(this.player.x, this.player.y), '#ff8c4c', 12);
          }
        }
      }
    }
  }

  private createSpiritDog(): void {
    const dogState = GameStore.save.player.spiritDog;
    if (!dogState.unlocked) return;
    this.spiritDog = new CardActor(this, this.player.x - 82, this.player.y + 44, 'Spirit Dog', 0x876e54, 80, 170, 'petDog');
    this.spiritDog.setScale(0.5);
    this.spiritDog.setHp(dogState.hp);
  }

  private updateSpiritDog(delta: number): void {
    const dog = this.spiritDog;
    if (!dog || dog.hp <= 0) return;
    const command = GameStore.save.player.spiritDog.command;
    const petRegen = effectivePetRegenerationPerSecond(GameStore.save);
    if (petRegen > 0 && dog.hp < dog.maxHp) dog.setHp(dog.hp + petRegen * delta / 1000);
    const targetPoint = this.spiritDogTarget(command);
    let moving = false;
    let facingX = 0;
    if (targetPoint) {
      const dist = Phaser.Math.Distance.Between(dog.x, dog.y, targetPoint.x, targetPoint.y);
      if (dist > 28) {
        const dir = new Phaser.Math.Vector2(targetPoint.x - dog.x, targetPoint.y - dog.y).normalize();
        facingX = dir.x;
        moving = this.moveActorWithCollision(dog, dir.x * dog.speed * delta / 1000, dir.y * dog.speed * delta / 1000, {
          minX: 40,
          maxX: 1880,
          minY: 60,
          maxY: 1340
        });
      }
    }
    dog.setDepth(dog.y);
    dog.wobble(this.time.now, moving, command === 'attack', facingX);
    this.spiritDogAttackTimer -= delta;
    if (command === 'attack' || command === 'guard') this.spiritDogAttack();
    GameStore.save.player.spiritDog.hp = dog.hp;
  }

  private spiritDogTarget(command: string): Phaser.Math.Vector2 | undefined {
    if (command === 'retreat') return new Phaser.Math.Vector2(this.player.x - 130, this.player.y + 90);
    if (command === 'guard') return new Phaser.Math.Vector2(this.player.x + 58, this.player.y + 54);
    const enemy = this.nearestEnemy(this.spiritDog?.x ?? this.player.x, this.spiritDog?.y ?? this.player.y, 360);
    if (command === 'attack' && enemy) return new Phaser.Math.Vector2(enemy.actor.x, enemy.actor.y);
    return new Phaser.Math.Vector2(this.player.x - 82, this.player.y + 44);
  }

  private spiritDogAttack(): void {
    const dog = this.spiritDog;
    if (!dog) return;
    const enemy = this.nearestEnemy(dog.x, dog.y, 104);
    if (!enemy || this.spiritDogAttackTimer > 0) return;
    this.spiritDogAttackTimer = 850;
    dog.playUnarmedMeleeLunge(new Phaser.Math.Vector2(enemy.actor.x, enemy.actor.y));
    const damage = 8 + Math.floor(GameStore.save.player.affinities.light);
    this.damageEnemy(enemy, damage, new Phaser.Math.Vector2(dog.x, dog.y), '#d9f0b0', 22);
  }

  private nearestEnemy(x: number, y: number, range: number): EnemyActor | undefined {
    return this.enemies
      .filter((candidate) => !candidate.defeated && candidate.actor.hp > 0 && Phaser.Math.Distance.Between(candidate.actor.x, candidate.actor.y, x, y) <= range)
      .sort((a, b) => Phaser.Math.Distance.Between(a.actor.x, a.actor.y, x, y) - Phaser.Math.Distance.Between(b.actor.x, b.actor.y, x, y))[0];
  }

  private enemyTarget(enemy: EnemyActor): CardActor {
    const playerDistance = Phaser.Math.Distance.Between(enemy.actor.x, enemy.actor.y, this.player.x, this.player.y);
    const dog = this.spiritDog;
    if (!dog || dog.hp <= 0) return this.player;

    const dogDistance = Phaser.Math.Distance.Between(enemy.actor.x, enemy.actor.y, dog.x, dog.y);
    const dogInAttackRange = dogDistance <= 84;
    const playerInAttackRange = playerDistance <= 84;
    if (dogInAttackRange && !playerInAttackRange) return dog;
    if (dogInAttackRange && playerInAttackRange) return dogDistance <= playerDistance ? dog : this.player;
    if (dogDistance < playerDistance && GameStore.save.player.spiritDog.command !== 'retreat') return dog;
    return this.player;
  }

  private setSpiritDogCommand(command: 'follow' | 'attack' | 'guard' | 'retreat'): void {
    if (!GameStore.save.player.spiritDog.unlocked) return;
    GameStore.save.player.spiritDog.command = command;
    this.flashDamage(this.player.x, this.player.y - 112, `Dog: ${command}`, '#d9f0b0');
  }

  private bestToolName(role: 'axe' | 'pickaxe'): string {
    const tool = (Object.keys(GameStore.save.player.inventory) as ItemId[])
      .filter((itemId) => role === 'axe' ? itemId === 'ironAxe' || itemId === 'woodenAxe' : itemId === 'ironPickaxe' || itemId === 'stonePickaxe')
      .sort((a, b) => Number(a.startsWith('iron')) - Number(b.startsWith('iron')))
      .at(-1);
    return tool ?? 'none';
  }

  private consumeBestFood(): void {
    const candidates: ItemId[] = ['herbSteak', 'grilledMeat'];
    for (const itemId of candidates) {
      const item = ITEMS[itemId];
      if (!item.hungerRestore) continue;
      if (removeItems(GameStore.save.player.inventory, { [itemId]: 1 }) || removeItems(GameStore.save.player.storage, { [itemId]: 1 })) {
        GameStore.save.player.hunger = Phaser.Math.Clamp(GameStore.save.player.hunger + item.hungerRestore, 0, 100);
        const buffName = applyConsumableBuff(GameStore.save, itemId);
        this.flashDamage(this.player.x, this.player.y - 112, `Ate ${item.name} +${item.hungerRestore} Hunger`, '#dff0a8');
        if (buffName) this.flashDamage(this.player.x, this.player.y - 136, buffName, '#f8e7b8');
        playAudioCue('pickup');
        saveGame(GameStore.save);
        this.updateHotbarHud();
        return;
      }
    }
    this.flashDamage(this.player.x, this.player.y - 112, 'No cooked food', '#ff9f72');
  }
}
