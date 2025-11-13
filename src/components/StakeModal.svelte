<script lang="ts">
  import { get } from "svelte/store";
  import type { BrowserProvider } from "ethers";

  import {
    address,
    provider,
    stakeInfoCache,
    stakeModalToken,
    busy as busyStore,
    error as errorStore,
    notice as noticeStore,
  } from "@stores/web3.svelte";
  import {
    getStakeInfo,
    readProvider,
    unstakeTokens,
    type StakeInfo,
  } from "@/lib/staking";
  import {
    deriveStakeStatus,
    formatCountdown,
    formatTimestamp,
    type StakeStatus,
  } from "@/lib/stake-format";

  export let refreshTokensFor: (addr: string) => Promise<void>;

  let loading = false;
  let localError: string | null = null;

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  let info: StakeInfo | null = null;
  let status: StakeStatus = "never";

  $: modalToken = $stakeModalToken;
  $: cache = $stakeInfoCache;
  $: cachedEntry = modalToken != null ? cache[modalToken] : undefined;
  $: info = cachedEntry ?? null;
  $: status = deriveStakeStatus(info);
  $: canUnstake =
    status === "unlockable" &&
    info?.owner &&
    info.owner.toLowerCase() === ($address ?? "").toLowerCase();

  $: if (modalToken !== null && cachedEntry === undefined && !loading) {
    void loadStakeInfo(modalToken);
  }

  function closeModal() {
    localError = null;
    stakeModalToken.set(null);
  }

  function handleBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  async function loadStakeInfo(tokenId: number) {
    loading = true;
    localError = null;
    try {
      const currentProvider =
        (get(provider) as BrowserProvider | null) ?? readProvider;
      const result = await getStakeInfo(currentProvider, tokenId);
      const entry = result.startTime > 0 ? result : null;
      stakeInfoCache.update((prev) => ({ ...prev, [tokenId]: entry }));
    } catch (err) {
      console.error(err);
      localError =
        err instanceof Error ? err.message : "Unable to fetch stake data.";
    } finally {
      loading = false;
    }
  }

  async function handleUnstake() {
    if (!canUnstake || modalToken === null || !info) {
      localError = "Token is not ready to unstake.";
      return;
    }

    const wallet = get(address);
    const currentProvider = get(provider) as BrowserProvider | null;

    if (!wallet || !currentProvider) {
      localError = "Connect a wallet first.";
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (info.unlockTime > now) {
      localError = "Lock period has not ended yet.";
      return;
    }

    busyStore.set("unstake");
    errorStore.set(null);
    noticeStore.set(null);
    localError = null;

    try {
      const signer = await currentProvider.getSigner();
      await unstakeTokens(signer, [modalToken]);
      noticeStore.set(`Unstaked token #${modalToken}.`);
      await refreshTokensFor(wallet);
      stakeInfoCache.update((prev) => ({ ...prev, [modalToken]: null }));
      stakeModalToken.set(null);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Unstake transaction failed.";
      localError = message;
      errorStore.set(message);
    } finally {
      busyStore.set("idle");
    }
  }

  function shortAddress(value?: string | null) {
    if (!value || value === ZERO_ADDRESS) return "—";
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  }

  function statusLabel(current: StakeStatus) {
    switch (current) {
      case "locked":
        return "Locked";
      case "unlockable":
        return "Unlockable";
      default:
        return "Not staked";
    }
  }

  function statusDescription(current: StakeStatus, stake?: StakeInfo | null) {
    if (current === "locked" && stake?.unlockTime) {
      return `Unlocks in ${formatCountdown(stake.unlockTime)}`;
    }
    if (current === "unlockable") {
      return "Lock complete. You can unstake now.";
    }
    return "No active stake found for this NFT.";
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
{#if modalToken !== null}
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    onclick={handleBackdrop}
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
          onclick={closeModal}
          aria-label="Close"
        >
          ×
        </button>
      </header>

      <section class="modal-body">
        {#if loading}
          <p class="modal-status">Loading stake data…</p>
        {:else}
          <div class="status-chip {status}">
            <div>
              <span class="label">Status</span>
              <strong>{statusLabel(status)}</strong>
            </div>
            <span class="helper">{statusDescription(status, info)}</span>
          </div>

          <dl class="modal-grid">
            <div>
              <dt>Owner</dt>
              <dd>{shortAddress(info?.owner)}</dd>
            </div>
            <div>
              <dt>Lock duration</dt>
              <dd>{info?.lockMonths ? `${info.lockMonths} months` : "—"}</dd>
            </div>
            <div>
              <dt>Start time (UTC)</dt>
              <dd>{formatTimestamp(info?.startTime)}</dd>
            </div>
            <div>
              <dt>Unlock time (UTC)</dt>
              <dd>{formatTimestamp(info?.unlockTime)}</dd>
            </div>
          </dl>

          {#if localError}
            <p class="feedback error">{localError}</p>
          {/if}
        {/if}
      </section>

      <footer class="modal-footer">
        <button class="btn ghost" type="button" onclick={closeModal}>
          Close
        </button>
        <button
          class="btn primary"
          type="button"
          onclick={handleUnstake}
          disabled={!canUnstake || loading || $busyStore === "unstake"}
        >
          {$busyStore === "unstake" ? "Unstaking…" : "Unstake NFT"}
        </button>
      </footer>
    </div>
  </div>
{/if}
