import Phaser from 'phaser';

export class CardActor extends Phaser.GameObjects.Container {
  bodyCircle: Phaser.GameObjects.Arc;
  card: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Rectangle;
  private shadow: Phaser.GameObjects.Ellipse;
  private survivalBars?: Record<'hp' | 'energy' | 'hunger', Phaser.GameObjects.Rectangle>;
  maxHp: number;
  hp: number;
  speed: number;
  private meleeLunging = false;
  private deathCollapsing = false;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, color: number, maxHp: number, speed: number, textureKey?: string) {
    super(scene, x, y);
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.speed = speed;
    this.bodyCircle = scene.add.circle(0, 0, 18, 0x000000, 0.18);
    this.shadow = scene.add.ellipse(0, 14, 58, 18, 0x000000, 0.25);
    this.card = scene.add.container(0, -42);
    if (textureKey) {
      const frame = scene.add.rectangle(0, 0, 78, 104, 0x20170f, 0.94).setStrokeStyle(3, 0xf4e4b3);
      const portrait = scene.add.image(0, 0, textureKey).setDisplaySize(72, 96);
      const glaze = scene.add.rectangle(0, -32, 72, 22, 0xffffff, 0.1);
      this.card.add([frame, portrait, glaze]);
    } else {
      this.card.add(scene.add.rectangle(0, 0, 66, 92, color, 0.95).setStrokeStyle(3, 0xf4e4b3));
    }
    this.label = scene.add.text(0, -88, label, { fontFamily: 'Georgia', fontSize: '12px', color: '#f9efd4' }).setOrigin(0.5);
    const hpBg = scene.add.rectangle(0, -94, 58, 5, 0x1d1712);
    this.hpBar = scene.add.rectangle(-29, -94, 58, 5, 0xb64234).setOrigin(0, 0.5);
    this.add([this.bodyCircle, this.shadow, this.card, this.label, hpBg, this.hpBar]);
    scene.add.existing(this);
  }

  enableSurvivalMeters(): void {
    const rows: { key: 'hp' | 'energy' | 'hunger'; label: string; y: number; color: number }[] = [
      { key: 'hp', label: 'HP', y: -22, color: 0xc74434 },
      { key: 'energy', label: 'EN', y: -11, color: 0xd6a336 },
      { key: 'hunger', label: 'HU', y: 0, color: 0x69a84f }
    ];
    const bars = {} as Record<'hp' | 'energy' | 'hunger', Phaser.GameObjects.Rectangle>;

    for (const row of rows) {
      const label = this.scene.add.text(-28, row.y, row.label, {
        fontFamily: 'Georgia',
        fontSize: '8px',
        color: '#2a1e13'
      }).setOrigin(0, 0.5);
      const bg = this.scene.add.rectangle(-3, row.y, 36, 5, 0x1f1710, 0.82).setOrigin(0, 0.5);
      const fill = this.scene.add.rectangle(-3, row.y, 36, 5, row.color, 0.95).setOrigin(0, 0.5);
      const shine = this.scene.add.rectangle(-3, row.y - 1, 36, 1, 0xfff2c8, 0.35).setOrigin(0, 0.5);
      bars[row.key] = fill;
      this.add([label, bg, fill, shine]);
    }

    this.survivalBars = bars;
  }

  setHp(value: number): void {
    this.hp = Phaser.Math.Clamp(value, 0, this.maxHp);
    this.hpBar.width = 58 * (this.hp / this.maxHp);
    if (this.survivalBars) this.survivalBars.hp.width = 36 * (this.hp / this.maxHp);
  }

  setSurvivalMeters(hp: number, energy: number, hunger: number): void {
    this.setHp(hp);
    if (!this.survivalBars) return;
    this.survivalBars.energy.width = 36 * Phaser.Math.Clamp(energy, 0, 100) / 100;
    this.survivalBars.hunger.width = 36 * Phaser.Math.Clamp(hunger, 0, 100) / 100;
  }

  wobble(time: number, moving: boolean, sprinting = false, facingX = 0): void {
    if (this.meleeLunging || this.deathCollapsing) return;
    const idleFloat = Math.sin(time / 360) * 2.2;
    const walkBob = moving ? Math.sin(time / 110) * (sprinting ? 5.2 : 3.4) : idleFloat;
    const walkTilt = moving ? Math.sin(time / 150) * (sprinting ? 0.1 : 0.06) : Math.sin(time / 420) * 0.025;
    const sprintLean = sprinting ? Phaser.Math.Clamp(facingX, -1, 1) * 0.16 : 0;
    this.card.rotation = walkTilt + sprintLean;
    this.card.y = -42 + walkBob;
    this.card.scaleX = sprinting ? 1.04 : 1;
    this.card.scaleY = sprinting ? 0.97 : 1;
    this.shadow.scaleX = moving ? (sprinting ? 1.16 : 1.08) : 1 + Math.sin(time / 360) * 0.04;
    this.shadow.scaleY = moving ? 0.92 : 1 - Math.sin(time / 360) * 0.04;
  }

  playUnarmedMeleeLunge(target: Phaser.Math.Vector2): void {
    if (this.meleeLunging || this.deathCollapsing || !this.active) return;
    const originX = this.x;
    const originY = this.y;
    const dir = new Phaser.Math.Vector2(target.x - originX, target.y - originY);
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    const lungeDistance = Math.min(68, Phaser.Math.Distance.Between(originX, originY, target.x, target.y) * 0.55);
    const impactX = originX + dir.x * lungeDistance;
    const impactY = originY + dir.y * lungeDistance;
    this.meleeLunging = true;

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.card);
    this.scene.tweens.add({
      targets: this,
      x: impactX,
      y: impactY,
      duration: 95,
      ease: 'Quad.easeOut',
      yoyo: true,
      onUpdate: () => this.setDepth(this.y),
      onComplete: () => {
        this.x = originX;
        this.y = originY;
        this.setDepth(this.y);
        this.meleeLunging = false;
      }
    });
    this.scene.tweens.add({
      targets: this.card,
      y: -58,
      scaleX: 1.08,
      scaleY: 0.94,
      rotation: dir.x >= 0 ? 0.14 : -0.14,
      duration: 95,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.card.y = -42;
        this.card.scaleX = 1;
        this.card.scaleY = 1;
        this.card.rotation = 0;
      }
    });
  }

  playHitShake(): void {
    if (!this.active || this.deathCollapsing) return;
    this.scene.tweens.killTweensOf(this.card);
    this.scene.tweens.add({
      targets: this.card,
      x: { from: -5, to: 5 },
      y: this.card.y - 3,
      angle: { from: -4, to: 4 },
      duration: 44,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!this.active || this.deathCollapsing) return;
        this.card.x = 0;
        this.card.y = -42;
        this.card.angle = 0;
      }
    });
  }

  playKnockbackFrom(source: Phaser.Math.Vector2, distance = 24): void {
    if (!this.active || this.deathCollapsing || this.meleeLunging) return;
    const dir = new Phaser.Math.Vector2(this.x - source.x, this.y - source.y);
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      x: this.x + dir.x * distance,
      y: this.y + dir.y * distance,
      duration: 120,
      ease: 'Quad.easeOut',
      onUpdate: () => this.setDepth(this.y)
    });
  }

  playCastPulse(color = 0x8ed9f4): void {
    if (!this.active || this.deathCollapsing) return;
    const pulse = this.scene.add.circle(this.x, this.y - 42, 42, color, 0.2)
      .setStrokeStyle(2, color, 0.8)
      .setDepth(this.depth + 4);
    this.scene.tweens.add({
      targets: pulse,
      scale: 2.1,
      alpha: 0,
      duration: 320,
      ease: 'Sine.easeOut',
      onComplete: () => pulse.destroy()
    });
    this.scene.tweens.add({
      targets: this.card,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeOut'
    });
  }

  playDeathCollapse(onComplete?: () => void): void {
    if (!this.active || this.deathCollapsing) return;
    this.deathCollapsing = true;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.card);
    this.scene.tweens.add({
      targets: this.card,
      y: -22,
      angle: this.x % 2 > 1 ? -18 : 18,
      scaleY: 0.2,
      scaleX: 1.12,
      alpha: 0,
      duration: 360,
      ease: 'Back.easeIn',
      onComplete: () => onComplete?.()
    });
    this.scene.tweens.add({
      targets: [this.label, this.hpBar],
      alpha: 0,
      duration: 180
    });
    this.scene.tweens.add({
      targets: this.shadow,
      scaleX: 0.45,
      scaleY: 0.45,
      alpha: 0,
      duration: 360
    });
  }

  distanceTo(other: Phaser.Math.Vector2): number {
    return Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
  }
}
