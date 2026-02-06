/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Raw entities as they come from the HyperIndex GraphQL service.
type RawStakedNFT = {
  tokenId: string;
  votingPower: string;
  lockMonths: number;
  stakedAt: string;
  unlockTime: string;
  isStaked: boolean;
};

// Token shape used throughout Svelte stores and UI components.
type TokenState = {
  tokenId: number;
  votingPower: number;
  lockMonths: number;
  stakedAt: number;
  unlockTime: number;
  isStaked: boolean;
  selected: boolean;
};

// Raw user snapshot from the indexer.
type RawUser = {
  totalVotingPower: string;
  totalEffectiveVotingPower: string;
  accumulatedPoints: string;
  stakedNFTCount: number;
  lastUpdateTime: string;
};

// Cached user metrics for the header/stats cards.
type UserStats = {
  totalVotingPower: bigint;
  totalEffectiveVotingPower: bigint;
  accumulatedPoints: number;
  currentPoints: number;
  pointsPerSecond: number;
  stakedNFTCount: number;
};

// Raw global snapshot from the indexer.
type RawGlobalState = {
  totalVotingPower: string;
  totalEffectiveVotingPower: string;
  totalStakedNFTs: number;
  totalAccumulatedPoints?: string;
};

// Cached global metrics for high-level stats.
type GlobalStats = {
  totalVotingPower: bigint;
  totalEffectiveVotingPower: bigint;
  totalStakedNFTs: number;
  totalAccumulatedPoints: number;
};

// Normalized user-level staking data the app consumes after parsing raw fields.
type UserStakingData = {
  stakedNFTs: RawStakedNFT[];
  totalVotingPower: bigint;
  totalEffectiveVotingPower: bigint;
  accumulatedPoints: number;
  currentPoints: number;
  pointsPerSecond: number;
  stakedNFTCount: number;
};
