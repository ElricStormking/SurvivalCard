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
  gathering: {
    baseMs: {
      tree: 3200,
      ore: 4300,
      herb: 1700
    },
    skillReductionPerLevel: 0.07,
    minimumSkillMultiplier: 0.55
  },
  debug: {
    resourceGrantAmount: 10
  }
} as const;
