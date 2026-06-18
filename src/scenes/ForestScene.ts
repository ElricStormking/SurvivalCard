import Phaser from 'phaser';
import { BasePlayScene } from './BasePlayScene';
import { ITEMS } from '../data/items';
import { itemIconKey } from '../data/itemIcons';
import { TUNING } from '../data/tuning';
import { GameStore } from '../state/GameStore';
import { addItems, hasItems } from '../systems/inventory';
import { saveGame } from '../systems/save';
import type { Inventory, ItemId } from '../types';

interface Node {
  kind: 'tree' | 'ore' | 'herb';
  x: number;
  y: number;
  used: boolean;
  shape: Phaser.GameObjects.GameObject;
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

  constructor() {
    super('ForestScene');
  }

  create(): void {
    GameStore.save.world.scene = 'forest';
    GameStore.save.world.objectives.visitedForest = true;
    this.add.rectangle(960, 700, 1920, 1400, 0x152116);
    for (let i = 0; i < 70; i += 1) {
      this.add.triangle(Phaser.Math.Between(80, 1840), Phaser.Math.Between(100, 1260), 0, 55, 34, 0, 68, 55, 0x263b22, 0.8).setDepth(Phaser.Math.Between(100, 1260));
    }
    this.createPlayer(220, 680);
    this.createControls();
    this.createHud();
    this.createNodes();
    this.spawnEnemy('boar', 820, 520);
    this.spawnEnemy('wolf', 1200, 760);
    this.spawnEnemy('ghost', 1450, 520);
    this.extractZone = this.add.rectangle(170, 680, 130, 190, 0x9bcf8c, 0.2).setStrokeStyle(2, 0xd8f0b2);
    this.add.text(105, 560, 'Extraction Path', { fontFamily: 'Georgia', fontSize: '15px', color: '#e7f4c8' }).setDepth(700);
    this.input.keyboard?.on('keydown-E', () => this.interact());
    this.input.keyboard?.on('keydown-TAB', () => this.extract());
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.updateGathering(delta);
    this.updateDroppedMaterials(delta);
  }

  private createNodes(): void {
    const specs: Omit<Node, 'used' | 'shape' | 'label' | 'obstacle'>[] = [
      { kind: 'tree', x: 520, y: 420 },
      { kind: 'tree', x: 720, y: 860 },
      { kind: 'ore', x: 1120, y: 420 },
      { kind: 'ore', x: 1380, y: 910 },
      { kind: 'herb', x: 900, y: 690 },
      { kind: 'herb', x: 1530, y: 650 }
    ];
    this.nodes = specs.map((spec) => {
      const color = spec.kind === 'tree' ? 0x446c32 : spec.kind === 'ore' ? 0x81806f : 0x6cab63;
      const shape = this.add.circle(spec.x, spec.y, 28, color, 0.92).setStrokeStyle(2, 0xe8d7a0).setDepth(spec.y);
      const label = this.add.text(spec.x, spec.y - 48, spec.kind, { fontFamily: 'Georgia', fontSize: '13px', color: '#f3e4b9' }).setOrigin(0.5).setDepth(spec.y + 1);
      const obstacle = this.registerCollisionObstacle(spec.x, spec.y, 34);
      return { ...spec, used: false, shape, label, obstacle };
    });
  }

  private interact(): void {
    if (this.gatheringJob) return;
    const node = this.nodes.find((candidate) => !candidate.used && Phaser.Math.Distance.Between(candidate.x, candidate.y, this.player.x, this.player.y) < 144);
    if (!node) return;
    const requiredRole = this.requiredToolRole(node.kind);
    const bestTool = requiredRole ? this.bestToolForRole(requiredRole, GameStore.save.player.inventory) : undefined;
    if (requiredRole && !bestTool) {
      this.flashDamage(node.x, node.y - 58, `Needs ${requiredRole}`, '#ff9f72');
      return;
    }

    const durationMs = this.gatherDurationMs(node.kind, bestTool);
    const bg = this.add.rectangle(node.x, node.y - 70, 82, 10, 0x1d1712, 0.9).setOrigin(0, 0.5).setDepth(node.y + 4);
    bg.x -= 41;
    const fill = this.add.rectangle(bg.x, bg.y, 0, 10, 0xd8c46d, 0.95).setOrigin(0, 0.5).setDepth(node.y + 5);
    const text = this.add.text(node.x, node.y - 88, `Gathering ${node.kind}`, {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#f6e6b4',
      stroke: '#1c130b',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(node.y + 6);

    const toolAnimation = this.createGatheringToolAnimation(node, bestTool);
    this.gatheringJob = { node, elapsedMs: 0, durationMs, fill, bg, text, ...toolAnimation };
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
    this.spawnDroppedMaterials(this.lootForNode(node.kind), node.x, node.y);
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
        GameStore.save.world.objectives.gatheredResource = true;
        GameStore.save.world.objectives.extractedLoot = true;
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
    return Math.round(TUNING.gathering.baseMs[kind] * skillMultiplier * toolMultiplier);
  }

  private toolSpeedMultiplier(tool: ItemId | undefined, inventory: Inventory): number {
    if (!tool) return 1;
    if (!hasItems(inventory, { [tool]: 1 })) return 1;
    return ITEMS[tool].gatherSpeedMultiplier ?? 1;
  }

  private bestToolForRole(role: 'axe' | 'pickaxe', inventory: Inventory): ItemId | undefined {
    return (Object.keys(inventory) as ItemId[])
      .filter((itemId) => (inventory[itemId] ?? 0) > 0 && ITEMS[itemId]?.toolRole === role)
      .sort((a, b) => (ITEMS[b].toolTier ?? 0) - (ITEMS[a].toolTier ?? 0))[0];
  }

  private extract(): void {
    if (this.gatheringJob) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.extractZone.x, this.extractZone.y) > 120) return;
    this.secureLoot();
    this.scene.start('FarmScene');
  }

  protected refreshHud(): void {
    super.refreshHud();
    const gatheringText = this.gatheringJob ? ' Gathering locks movement until the node is collected.' : '';
    this.prompt.setText([
      'Forest',
      'E gather nearby nodes.',
      'Left Click/Space attack. T Sword Qi.',
      'I Inventory. K Skills. 1-8 Hotbar.',
      'TAB extract at the green path.',
      gatheringText.trim()
    ].filter(Boolean).join('\n'));
  }
}
