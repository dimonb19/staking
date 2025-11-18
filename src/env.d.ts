/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Centralized type definitions shared between the GraphQL client, stores, and UI.

type RawStakedNFT = {
  tokenId: string;
  votingPower: string;
  lockMonths: number;
  stakedAt: string;
  unlockTime: string;
  isStaked: boolean;
};

type RawUser = {
  totalVotingPower: string;
  accumulatedPoints: string;
  stakedNFTCount: number;
  lastUpdateTime: string;
};

type RawGlobalState = {
  totalVotingPower: string;
  totalStakedNFTs: number;
};

type UserStakingData = {
  stakedNFTs: RawStakedNFT[];
  totalVotingPower: bigint;
  accumulatedPoints: number;
  currentPoints: number;
  pointsPerSecond: number;
  stakedNFTCount: number;
};

type TokenState = {
  tokenId: number;
  votingPower: number;
  lockMonths: number;
  stakedAt: number;
  unlockTime: number;
  isStaked: boolean;
  selected: boolean;
};

type UserStats = {
  totalVotingPower: bigint;
  accumulatedPoints: number;
  currentPoints: number;
  pointsPerSecond: number;
  stakedNFTCount: number;
};

type GlobalStats = {
  totalVotingPower: bigint;
  totalStakedNFTs: number;
};

type StakeInfo = {
  tokenId: number;
  startTime: number;
  unlockTime: number;
  lockMonths: number;
  owner: string;
};
