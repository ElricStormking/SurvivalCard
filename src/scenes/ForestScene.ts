import Phaser from 'phaser';
import { BasePlayScene } from './BasePlayScene';
import { EXPEDITIONS } from '../data/expeditions';
import { ITEMS } from '../data/items';
import { itemIconKey } from '../data/itemIcons';
import { TUNING } from '../data/tuning';
import { GameStore } from '../state/GameStore';
import { addItems, hasItems, inventoryText } from '../systems/inventory';
import { playAudioCue } from '../systems/audio';
import { dailyCondition, conditionHudLine } from '../systems/dailyConditions';
import { damageDurability, durabilityCurrent, durabilityMax } from '../systems/durability';
import { encumbrance } from '../systems/encumbrance';
import { hasInventoryItems, recoverLostLoot } from '../systems/lostLoot';
import { itemConditionState, toolWorkDurationMultiplier } from '../systems/maintenance';
import { saveGame } from '../systems/save';
import type { EnemyId, ExpeditionRouteId, Inventory, ItemId } from '../types';

const TREE_NODE_TEXTURES = ['treePine', 'treeJuniper', 'treeCupressaceae', 'treeBirch', 'treeGeneric', 'treeBamboo', 'treeWillow'];
const BACKGROUND_TREE_COUNT: Record<ExpeditionRouteId, number> = {
  pineForest: 46,
  ironRidge: 26
};

type ForestNodeSpec = Omit<Node, 'used' | 'shape' | 'label' | 'obstacle'> & { ambient?: boolean };

interface Node {
  kind: 'tree' | 'ore' | 'herb';
  x: number;
  y: number;
  ambient?: boolean;
  used: boolean;
  shape: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  obstacle: { x: number; y: number; radius: number; active: boolean };
}

interface GatheringJob {
  node: Node;
  elapsedMs: number;
  durationMs: number;
  fill: Phaser.GameObjects.Rectangle;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  toolIcon: Phaser.GameObjects.Image;
  toolTween: Phaser.Tweens.Tween;
  tool?: ItemId;
}

interface DroppedMaterial {
  itemId: ItemId;
  amount: number;
  container: Phaser.GameObjects.Container;
  collecting: boolean;
  pickupDelayMs: number;
}

export class ForestScene extends BasePlayScene {
  private nodes: Node[] = [];
  private droppedMaterials: DroppedMaterial[] = [];
  private extractZone!: Phaser.GameObjects.Rectangle;
  private gatheringJob?: GatheringJob;
  private routeId: ExpeditionRouteId = 'pineForest';
  private danger = 0;
  private dangerThresholdIndex = 0;
  private expeditionLootCount = 0;
  private lostLootBag?: Phaser.GameObjects.Container;
  private dangerPanel?: Phaser.GameObjects.Container;
  private dangerFill?: Phaser.GameObjects.Rectangle;
  private dangerText?: Phaser.GameObjects.Text;

  constructor() {
    super('ForestScene');
  }

  create(): void {
    GameStore.save.world.scene = 'forest';
    this.routeId = GameStore.save.world.expeditionRoute ?? 'pineForest';
    const route = EXPEDITIONS[this.routeId];
    const condition = dailyCondition(GameStore.save);
    GameStore.save.world.objectives.visitedForest = true;
    this.add.rectangle(960, 700, 1920, 1400, route.tint);
    this.add.rectangle(960, 700, 1920, 1400, condition.tint, condition.tintAlpha).setDepth(1_000);
    this.add.text(760, 112, route.name, {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#f1dfaa',
      stroke: '#14160f',
      strokeThickness: 4
    }).setDepth(1_500);
    this.createPlayer(220, 680);
    this.createControls();
    this.createHud();
    this.createDangerHud();
    this.createNodes();
    route.enemies.forEach((enemy) => this.spawnEnemy(enemy.id, enemy.x, enemy.y));
    this.extractZone = this.add.rectangle(170, 680, 130, 190, 0x9bcf8c, 0.2).setStrokeStyle(2, 0xd8f0b2);
    this.add.text(105, 560, route.extractionLabel, { fontFamily: 'Georgia', fontSize: '15px', color: '#e7f4c8' }).setDepth(700);
    this.createLostLootBag();
    this.input.keyboard?.on('keydown-E', () => this.interact());
    this.input.keyboard?.on('keydown-TAB', () => this.extract());
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.updateExpeditionDanger(delta);
    this.updateGathering(delta);
    this.updateDroppedMaterials(delta);
    this.updateDangerHud();
  }

  private createDangerHud(): void {
    const panel = this.add.container(878, 184).setScrollFactor(0).setDepth(10_002);
    const bg = this.add.rectangle(0, 0, 382, 82, 0x15110c, 0.74)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xc6a662, 0.82);
    const label = this.add.text(16, 12, 'Expedition Danger', {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: '#f6e5b8'
    });
    const barBg = this.add.rectangle(16, 42, 350, 12, 0x24180f, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x5c4227, 0.9);
    this.dangerFill = this.add.rectangle(16, 42, 0, 12, 0xd0ad3f, 0.95).setOrigin(0, 0);
    this.dangerText = this.add.text(16, 60, '', {
      fontFamily: 'Georgia',
      fontSize: '11px',
      color: '#cdbb91'
    });
    panel.add([bg, label, barBg, this.dangerFill, this.dangerText]);
    this.dangerPanel = panel;
    this.updateDangerHud();
  }

  private updateExpeditionDanger(delta: number): void {
    const route = EXPEDITIONS[this.routeId];
    const lootPressure = Math.min(0.38, this.expeditionLootCount * 0.018);
    this.addDanger((route.danger.basePerSecond + lootPressure) * dailyCondition(GameStore.save).dangerMultiplier * encumbrance(GameStore.save).dangerMultiplier * delta / 1000, undefined, false);
  }

  private addDanger(amount: number, reason?: string, showFlash = true): void {
    if (amount <= 0) return;
    const previous = this.danger;
    this.danger = Phaser.Math.Clamp(this.danger + amount, 0, 100);
    if (showFlash && Math.floor(previous) !== Math.floor(this.danger)) {
      this.flashDamage(this.player.x, this.player.y - 128, `Danger +${amount.toFixed(1)}`, '#ffcf9c');
    }
    this.releaseDangerReinforcements(reason);
  }

  private releaseDangerReinforcements(reason?: string): void {
    const reinforcements = EXPEDITIONS[this.routeId].danger.reinforcements;
    while (this.dangerThresholdIndex < reinforcements.length && this.danger >= reinforcements[this.dangerThresholdIndex].threshold) {
      const rule = reinforcements[this.dangerThresholdIndex];
      this.spawnDangerReinforcement(rule.enemy, rule.label);
      this.dangerThresholdIndex += 1;
    }
    if (reason) this.flashDamage(this.player.x, this.player.y - 150, reason, '#ffcf9c');
  }

  private spawnDangerReinforcement(enemyId: EnemyId, label: string): void {
    const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
    const distance = Phaser.Math.Between(360, 520);
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 110, 1810);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 130, 1260);
    this.spawnEnemy(enemyId, x, y);
    playAudioCue('siegeWave', 0.62);
    this.flashDamage(x, y - 88, label, '#ff9f72');
    this.cameras.main.shake(160, 0.0025);
  }

  private updateDangerHud(): void {
    if (!this.dangerFill || !this.dangerText) return;
    const ratio = Phaser.Math.Clamp(this.danger / 100, 0, 1);
    this.dangerFill.width = 350 * ratio;
    this.dangerFill.fillColor = this.danger >= 75 ? 0xb94b37 : this.danger >= 40 ? 0xd89a37 : 0xa8b862;
    const next = EXPEDITIONS[this.routeId].danger.reinforcements[this.dangerThresholdIndex];
    const nextText = next ? `Next response at ${next.threshold}%` : 'All local threats alerted';
    this.dangerText.setText(`${Math.round(this.danger)}%  ${dailyCondition(GameStore.save).weatherName}  ${encumbrance(GameStore.save).label}  ${nextText}`);
  }

  private createNodes(): void {
    const route = EXPEDITIONS[this.routeId];
    const specs: ForestNodeSpec[] = [
      ...this.createBackgroundTreeSpecs(),
      ...route.nodes.map((node) => ({ ...node, ambient: false }))
    ];
    this.nodes = specs.map((spec) => {
      const shape = this.createResourceNodeCard(spec.kind, spec.x, spec.y, spec.ambient);
      const label = this.add.text(spec.x, spec.y - this.nodeLabelOffset(spec.kind, spec.ambient), this.nodeTitle(spec.kind), {
        fontFamily: 'Georgia',
        fontSize: spec.ambient ? '10px' : '13px',
        color: '#f3e4b9',
        stroke: '#16200f',
        strokeThickness: spec.ambient ? 2 : 3
      }).setOrigin(0.5).setDepth(spec.y + 4).setAlpha(spec.ambient ? 0.7 : 1);
      const obstacle = this.registerCollisionObstacle(spec.x, spec.y, spec.ambient ? 34 : 42);
      return { ...spec, used: false, shape, label, obstacle };
    });
  }

  private createBackgroundTreeSpecs(): ForestNodeSpec[] {
    const route = EXPEDITIONS[this.routeId];
    const rng = new Phaser.Math.RandomDataGenerator([`${GameStore.save.seed}:${this.routeId}:harvestable-background-trees`]);
    const specs: ForestNodeSpec[] = [];
    const reserved = [
      { x: 220, y: 680, radius: 210 },
      { x: 170, y: 680, radius: 245 },
      ...route.nodes.map((node) => ({ x: node.x, y: node.y, radius: 135 })),
      ...route.enemies.map((enemy) => ({ x: enemy.x, y: enemy.y, radius: 130 }))
    ];
    const targetCount = BACKGROUND_TREE_COUNT[this.routeId];
    let attempts = 0;

    while (specs.length < targetCount && attempts < targetCount * 45) {
      attempts += 1;
      const x = rng.between(95, 1825);
      const y = rng.between(140, 1240);
      if (reserved.some((point) => Phaser.Math.Distance.Between(x, y, point.x, point.y) < point.radius)) continue;
      if (specs.some((point) => Phaser.Math.Distance.Between(x, y, point.x, point.y) < 92)) continue;
      specs.push({ kind: 'tree', x, y, ambient: true });
    }

    return specs;
  }

  private createResourceNodeCard(kind: Node['kind'], x: number, y: number, ambient = false): Phaser.GameObjects.Container {
    if (kind === 'tree') return this.createTreeResourceNode(x, y, ambient);

    const itemId = this.nodeIconItem(kind);
    const accent = kind === 'ore' ? 0xa9a18a : 0x75a85c;
    const container = this.add.container(x, y).setDepth(y);
    const shadow = this.add.ellipse(0, 30, 72, 18, 0x000000, 0.28);
    const post = this.add.rectangle(0, 18, 10, 42, 0x26190e, 0.72)
      .setStrokeStyle(1, 0x4f3a22, 0.85);
    const frame = this.add.rectangle(0, -18, 64, 76, 0x21170f, 0.94)
      .setStrokeStyle(2, 0xd8c17b, 0.98);
    const face = this.add.rectangle(0, -18, 54, 64, kind === 'ore' ? 0x38352c : 0x243d22, 0.9)
      .setStrokeStyle(1, accent, 0.9);
    const iconKey = itemIconKey(itemId);
    const icon = iconKey
      ? this.add.image(0, -24, iconKey).setDisplaySize(42, 42)
      : this.add.text(0, -24, itemId.slice(0, 2).toUpperCase(), {
        fontFamily: 'Georgia',
        fontSize: '16px',
        color: '#fff0bd',
        stroke: '#21150c',
        strokeThickness: 3
      }).setOrigin(0.5);
    const toolText = this.add.text(0, 17, this.nodeToolHint(kind), {
      fontFamily: 'Georgia',
      fontSize: '10px',
      color: '#f2e1ad'
    }).setOrigin(0.5);
    const glint = this.add.rectangle(-18, -47, 18, 4, 0xffffff, 0.18).setAngle(-12);
    container.add([shadow, post, frame, face, icon, toolText, glint]);
    return container;
  }

  private createTreeResourceNode(x: number, y: number, ambient = false): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(y);
    const textureKey = this.treeTextureForNode(x, y);
    const width = ambient ? 70 : 88;
    const height = ambient ? 94 : 118;
    const shadow = this.add.ellipse(0, 32, ambient ? 78 : 96, ambient ? 20 : 24, 0x000000, 0.32);
    const backing = this.add.rectangle(0, ambient ? -42 : -54, ambient ? 74 : 92, ambient ? 100 : 124, 0x21170f, ambient ? 0.82 : 0.92)
      .setStrokeStyle(2, 0xd8c17b, 0.98);
    const art = this.add.image(0, ambient ? -46 : -58, textureKey)
      .setDisplaySize(width, height)
      .setAlpha(ambient ? 0.9 : 0.98);
    const toolPlate = this.add.rectangle(0, ambient ? 8 : 16, 46, 18, 0x1a2715, 0.84)
      .setStrokeStyle(1, 0x8da45a, 0.82);
    const toolText = this.add.text(0, ambient ? 8 : 16, 'axe', {
      fontFamily: 'Georgia',
      fontSize: '10px',
      color: '#f2e1ad'
    }).setOrigin(0.5);
    const glint = this.add.rectangle(ambient ? -18 : -24, ambient ? -84 : -105, ambient ? 18 : 24, 5, 0xffffff, 0.16).setAngle(-12);
    container.add([shadow, backing, art, toolPlate, toolText, glint]);
    return container;
  }

  private treeTextureForNode(x: number, y: number): string {
    const routeOffset = this.routeId === 'ironRidge' ? 3 : 0;
    const index = Math.abs(Math.floor(x * 13 + y * 7 + routeOffset)) % TREE_NODE_TEXTURES.length;
    return TREE_NODE_TEXTURES[index];
  }

  private nodeLabelOffset(kind: Node['kind'], ambient = false): number {
    if (kind === 'tree') return ambient ? 108 : 134;
    return 68;
  }

  private nodeProgressOffset(node: Node): number {
    if (node.kind === 'tree') return node.ambient ? 112 : 136;
    return 70;
  }

  private nodeIconItem(kind: Node['kind']): ItemId {
    if (kind === 'tree') return 'log';
    if (kind === 'ore') return 'ore';
    return 'herb';
  }

  private nodeTitle(kind: Node['kind']): string {
    if (kind === 'tree') return 'Pine Tree';
    if (kind === 'ore') return 'Iron Vein';
    return 'Bitterleaf';
  }

  private nodeToolHint(kind: Node['kind']): string {
    if (kind === 'tree') return 'axe';
    if (kind === 'ore') return 'pick';
    return 'hand';
  }

  private interact(): void {
    if (this.gatheringJob) return;
    if (this.tryRecoverLostLoot()) return;
    const node = this.nodes.find((candidate) => !candidate.used && Phaser.Math.Distance.Between(candidate.x, candidate.y, this.player.x, this.player.y) < 144);
    if (!node) return;
    const requiredRole = this.requiredToolRole(node.kind);
    const bestTool = requiredRole ? this.bestToolForRole(requiredRole, GameStore.save.player.inventory) : undefined;
    if (requiredRole && !bestTool) {
      this.flashDamage(node.x, node.y - 58, `Needs ${requiredRole}`, '#ff9f72');
      return;
    }

    const durationMs = this.gatherDurationMs(node.kind, bestTool);
    if (bestTool) {
      const condition = itemConditionState(GameStore.save, bestTool);
      if (condition === 'worn' || condition === 'fragile') {
        this.flashDamage(this.player.x, this.player.y - 128, `${ITEMS[bestTool].name} ${condition}: slower work`, '#ffcf9c');
      }
    }
    const progressOffset = this.nodeProgressOffset(node);
    const bg = this.add.rectangle(node.x, node.y - progressOffset, 82, 10, 0x1d1712, 0.9).setOrigin(0, 0.5).setDepth(node.y + 4);
    bg.x -= 41;
    const fill = this.add.rectangle(bg.x, bg.y, 0, 10, 0xd8c46d, 0.95).setOrigin(0, 0.5).setDepth(node.y + 5);
    const text = this.add.text(node.x, node.y - progressOffset - 18, `Gathering ${node.kind}`, {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#f6e6b4',
      stroke: '#1c130b',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(node.y + 6);

    const toolAnimation = this.createGatheringToolAnimation(node, bestTool);
    this.gatheringJob = { node, elapsedMs: 0, durationMs, fill, bg, text, tool: bestTool, ...toolAnimation };
    playAudioCue('gatherStart');
    this.movementLocked = true;
  }

  private updateGathering(delta: number): void {
    if (!this.gatheringJob) return;
    const job = this.gatheringJob;
    job.elapsedMs += delta;
    job.fill.width = 82 * Phaser.Math.Clamp(job.elapsedMs / job.durationMs, 0, 1);
    job.text.setText(`Gathering ${job.node.kind} ${Math.ceil(Math.max(0, job.durationMs - job.elapsedMs) / 1000)}s`);

    if (job.elapsedMs < job.durationMs) return;

    const node = job.node;
    node.used = true;
    this.unregisterCollisionObstacle(node.obstacle);
    node.shape.destroy();
    node.label.destroy();
    this.damageGatheringTool(job.tool, node);
    this.spawnDroppedMaterials(this.lootForNode(node.kind), node.x, node.y);
    this.addDanger(EXPEDITIONS[this.routeId].danger.gather, `${this.nodeTitle(node.kind)} noise carries through the route.`);
    playAudioCue('gatherComplete');
    this.flashDamage(node.x, node.y - 40, 'materials dropped', '#dff0a8');
    job.bg.destroy();
    job.fill.destroy();
    job.text.destroy();
    job.toolTween.stop();
    job.toolIcon.destroy();
    this.gatheringJob = undefined;
    this.movementLocked = false;
  }

  private createGatheringToolAnimation(node: Node, tool?: ItemId): Pick<GatheringJob, 'toolIcon' | 'toolTween'> {
    const iconItem = tool ?? 'herb';
    const iconKey = itemIconKey(iconItem) ?? 'iconHerb';
    const start = this.avatarToolAnchor();
    const dir = new Phaser.Math.Vector2(node.x - start.x, node.y - start.y);
    if (dir.lengthSq() > 0) dir.normalize();
    const reach = node.kind === 'herb' ? 24 : 48;
    const targetX = start.x + dir.x * reach;
    const targetY = start.y + dir.y * reach;
    const baseAngle = dir.angle() + Math.PI / 2;
    const swingAngle = node.kind === 'herb' ? 0.32 : 0.82;
    const icon = this.add.image(start.x, start.y, iconKey)
      .setDisplaySize(node.kind === 'herb' ? 28 : 36, node.kind === 'herb' ? 28 : 36)
      .setDepth(this.player.y + 40)
      .setAlpha(0.96);
    icon.rotation = baseAngle - swingAngle * 0.5;

    const tween = this.tweens.add({
      targets: icon,
      x: targetX,
      y: targetY,
      rotation: baseAngle + swingAngle,
      duration: node.kind === 'herb' ? 270 : 210,
      ease: node.kind === 'herb' ? 'Sine.easeInOut' : 'Quad.easeIn',
      yoyo: true,
      repeat: -1,
      repeatDelay: node.kind === 'herb' ? 90 : 45,
      onYoyo: () => this.flashGatherImpact(node),
      onRepeat: () => {
        const anchor = this.avatarToolAnchor();
        icon.setPosition(anchor.x, anchor.y);
        icon.setDepth(this.player.y + 40);
      }
    });

    return { toolIcon: icon, toolTween: tween };
  }

  private avatarToolAnchor(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.player.x + 24, this.player.y - 52);
  }

  private flashGatherImpact(node: Node): void {
    if (!this.gatheringJob || this.gatheringJob.node !== node) return;
    playAudioCue(node.kind === 'ore' ? 'gatherMine' : node.kind === 'tree' ? 'gatherChop' : 'gatherHerb', 0.72);
    const spark = this.add.circle(node.x, node.y - 10, node.kind === 'herb' ? 5 : 7, node.kind === 'ore' ? 0xd8d0aa : node.kind === 'tree' ? 0xd0a45d : 0xa6d58a, 0.55)
      .setDepth(node.y + 8);
    this.tweens.add({
      targets: spark,
      scale: 1.8,
      alpha: 0,
      duration: 160,
      ease: 'Sine.easeOut',
      onComplete: () => spark.destroy()
    });
  }

  private lootForNode(kind: Node['kind']): Inventory {
    if (kind === 'tree') return { log: 2, resin: 1 };
    if (kind === 'ore') return { ore: 2, stone: 1 };
    return { herb: 3 };
  }

  private spawnDroppedMaterials(items: Inventory, x: number, y: number): void {
    const drops = Object.entries(items) as [ItemId, number][];
    let index = 0;
    for (const [itemId, count] of drops) {
      for (let amount = 0; amount < count; amount += 1) {
        const angle = (index / Math.max(1, this.dropCount(items))) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.28, 0.28);
        const distance = Phaser.Math.Between(32, 58);
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance * 0.72;
        const container = this.createMaterialDropIcon(itemId, x, y);
        this.droppedMaterials.push({ itemId, amount: 1, container, collecting: false, pickupDelayMs: 260 });
        this.tweens.add({
          targets: container,
          x: targetX,
          y: targetY,
          scale: 1,
          duration: 220,
          ease: 'Back.easeOut',
          onUpdate: () => container.setDepth(container.y + 18)
        });
        index += 1;
      }
    }
  }

  private updateDroppedMaterials(delta: number): void {
    if (!this.droppedMaterials.length) return;
    for (const drop of this.droppedMaterials) {
      if (!drop.container.active) continue;
      drop.pickupDelayMs = Math.max(0, drop.pickupDelayMs - delta);
      const dist = Phaser.Math.Distance.Between(drop.container.x, drop.container.y, this.player.x, this.player.y);
      if (!drop.collecting && drop.pickupDelayMs <= 0 && dist <= 128) drop.collecting = true;
      if (!drop.collecting) {
        drop.container.y += Math.sin(this.time.now / 220 + drop.container.x) * 0.015 * delta;
        drop.container.setDepth(drop.container.y + 18);
        continue;
      }

      const dir = new Phaser.Math.Vector2(this.player.x - drop.container.x, this.player.y - 42 - drop.container.y);
      const length = Math.max(1, dir.length());
      dir.normalize();
      const speed = 380 + Math.min(360, length * 4);
      const step = Math.min(length, speed * delta / 1000);
      drop.container.x += dir.x * step;
      drop.container.y += dir.y * step;
      drop.container.setScale(Math.max(0.55, drop.container.scaleX - delta * 0.0012));
      drop.container.setDepth(drop.container.y + 18);

      if (length <= 18) {
        addItems(GameStore.save.player.inventory, { [drop.itemId]: drop.amount });
        this.expeditionLootCount += drop.amount;
        this.addDanger(EXPEDITIONS[this.routeId].danger.pickup * drop.amount, undefined, false);
        GameStore.save.world.objectives.gatheredResource = true;
        GameStore.save.world.objectives.extractedLoot = true;
        playAudioCue('pickup', 0.65);
        drop.container.destroy();
      }
    }

    const before = this.droppedMaterials.length;
    this.droppedMaterials = this.droppedMaterials.filter((drop) => drop.container.active);
    if (this.droppedMaterials.length !== before) saveGame(GameStore.save);
  }

  private createMaterialDropIcon(itemId: ItemId, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setScale(0.2).setDepth(y + 18);
    const shadow = this.add.ellipse(0, 10, 22, 7, 0x000000, 0.25);
    const bg = this.add.rectangle(0, 0, 25, 25, this.dropIconColor(itemId), 0.96)
      .setStrokeStyle(2, 0xf1d99b, 0.95);
    const shine = this.add.rectangle(0, -8, 20, 5, 0xffffff, 0.14);
    const iconKey = itemIconKey(itemId);
    const icon = iconKey
      ? this.add.image(0, 0, iconKey).setDisplaySize(21, 21)
      : this.add.text(0, 1, this.dropIconLabel(itemId), {
        fontFamily: 'Georgia',
        fontSize: '10px',
        color: '#fff0bd',
        stroke: '#21150c',
        strokeThickness: 2
      }).setOrigin(0.5);
    container.add([shadow, bg, icon, shine]);
    return container;
  }

  private dropCount(items: Inventory): number {
    return Object.values(items).reduce((sum, count) => sum + (count ?? 0), 0);
  }

  private dropIconLabel(itemId: ItemId): string {
    const labels: Partial<Record<ItemId, string>> = {
      log: 'Lg',
      resin: 'Rs',
      ore: 'Or',
      stone: 'St',
      herb: 'Hb',
      meat: 'Mt',
      spiritPaper: 'Sp'
    };
    return labels[itemId] ?? itemId.slice(0, 2).toUpperCase();
  }

  private createLostLootBag(): void {
    const lost = GameStore.save.world.lostLoot;
    if (!lost || lost.route !== this.routeId || !hasInventoryItems(lost.items)) return;

    const firstItem = (Object.keys(lost.items) as ItemId[]).find((itemId) => (lost.items[itemId] ?? 0) > 0);
    const iconKey = firstItem ? itemIconKey(firstItem) : undefined;
    const container = this.add.container(lost.x, lost.y).setDepth(lost.y + 24);
    const shadow = this.add.ellipse(0, 38, 72, 16, 0x000000, 0.32);
    const aura = this.add.ellipse(0, 8, 88, 62, 0xd0ad61, 0.12)
      .setStrokeStyle(1, 0xd0ad61, 0.42);
    const sack = this.add.rectangle(0, 8, 64, 70, 0x2b1c12, 0.96)
      .setStrokeStyle(3, 0xd8c17b, 0.98);
    const flap = this.add.rectangle(0, -24, 56, 16, 0x5d3a20, 0.94)
      .setStrokeStyle(1, 0xa77f47, 0.9);
    const icon = iconKey
      ? this.add.image(0, 5, iconKey).setDisplaySize(34, 34)
      : this.add.text(0, 5, 'LO', {
        fontFamily: 'Georgia',
        fontSize: '15px',
        color: '#ffe6a7',
        stroke: '#1a120b',
        strokeThickness: 3
      }).setOrigin(0.5);
    const label = this.add.text(0, -50, 'Lost Pack', {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#ffdf9a',
      stroke: '#16110b',
      strokeThickness: 4
    }).setOrigin(0.5);
    const hint = this.add.text(0, 58, 'E recover', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#f4e4b8',
      stroke: '#16110b',
      strokeThickness: 3
    }).setOrigin(0.5);
    container.add([shadow, aura, sack, flap, icon, label, hint]);
    this.tweens.add({
      targets: aura,
      alpha: { from: 0.08, to: 0.22 },
      scale: { from: 0.92, to: 1.08 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.lostLootBag = container;
  }

  private tryRecoverLostLoot(): boolean {
    const lost = GameStore.save.world.lostLoot;
    if (!lost || !this.lostLootBag || lost.route !== this.routeId) return false;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lostLootBag.x, this.lostLootBag.y) > 135) return false;

    const recovered = recoverLostLoot(GameStore.save);
    if (!hasInventoryItems(recovered)) {
      this.lostLootBag.destroy();
      this.lostLootBag = undefined;
      saveGame(GameStore.save);
      return true;
    }

    this.flashDamage(this.lostLootBag.x, this.lostLootBag.y - 70, `Recovered ${inventoryText(recovered)}`, '#dff0a8');
    this.addDanger(4, 'Recovering a lost pack stirs the forest.');
    playAudioCue('pickup', 0.78);
    this.lostLootBag.destroy();
    this.lostLootBag = undefined;
    saveGame(GameStore.save);
    this.updateHotbarHud();
    return true;
  }

  private isNearLostLoot(): boolean {
    if (!this.lostLootBag) return false;
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lostLootBag.x, this.lostLootBag.y) <= 135;
  }

  private dropIconColor(itemId: ItemId): number {
    if (itemId === 'herb') return 0x5d9b54;
    if (itemId === 'ore') return 0x78776d;
    if (itemId === 'stone') return 0x6c6a61;
    if (itemId === 'resin') return 0xb48338;
    if (itemId === 'meat') return 0x8f4e3d;
    if (itemId === 'spiritPaper') return 0x9ab9c8;
    return 0x7a5631;
  }

  private requiredToolRole(kind: Node['kind']): 'axe' | 'pickaxe' | undefined {
    if (kind === 'tree') return 'axe';
    if (kind === 'ore') return 'pickaxe';
    return undefined;
  }

  private gatherDurationMs(kind: Node['kind'], tool?: ItemId): number {
    const inventory = GameStore.save.player.inventory;
    const skillLevel = GameStore.save.player.skills.gathering.level;
    const skillMultiplier = Math.max(TUNING.gathering.minimumSkillMultiplier, 1 - (skillLevel - 1) * TUNING.gathering.skillReductionPerLevel);
    const toolMultiplier = this.toolSpeedMultiplier(tool, inventory);
    return Math.round(TUNING.gathering.baseMs[kind] * skillMultiplier * toolMultiplier * dailyCondition(GameStore.save).gatheringMultiplier);
  }

  private toolSpeedMultiplier(tool: ItemId | undefined, inventory: Inventory): number {
    if (!tool) return 1;
    if (!hasItems(inventory, { [tool]: 1 })) return 1;
    return (ITEMS[tool].gatherSpeedMultiplier ?? 1) * toolWorkDurationMultiplier(GameStore.save, tool);
  }

  private bestToolForRole(role: 'axe' | 'pickaxe', inventory: Inventory): ItemId | undefined {
    return (Object.keys(inventory) as ItemId[])
      .filter((itemId) => (inventory[itemId] ?? 0) > 0 && ITEMS[itemId]?.toolRole === role)
      .sort((a, b) => (ITEMS[b].toolTier ?? 0) - (ITEMS[a].toolTier ?? 0))[0];
  }

  private damageGatheringTool(tool: ItemId | undefined, node: Node): void {
    if (!tool) return;
    const amount = node.kind === 'ore' ? 5 : 4;
    const result = damageDurability(GameStore.save, tool, amount);
    if (!result) return;
    if (result.broke) this.flashDamage(this.player.x, this.player.y - 120, `${ITEMS[tool].name} broke`, '#ff9f72');
    else this.flashDamage(this.player.x, this.player.y - 120, `${ITEMS[tool].name} ${Math.ceil(result.current)}/${result.max}`, '#cdbb91');
    saveGame(GameStore.save);
  }

  private extract(): void {
    if (this.gatheringJob) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.extractZone.x, this.extractZone.y) > 120) return;
    this.recordExtractionStats();
    this.secureLoot();
    this.scene.start('FarmScene');
  }

  private recordExtractionStats(): void {
    const stats = GameStore.save.world.expeditionStats[this.routeId];
    stats.extractions += 1;
    if (this.enemies.length === 0 || this.nodes.every((node) => node.used)) {
      stats.clears += 1;
    }
  }

  protected refreshHud(): void {
    super.refreshHud();
    const gatheringText = this.gatheringJob ? ' Gathering locks movement until the node is collected.' : '';
    const lostPackText = this.isNearLostLoot() ? 'E recover lost pack.' : 'E gather nearby nodes.';
    this.prompt.setText([
      EXPEDITIONS[this.routeId].name,
      conditionHudLine(GameStore.save),
      lostPackText,
      'Left Click/Space attack. Right Click/Ctrl dodge. T Sword Qi.',
      'I Inventory. K Skills. 1-8 Hotbar.',
      'TAB extract at the green path.',
      gatheringText.trim()
    ].filter(Boolean).join('\n'));
  }
}
