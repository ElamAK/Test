
import { ProbabilityState, SimulationResult, DistributionData, DiceType, DiceConfig, RollDetail } from "../types";

/**
 * Convolves two probability distributions.
 * @param distA Array where index = value, value = probability
 * @param distB Array where index = value, value = probability
 */
const convolveDistributions = (distA: number[], distB: number[]): number[] => {
  const newMax = (distA.length - 1) + (distB.length - 1);
  const result = new Array(newMax + 1).fill(0);

  for (let a = 0; a < distA.length; a++) {
    if (distA[a] === 0) continue;
    for (let b = 0; b < distB.length; b++) {
      if (distB[b] === 0) continue;
      result[a + b] += distA[a] * distB[b];
    }
  }
  return result;
};

/**
 * Creates a uniform distribution for a single die of N sides.
 * Outcome range: 1 to sides.
 * Index 0 is prob 0. Index 1..sides is 1/sides.
 */
const getSingleDieDist = (sides: number): number[] => {
  const dist = new Array(sides + 1).fill(0);
  for (let i = 1; i <= sides; i++) {
    dist[i] = 1 / sides;
  }
  return dist;
};

/**
 * Calculates the exact probability distribution for a mixed pool of dice using convolution.
 */
const getMixedDiceDistribution = (dice: DiceConfig): number[] => {
  let pdf = [1]; // Start with sum 0 having probability 1

  // Iterate over each dice type in the config
  const types = Object.keys(dice).map(Number) as DiceType[];
  
  for (const sides of types) {
    const count = dice[sides] || 0;
    const singleDiePdf = getSingleDieDist(sides);

    // Convolve 'count' times for this die type
    for (let i = 0; i < count; i++) {
      pdf = convolveDistributions(pdf, singleDiePdf);
    }
  }

  return pdf;
};

/**
 * Adjusts a PDF for Advantage/Disadvantage mechanics.
 * Advantage: P(X <= k) = P(Original <= k)^2 (CDF Logic) - effectively "Roll twice take best"
 */
const applyAdvantageMechanics = (pdf: number[], advantage: boolean, disadvantage: boolean): number[] => {
  if (!advantage && !disadvantage) return pdf;

  // 1. Convert PDF to CDF
  let cdf = new Array(pdf.length).fill(0);
  let accum = 0;
  for (let i = 0; i < pdf.length; i++) {
    accum += pdf[i] || 0;
    cdf[i] = accum;
  }

  // 2. Apply Transform to CDF
  // Adv (Max): New CDF = CDF^2
  // Dis (Min): New CDF = 1 - (1 - CDF)^2
  const newCdf = cdf.map(p => {
    if (advantage) return p * p; // Probability of BOTH being <= k
    if (disadvantage) return 1 - Math.pow(1 - p, 2); // Probability of AT LEAST ONE > k is (1-p)^2, so CDF is complementary
    return p;
  });

  // 3. Convert back to PDF
  const newPdf = new Array(pdf.length).fill(0);
  newPdf[0] = newCdf[0];
  for (let i = 1; i < pdf.length; i++) {
    newPdf[i] = newCdf[i] - newCdf[i - 1];
  }

  return newPdf;
};

export const calculateSimulation = (state: ProbabilityState): SimulationResult => {
  const { dice, skill, modifier, target, advantage, disadvantage } = state;
  const totalMod = skill + modifier;

  // 1. Get Base Distribution of Dice Sum
  let pdf = getMixedDiceDistribution(dice);

  // If no dice selected, pdf is [1] (sum 0).
  // We can treat this as valid (0 + skill vs target).

  // 2. Apply Adv/Dis
  pdf = applyAdvantageMechanics(pdf, advantage, disadvantage);

  // 3. Calculate Statistics
  let successProbability = 0;
  let expectedValue = 0;
  let min = -1;
  let max = 0;

  const distributionData: DistributionData[] = [];

  // Iterate through all possible dice sums
  for (let sum = 0; sum < pdf.length; sum++) {
    const p = pdf[sum];
    if (!p || p <= 0) continue;

    if (min === -1) min = sum;
    max = sum;

    // Total Outcome = Dice Sum + Static Modifiers
    const finalOutcome = sum + totalMod;

    // Check against Target
    if (finalOutcome >= target) {
      successProbability += p;
    }

    expectedValue += sum * p;

    distributionData.push({
      outcome: finalOutcome,
      probability: p
    });
  }

  // Final Stats
  const meanTotal = expectedValue + totalMod;
  
  // Calculate StdDev
  let variance = 0;
  for (let sum = 0; sum < pdf.length; sum++) {
      const p = pdf[sum];
      if (!p) continue;
      variance += p * Math.pow((sum + totalMod) - meanTotal, 2);
  }
  const stdDev = Math.sqrt(variance);

  return {
    chance: Math.round(successProbability * 100),
    mean: parseFloat(meanTotal.toFixed(1)),
    min: min === -1 ? totalMod : min + totalMod,
    max: max + totalMod,
    stdDev: parseFloat(stdDev.toFixed(2)),
    distribution: distributionData
  };
};

export const getStatusColor = (percentage: number): string => {
  if (percentage <= 30) return 'text-tactical-red';
  if (percentage >= 80) return 'text-tactical-cyan';
  return 'text-white';
};

// --- DICE ROLLING LOGIC ---

const rollSingleType = (sides: number, count: number): { sum: number, results: number[] } => {
    let sum = 0;
    const results: number[] = [];
    for(let i=0; i<count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        sum += r;
        results.push(r);
    }
    return { sum, results };
}

const generateRoll = (dice: DiceConfig, skill: number, mod: number): RollDetail => {
    let diceTotal = 0;
    const parts: string[] = [];
    
    // Process dice
    Object.keys(dice).forEach(key => {
        const sides = Number(key);
        const count = dice[sides as DiceType] || 0;
        if(count > 0) {
            const { sum, results } = rollSingleType(sides, count);
            diceTotal += sum;
            parts.push(`${count}D${sides}(${results.join(',')})`);
        }
    });

    return {
        diceTotal,
        skill,
        mod,
        total: diceTotal + skill + mod,
        breakdown: parts.length > 0 ? parts.join('+') : 'NO_DICE'
    };
};

export const performRoll = (state: ProbabilityState): { 
    isSuccess: boolean, 
    finalTotal: number, 
    rollType: 'NORMAL'|'ADV'|'DIS',
    rolls: RollDetail[] 
} => {
    const { dice, skill, modifier, target, advantage, disadvantage } = state;
    
    const roll1 = generateRoll(dice, skill, modifier);
    const rolls = [roll1];
    
    let finalTotal = roll1.total;
    let rollType: 'NORMAL'|'ADV'|'DIS' = 'NORMAL';

    if (advantage) {
        rollType = 'ADV';
        const roll2 = generateRoll(dice, skill, modifier);
        rolls.push(roll2);
        finalTotal = Math.max(roll1.total, roll2.total);
    } else if (disadvantage) {
        rollType = 'DIS';
        const roll2 = generateRoll(dice, skill, modifier);
        rolls.push(roll2);
        finalTotal = Math.min(roll1.total, roll2.total);
    }

    return {
        isSuccess: finalTotal >= target,
        finalTotal,
        rollType,
        rolls
    };
};
