import { getVotingPower } from './tokenLevels';

const POINTS_PER_SECOND = 500_000 / (7 * 24 * 60 * 60);
const POINTS_PER_DAY = POINTS_PER_SECOND * 60 * 60 * 24;
const VP_SCALE = 100;

export function getBoostMultiplier(lockMonths: number): number {
  return 1 + 0.05 * lockMonths + 0.01 * (lockMonths * (lockMonths - 1)) / 2;
}

export interface StakingPreview {
  totalBaseVP: number;
  boostedVP: number;
  boostMultiplier: number;
  projectedPointsPerDay: number;
  projectedPoolShare: number;
}

export function previewStaking(
  tokenIds: number[],
  lockMonths: number,
  currentGlobalEffectiveVP: bigint,
  currentUserEffectiveVP: bigint = 0n
): StakingPreview {
  const boost = getBoostMultiplier(lockMonths);

  let totalBaseVP = 0;
  for (const tokenId of tokenIds) {
    totalBaseVP += getVotingPower(tokenId);
  }

  const boostedVP = totalBaseVP * boost;
  const scaledEffectiveVP = Math.floor(boostedVP * VP_SCALE);
  const newUserEffectiveVP = Number(currentUserEffectiveVP) + scaledEffectiveVP;
  const newGlobalEffectiveVP = Number(currentGlobalEffectiveVP) + scaledEffectiveVP;

  const projectedPoolShare = newGlobalEffectiveVP > 0
    ? (newUserEffectiveVP / newGlobalEffectiveVP) * 100
    : 0;

  const projectedPointsPerDay = newGlobalEffectiveVP > 0
    ? (newUserEffectiveVP / newGlobalEffectiveVP) * POINTS_PER_DAY
    : 0;

  return {
    totalBaseVP,
    boostedVP,
    boostMultiplier: boost,
    projectedPointsPerDay,
    projectedPoolShare,
  };
}
