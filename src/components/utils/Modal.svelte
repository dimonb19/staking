<script lang="ts">
  import type { BrowserProvider } from 'ethers';

  import {
    address,
    provider,
    myTokens,
    busy as busyStore,
  } from '@stores/web3.svelte';
  import { stakeModal, closeStakeModal } from '@stores/modal.svelte';
  import { unstakeTokens } from '@/lib/staking';
  import { toastStore } from '@/stores/toast.svelte';

  let dialog = $state<HTMLDialogElement | null>(null);
  let localError = $state<string | null>(null);

  const modalToken = $derived(stakeModal.tokenId);
  const modalOpen = $derived(stakeModal.open);

  const currentToken = $derived.by(() => {
    if (modalToken === null) return null;
    return $myTokens.find((token) => token.tokenId === modalToken) ?? null;
  });

  const status = $derived(deriveStatus(currentToken));
  const canUnstake = $derived(
    status === 'unlockable' &&
      currentToken?.isStaked &&
      currentToken.unlockTime <= Math.floor(Date.now() / 1000),
  );

  $effect(() => {
    if (!dialog) return;
    if (modalOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  });

  function handleBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  function closeDialog() {
    localError = null;
    closeStakeModal();
    if (dialog?.open) dialog.close();
  }

  // Determine modal badge state based on unlock time.
  function deriveStatus(token: TokenState | null) {
    if (!token || !token.isStaked) return 'not-staked';
    const now = Math.floor(Date.now() / 1000);
    return token.unlockTime > now ? 'locked' : 'unlockable';
  }

  function statusLabel(current: string) {
    switch (current) {
      case 'locked':
        return 'Locked';
      case 'unlockable':
        return 'Unlockable';
      default:
        return 'Not staked';
    }
  }

  function statusDescription(current: string, token: TokenState | null) {
    if (current === 'locked' && token?.unlockTime) {
      return `Unlocks in ${formatCountdown(token.unlockTime)}`;
    }
    if (current === 'unlockable') {
      return 'Lock complete. You can unstake now.';
    }
    return 'This NFT is not currently staked.';
  }

  function formatTimestamp(value?: number | null) {
    if (!value) return '—';
    const date = new Date(value * 1000);
    return date.toUTCString();
  }

  function formatCountdown(unlockTime?: number | null) {
    if (!unlockTime) return '—';
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(unlockTime - now, 0);
    if (diff === 0) return 'Ready to unstake';
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (!days && minutes) parts.push(`${minutes}m`);
    if (!parts.length) parts.push(`${diff % 60}s`);
    return parts.join(' ');
  }

  // Unstake remains on-chain via ethers; upon success we refresh Graph data for consistency.
  async function handleUnstake() {
    if (!currentToken || !canUnstake || modalToken === null) {
      localError = 'Token is not ready to unstake.';
      return;
    }

    const wallet = $address;
    const currentProvider = $provider as BrowserProvider | null;

    if (!wallet || !currentProvider) {
      localError = 'Connect a wallet first.';
      return;
    }

    localError = null;
    busyStore.set('unstake');

    try {
      const signer = await currentProvider.getSigner();
      await unstakeTokens(signer, [modalToken]);
      toastStore.show(`Unstaked token #${modalToken}.`);
      const refresh = stakeModal.refresh;
      if (refresh) {
        await refresh(wallet);
      }
      closeStakeModal();
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : 'Unstake transaction failed.';
      localError = message;
      toastStore.show(`Unstake failed: ${message}`, 'error');
    } finally {
      busyStore.set('idle');
    }
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
{#if modalOpen}
  <dialog
    class="staking-dialog"
    bind:this={dialog}
    onclose={closeDialog}
    onclick={handleBackdrop}
    aria-label="Stake details modal"
    aria-modal="true"
  >
    <div class="modal-panel">
      <header class="modal-header">
        <div>
          <p class="eyebrow">Stake details</p>
          <h3>Token #{modalToken}</h3>
        </div>
        <button
          class="icon-btn"
          type="button"
          onclick={closeDialog}
          aria-label="Close"
        >
          ×
        </button>
      </header>

      <section class="modal-body">
        {#if !currentToken}
          <p class="modal-status">No stake data available for this NFT yet.</p>
        {:else}
          <div class={`status-chip ${status}`}>
            <div>
              <span class="label">Status</span>
              <strong>{statusLabel(status)}</strong>
            </div>
            <span class="helper">{statusDescription(status, currentToken)}</span
            >
          </div>

          <dl class="modal-grid">
            <div>
              <dt>Voting power</dt>
              <dd>{currentToken.votingPower.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Lock duration</dt>
              <dd>
                {currentToken.lockMonths
                  ? `${currentToken.lockMonths} months`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Staked at (UTC)</dt>
              <dd>{formatTimestamp(currentToken.stakedAt)}</dd>
            </div>
            <div>
              <dt>Unlock time (UTC)</dt>
              <dd>{formatTimestamp(currentToken.unlockTime)}</dd>
            </div>
          </dl>

          {#if localError}
            <p class="feedback error">{localError}</p>
          {/if}
        {/if}
      </section>

      <footer class="modal-footer">
        <button class="btn ghost" type="button" onclick={closeDialog}>
          Close
        </button>
        <button
          class="btn primary"
          type="button"
          onclick={handleUnstake}
          disabled={!canUnstake || !currentToken || $busyStore === 'unstake'}
        >
          {$busyStore === 'unstake' ? 'Unstaking…' : 'Unstake NFT'}
        </button>
      </footer>
    </div>
  </dialog>
{/if}
