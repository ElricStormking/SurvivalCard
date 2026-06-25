export const TUNING = {
  survival: {
    baseRegenerationPerSecond: 0.45,
    basePetRegenerationPerSecond: 0.28,
    regenerationSkillBonusPerLevel: 0.05,
    hungerDrainPerWorldSecond: 0.18,
    sprintEnergyDrainPerSecond: 9,
    idleEnergyRecoveryPerSecond: 5,
    movingEnergyRecoveryPerSecond: 2.5,
    starvationDamagePerSecond: 2
  },
  dodge: {
    energyCost: 16,
    cooldownMs: 650,
    invulnerabilityMs: 240,
    baseDistance: 118,
    agilityDistanceBonus: 2.5,
    exhaustedDistanceMultiplier: 0.72
  },
  gathering: {
    baseMs: {
      tree: 3200,
      ore: 4300,
      herb: 1700
    },
    skillReductionPerLevel: 0.07,
    minimumSkillMultiplier: 0.55
  },
  production: {
    skillReductionPerLevel: 0.05,
    intelligenceReductionPerPoint: 0.01,
    minimumDurationMultiplier: 0.55
  },
  debug: {
    resourceGrantAmount: 10
  }
} as const;
