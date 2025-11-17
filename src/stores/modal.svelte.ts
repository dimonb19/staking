// Global staking modal state
export const stakeModal = $state({
  open: false,
  tokenId: null as number | null,
  refresh: null as ((address: string) => Promise<void>) | null,
});

export function openStakeModal(tokenId: number) {
  stakeModal.tokenId = tokenId;
  stakeModal.open = true;
}

export function closeStakeModal() {
  stakeModal.open = false;
  stakeModal.tokenId = null;
}

export function setStakeModalRefresh(
  fn: ((address: string) => Promise<void>) | null,
) {
  stakeModal.refresh = fn;
}
