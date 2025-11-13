<script lang="ts">
  import { onMount } from "svelte";
  import type { Action } from "svelte/action";
  import { get } from "svelte/store";
  import { createElement } from "react";
  import { createRoot } from "react-dom/client";
  import type { BrowserProvider } from "ethers";

  import Rainbow from "@components/web3/Rainbow.tsx";
  import {
    setApprovalForAll,
    isApprovedForAll,
    getOwnedTokenIds,
  } from "@/lib/potentials";
  import {
    address,
    provider,
    connected,
    myTokens,
    busy as busyStore,
    error as errorStore,
    notice as noticeStore,
    isPaused as pausedStore,
    stakeInfoCache,
    stakeModalToken,
    type TokenState,
  } from "@stores/web3.svelte";
  import {
    stakingContract,
    isPaused,
    stakeTokens,
    getUserStakes,
    type StakeInfo,
  } from "@/lib/staking";
  import { STAKING_ADDRESS } from "@/lib/contract";
  import StakeModal from "./StakeModal.svelte";

  const LOCK_OPTIONS = [1, 3, 6, 12];
  const DEFAULT_LOCK = 6;
  const readOnlyStaking = stakingContract();
  const stakingReady = Boolean(readOnlyStaking?.target ?? STAKING_ADDRESS);

  let approved = false;
  let selectedTokens: TokenState[] = [];
  let selectionCount = 0;
  let stakingDisabled = true;
  let approveDisabled = true;

  const mountRainbow: Action<HTMLDivElement> = (node) => {
    const root = createRoot(node);
    root.render(createElement(Rainbow));
    return {
      destroy() {
        root.unmount();
      },
    };
  };

  async function refreshTokensFor(addr: string) {
    busyStore.set("fetch");
    errorStore.set(null);
    noticeStore.set(null);

    try {
      const ownedPromise = getOwnedTokenIds(addr as `0x${string}`);

      const [ownedIds, stakedInfos] = await Promise.all([
        ownedPromise,
        getUserStakes(addr as `0x${string}`),
      ]);

      const normalized = ownedIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));

      const tokensMap = new Map<number, TokenState>();
      normalized.forEach((tokenId) => {
        tokensMap.set(tokenId, {
          tokenId,
          selected: false,
          months: DEFAULT_LOCK,
          staked: false,
        });
      });

      stakedInfos.forEach((info) => {
        tokensMap.set(info.tokenId, {
          tokenId: info.tokenId,
          selected: false,
          months: info.lockMonths || DEFAULT_LOCK,
          staked: true,
        });
      });

      const combined = Array.from(tokensMap.values()).sort(
        (a, b) => a.tokenId - b.tokenId
      );
      myTokens.set(combined);

      if (!combined.length) {
        noticeStore.set(
          "No Potentials NFTs or active stakes detected for this wallet."
        );
      }

      const cacheSeed = stakedInfos.reduce<Record<number, StakeInfo | null>>(
        (acc, info) => {
          acc[info.tokenId] = info;
          return acc;
        },
        {}
      );
      stakeInfoCache.set(cacheSeed);
    } catch (err) {
      console.error(err);
      errorStore.set(
        err instanceof Error
          ? err.message
          : "Unable to fetch Potentials ownership."
      );
    } finally {
      busyStore.set("idle");
    }
  }

  async function refreshApproval(addr: string) {
    if (!stakingReady) return;
    try {
      approved = await isApprovedForAll(addr, STAKING_ADDRESS);
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshPausedState() {
    try {
      const currentProvider = get(provider) as BrowserProvider | null;
      const paused = currentProvider
        ? await isPaused(currentProvider)
        : await readOnlyStaking.isStakingPaused();
      pausedStore.set(!!paused);
    } catch (err) {
      console.error(err);
    }
  }

  function toggleSelection(tokenId: number, selectedValue: boolean) {
    myTokens.update((tokens) =>
      tokens.map((token) => {
        if (token.tokenId !== tokenId || token.staked) return token;
        return { ...token, selected: selectedValue };
      })
    );
  }

  function updateLock(tokenId: number, monthsValue: number) {
    myTokens.update((tokens) =>
      tokens.map((token) => {
        if (token.tokenId !== tokenId || token.staked) return token;
        return { ...token, months: monthsValue };
      })
    );
  }

  function openStakeModal(tokenId: number) {
    stakeModalToken.set(tokenId);
  }

  function onRefreshClick() {
    const current = get(address);
    if (!current) return;
    refreshTokensFor(current);
  }

  async function handleApprove() {
    if (!stakingReady) {
      errorStore.set("Set PUBLIC_STAKING_ADDRESS to continue.");
      return;
    }

    const current = get(address);
    if (!current) {
      errorStore.set("Connect a wallet first.");
      return;
    }

    const currentProvider = get(provider) as BrowserProvider | null;
    if (!currentProvider) {
      errorStore.set("Connect a wallet first.");
      return;
    }

    busyStore.set("approve");
    errorStore.set(null);
    noticeStore.set(null);

    try {
      const signer = await currentProvider.getSigner();
      await setApprovalForAll(signer, STAKING_ADDRESS, true);
      approved = true;
      noticeStore.set("Staking contract approved.");
    } catch (err) {
      console.error(err);
      errorStore.set(
        err instanceof Error ? err.message : "Approval transaction failed."
      );
    } finally {
      busyStore.set("idle");
    }
  }

  async function handleStake() {
    if (!stakingReady) {
      errorStore.set("Set PUBLIC_STAKING_ADDRESS to continue.");
      return;
    }

    const current = get(address);
    const currentProvider = get(provider) as BrowserProvider | null;

    if (!current || !currentProvider) {
      errorStore.set("Connect a wallet first.");
      return;
    }

    const selection = get(myTokens).filter(
      (token) => token.selected && !token.staked
    );
    if (!selection.length) {
      errorStore.set("Select at least one NFT to stake.");
      return;
    }

    const tokenIds = selection.map((token) => token.tokenId);
    const months = selection.map((token) => token.months);

    if (months.some((value) => !LOCK_OPTIONS.includes(value))) {
      errorStore.set("Choose a valid lock duration for each NFT.");
      return;
    }

    busyStore.set("stake");
    errorStore.set(null);
    noticeStore.set(null);

    try {
      const signer = await currentProvider.getSigner();
      await stakeTokens(signer, tokenIds, months);
      noticeStore.set(
        `Staked ${tokenIds.length} NFT${
          tokenIds.length > 1 ? "s" : ""
        } successfully.`
      );
      await refreshTokensFor(current);
    } catch (err) {
      console.error(err);
      errorStore.set(
        err instanceof Error ? err.message : "Staking transaction failed."
      );
    } finally {
      busyStore.set("idle");
    }
  }

  onMount(() => {
    const unsubscribeAddress = address.subscribe((value) => {
      connected.set(!!value);
      if (!value) {
        approved = false;
        myTokens.set([]);
        noticeStore.set(null);
        errorStore.set(null);
        stakeInfoCache.set({});
        stakeModalToken.set(null);
        pausedStore.set(false);
        return;
      }
      refreshApproval(value);
      refreshTokensFor(value);
    });

    const unsubscribeProvider = provider.subscribe(() => {
      refreshPausedState();
    });

    refreshPausedState();

    return () => {
      unsubscribeAddress();
      unsubscribeProvider();
    };
  });

  $: selectedTokens = $myTokens.filter(
    (token) => token.selected && !token.staked
  );
  $: selectionCount = selectedTokens.length;
  $: stakingDisabled =
    !$connected ||
    !stakingReady ||
    !approved ||
    !selectionCount ||
    $pausedStore ||
    $busyStore !== "idle";
  $: approveDisabled =
    approved || !stakingReady || !$connected || $busyStore !== "idle";
</script>

{#if !$connected}
  <section class="panel connect-panel">
    <div class="panel-header">
      <h2>Connect your wallet</h2>
      <p>Use the Rainbow button to load your Potentials NFTs.</p>
    </div>
    <div class="rainbow-slot" use:mountRainbow></div>
  </section>
{:else}
  <section class="panel">
    <div class="panel-header">
      <div>
        <h2>Stake Potentials</h2>
        <p>Select NFTs, choose a lock, and stake them together.</p>
      </div>
      <div class="panel-actions">
        <button
          class="btn ghost"
          type="button"
          onclick={onRefreshClick}
          disabled={$busyStore === "fetch"}
        >
          {$busyStore === "fetch" ? "Fetching…" : "Refresh"}
        </button>
        <button
          class="btn ghost"
          type="button"
          onclick={handleApprove}
          disabled={approveDisabled}
        >
          {approved
            ? "Approved"
            : $busyStore === "approve"
              ? "Approving…"
              : "Approve staking contract"}
        </button>
      </div>
    </div>

    {#if !stakingReady}
      <div class="banner warn">
        Set <code>PUBLIC_STAKING_ADDRESS</code> in your .env file to enable staking.
      </div>
    {/if}

    {#if $pausedStore}
      <div class="banner paused">
        Staking is temporarily paused. Unstake remains available after unlock.
      </div>
    {/if}

    <div class="status-row">
      <span>{selectionCount} ready to stake</span>
      <span>{approved ? "Contract approved" : "Approval required"}</span>
    </div>
    <p class="helper-text">
      Click “View stake data” on any NFT to inspect its lock or unstake after it
      unlocks.
    </p>

    {#if !$myTokens.length}
      <p class="empty-state">
        No Potentials NFTs or stakes detected. Hit Refresh after approvals
        settle.
      </p>
    {:else}
      <div class="token-grid">
        {#each $myTokens as token (token.tokenId)}
          <article
            class={`token-card ${token.selected ? "selected" : ""} ${token.staked ? "staked" : ""}`}
          >
            <div class="token-card-header">
              <label class="checkbox">
                <input
                  type="checkbox"
                  checked={token.selected}
                  aria-label={`Select token ${token.tokenId}`}
                  disabled={token.staked || $pausedStore}
                  onchange={(event) =>
                    toggleSelection(token.tokenId, event.currentTarget.checked)}
                />
                <span>Select</span>
              </label>
              {#if token.staked}
                <span class="badge">Staked</span>
              {/if}
            </div>
            <p class="token-id">Token #{token.tokenId}</p>
            <label class="lock-label">
              Lock duration
              <select
                value={token.months}
                disabled={token.staked || $pausedStore}
                onchange={(event) =>
                  updateLock(token.tokenId, Number(event.currentTarget.value))}
              >
                {#each LOCK_OPTIONS as months}
                  <option value={months}>
                    {months}
                    {months === 1 ? "month" : "months"}
                  </option>
                {/each}
              </select>
            </label>
            <button
              class="link-btn"
              type="button"
              onclick={() => openStakeModal(token.tokenId)}
            >
              View stake data
            </button>
          </article>
        {/each}
      </div>
    {/if}

    <div class="stake-actions">
      <button
        class="btn primary"
        type="button"
        onclick={handleStake}
        disabled={stakingDisabled}
      >
        {$busyStore === "stake" ? "Staking…" : "Stake selected"}
      </button>
    </div>

    {#if $noticeStore}
      <p class="feedback notice" aria-live="polite">{$noticeStore}</p>
    {/if}
    {#if $errorStore}
      <p class="feedback error" aria-live="assertive">{$errorStore}</p>
    {/if}
  </section>
{/if}

<StakeModal {refreshTokensFor} />
