import type { BrowserProvider, Provider } from 'ethers';
import { writable } from 'svelte/store';

export const walletAddress = writable<string | null>(null);
export const username = writable<string | null>(null);
export const userProvider = writable<Provider | BrowserProvider | null>(null);
