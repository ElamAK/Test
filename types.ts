
export type CalculationMode = 'standard' | 'versus';
export type DiceType = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export type DiceConfig = Partial<Record<DiceType, number>>;

export interface ProbabilityState {
  dice: DiceConfig;
  skill: number; // Base Skill value added to sum
  modifier: number; // Situational modifier (+/-)
  target: number; // DC / Target Number
  advantage: boolean; // Roll set twice, take highest sum
  disadvantage: boolean; // Roll set twice, take lowest sum
  mode: CalculationMode;
}

export interface Preset {
  id: string;
  name: string;
  state: ProbabilityState;
}

export interface DistributionData {
  outcome: number;
  probability: number;
}

export interface SimulationResult {
  chance: number; // 0-100
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  distribution: DistributionData[];
}

export interface RollDetail {
  total: number;
  diceTotal: number;
  breakdown: string; // e.g. "1d20(15) + 2d6(3,5)"
  skill: number;
  mod: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  isSuccess: boolean;
  finalTotal: number;
  target: number;
  rollType: 'NORMAL' | 'ADV' | 'DIS';
  rolls: RollDetail[]; // [0] = first roll, [1] = second roll (if adv/dis)
}

// More geometric variety for clip-paths
export const CLIP_PATH_CHAMFER = 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)';
export const CLIP_PATH_NOTCHED = 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))';
export const CLIP_PATH_TAG = 'polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%)';
export const CLIP_PATH_SLANT_BOTTOM = 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)';
export const CLIP_PATH_SLANT_TOP = 'polygon(0 0, 95% 0, 100% 15%, 100% 100%, 0 100%)';
