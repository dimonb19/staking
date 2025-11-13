import { writable } from 'svelte/store';
import { walletAddress, userProvider } from '@stores/auth.svelte';
import type { StakeInfo } from '@/lib/staking';

export type TokenState = {
  tokenId: number;
  selected: boolean;
  months: number;
  staked: boolean;
};

export const connected = writable(false);
export const address = walletAddress;
export const provider = userProvider;
export const isPaused = writable<boolean>(false);
export const myTokens = writable<TokenState[]>([]);
export const busy = writable<'idle' | 'fetch' | 'approve' | 'stake' | 'unstake'>('idle');
export const error = writable<string | null>(null);
export const notice = writable<string | null>(null);
export const stakeInfoCache = writable<Record<number, StakeInfo | null>>({});
export const stakeModalToken = writable<number | null>(null);
