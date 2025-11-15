import { writable } from 'svelte/store';
import { walletAddress, userProvider } from '@stores/auth.svelte';
import type { TokenState, UserStats, GlobalStats } from '@/env';

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

export type { TokenState, UserStats, GlobalStats };
