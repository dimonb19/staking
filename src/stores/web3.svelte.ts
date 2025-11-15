import { writable } from 'svelte/store';
import { walletAddress, userProvider } from '@stores/auth.svelte';

export type TokenState = {
  tokenId: number;
  votingPower: number;
  lockMonths: number;
  stakedAt: number;
  unlockTime: number;
  isStaked: boolean;
  selected: boolean;
};

export type UserStats = {
  totalVotingPower: bigint;
  accumulatedPoints: number;
  currentPoints: number;
  pointsPerSecond: number;
  stakedNFTCount: number;
};

export type GlobalStats = {
  totalVotingPower: bigint;
  totalStakedNFTs: number;
};

export const connected = writable(false);
export const address = walletAddress;
export const provider = userProvider;
export const isPaused = writable<boolean>(false);
export const myTokens = writable<TokenState[]>([]);
export const userStats = writable<UserStats | null>(null);
export const globalStats = writable<GlobalStats | null>(null);
export const dataStatus = writable<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
export const dataError = writable<string | null>(null);
export const busy = writable<'idle' | 'fetch' | 'approve' | 'stake' | 'unstake'>('idle');
export const error = writable<string | null>(null);
export const notice = writable<string | null>(null);
export const stakeModalToken = writable<number | null>(null);
