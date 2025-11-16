<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  import type { BrowserProvider } from 'ethers';

  import { setApprovalForAll, isApprovedForAll } from '@/lib/potentials';
  import {
    address,
    provider,
    connected,
    myTokens,
    userStats,
    globalStats,
    dataStatus,
    dataError,
    busy as busyStore,
    error as errorStore,
    notice as noticeStore,
    isPaused as pausedStore,
    stakeModalToken,
  } from '@stores/web3.svelte';
  import { stakingContract, isPaused, stakeTokens } from '@/lib/staking';
  import { getUserStakingData, getGlobalStats } from '@/lib/indexer';
  import { STAKING_ADDRESS } from '@/lib/contract';

  import StakeModal from '@components/StakeModal.svelte';

  const LOCK_OPTIONS = [1, 3, 6, 12];
  const DEFAULT_LOCK = 6;
  const readOnlyStaking = stakingContract();
  const stakingReady = Boolean(readOnlyStaking?.target ?? STAKING_ADDRESS);

  let approved = false;
  let selectedTokens: TokenState[] = [];
  let selectionCount = 0;
  let stakingDisabled = true;
  let approveDisabled = true;

  // Map raw GraphQL entries into Svelte-friendly objects.
  function normalizeToken(raw: {
    tokenId: string;
    votingPower: string;
    lockMonths: number;
    stakedAt: string;
    unlockTime: string;
    isStaked: boolean;
  }): TokenState {
    return {
      tokenId: Number(raw.tokenId),
      votingPower: Number(raw.votingPower ?? 0),
      lockMonths: Number(raw.lockMonths ?? DEFAULT_LOCK) || DEFAULT_LOCK,
      stakedAt: Number(raw.stakedAt ?? 0),
      unlockTime: Number(raw.unlockTime ?? 0),
      isStaked: Boolean(raw.isStaked),
      selected: false,
    };
  }

  // Refresh both user + global snapshots once per wallet load/refresh.
  async function loadStakingData(addr: string) {
    busyStore.set('fetch');
    dataStatus.set('loading');
    dataError.set(null);
    errorStore.set(null);
    noticeStore.set(null);

    try {
      const [userData, globalSnapshot] = await Promise.all([
        getUserStakingData(addr),
        getGlobalStats(),
      ]);

      const tokens = userData.stakedNFTs
        .map(normalizeToken)
        .sort((a, b) => a.tokenId - b.tokenId);
      myTokens.set(tokens);

      userStats.set({
        totalVotingPower: userData.totalVotingPower,
        accumulatedPoints: userData.accumulatedPoints,
        currentPoints: userData.currentPoints,
        pointsPerSecond: userData.pointsPerSecond,
        stakedNFTCount: userData.stakedNFTCount,
      });

      globalStats.set(globalSnapshot);

      if (!tokens.length) {
        dataStatus.set('empty');
      } else {
        dataStatus.set('ready');
      }
    } catch (err) {
      console.error(err);
      dataStatus.set('error');
      dataError.set(
        err instanceof Error ? err.message : 'Unable to load staking data.',
      );
    } finally {
      busyStore.set('idle');
    }
  }

  // Approval is still handled on-chain via ethers. Cache status so UI can gate stake button.
  async function refreshApproval(addr: string) {
    if (!stakingReady) return;
    try {
      approved = await isApprovedForAll(addr, STAKING_ADDRESS);
    } catch (err) {
      console.error(err);
    }
  }

  // Ping the contract (read-only) to see if staking is paused.
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

  // UI-only selection helpers (non-staked tokens only)
  function toggleSelection(tokenId: number, selectedValue: boolean) {
    myTokens.update((tokens) =>
      tokens.map((token) => {
        if (token.tokenId !== tokenId || token.isStaked) return token;
        return { ...token, selected: selectedValue };
      }),
    );
  }

  function updateLock(tokenId: number, monthsValue: number) {
    myTokens.update((tokens) =>
      tokens.map((token) => {
        if (token.tokenId !== tokenId || token.isStaked) return token;
        return { ...token, lockMonths: monthsValue };
      }),
    );
  }

  function openStakeModal(tokenId: number) {
    stakeModalToken.set(tokenId);
  }

  function onRefreshClick() {
    const current = get(address);
    if (!current) return;
    loadStakingData(current);
  }

  async function handleApprove() {
    if (!stakingReady) {
      errorStore.set('Set PUBLIC_STAKING_ADDRESS to continue.');
      return;
    }

    const current = get(address);
    if (!current) {
      errorStore.set('Connect a wallet first.');
      return;
    }

    const currentProvider = get(provider) as BrowserProvider | null;
    if (!currentProvider) {
      errorStore.set('Connect a wallet first.');
      return;
    }

    busyStore.set('approve');
    errorStore.set(null);
    noticeStore.set(null);

    try {
      const signer = await currentProvider.getSigner();
      await setApprovalForAll(signer, STAKING_ADDRESS, true);
      approved = true;
      noticeStore.set('Staking contract approved.');
    } catch (err) {
      console.error(err);
      errorStore.set(
        err instanceof Error ? err.message : 'Approval transaction failed.',
      );
    } finally {
      busyStore.set('idle');
    }
  }

  async function handleStake() {
    if (!stakingReady) {
      errorStore.set('Set PUBLIC_STAKING_ADDRESS to continue.');
      return;
    }

    const current = get(address);
    const currentProvider = get(provider) as BrowserProvider | null;

    if (!current || !currentProvider) {
      errorStore.set('Connect a wallet first.');
      return;
    }

    const selection = get(myTokens).filter(
      (token) => token.selected && !token.isStaked,
    );
    if (!selection.length) {
      errorStore.set('Select at least one NFT to stake.');
      return;
    }

    const tokenIds = selection.map((token) => token.tokenId);
    const months = selection.map((token) => token.lockMonths);

    if (months.some((value) => !LOCK_OPTIONS.includes(value))) {
      errorStore.set('Choose a valid lock duration for each NFT.');
      return;
    }

    busyStore.set('stake');
    errorStore.set(null);
    noticeStore.set(null);

    try {
      const signer = await currentProvider.getSigner();
      await stakeTokens(signer, tokenIds, months);
      noticeStore.set(
        `Staked ${tokenIds.length} NFT${tokenIds.length > 1 ? 's' : ''} successfully.`,
      );
      await loadStakingData(current);
    } catch (err) {
      console.error(err);
      errorStore.set(
        err instanceof Error ? err.message : 'Staking transaction failed.',
      );
    } finally {
      busyStore.set('idle');
    }
  }

  onMount(() => {
    const unsubscribeAddress = address.subscribe((value) => {
      connected.set(!!value);
      if (!value) {
        approved = false;
        myTokens.set([]);
        userStats.set(null);
        globalStats.set(null);
        dataStatus.set('idle');
        dataError.set(null);
        noticeStore.set(null);
        errorStore.set(null);
        stakeModalToken.set(null);
        pausedStore.set(false);
        return;
      }
      refreshApproval(value);
      loadStakingData(value);
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
    (token) => token.selected && !token.isStaked,
  );
  $: selectionCount = selectedTokens.length;
  $: availableCount = $myTokens.filter((token) => !token.isStaked).length;
  $: stakingDisabled =
    !$connected ||
    !stakingReady ||
    !approved ||
    !selectionCount ||
    $pausedStore ||
    $busyStore !== 'idle';
  $: approveDisabled =
    approved || !stakingReady || !$connected || $busyStore !== 'idle';

  // Formatting helpers for the metric cards.
  function formatBigInt(value?: bigint | null) {
    if (value === undefined || value === null) return '0';
    return value.toString();
  }

  function formatPoints(value?: number | null, digits = 2) {
    if (value === undefined || value === null || Number.isNaN(value))
      return '0';
    return value.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function formatPerSecond(value?: number | null) {
    if (!value) return '0 pts/s';
    return `${value.toFixed(4)} pts/s`;
  }
</script>

{#if !$connected}
  <section class="panel connect-panel">
    <div class="panel-header">
      <h2>Connect your wallet</h2>
      <p>Use the Rainbow button to load your Potentials NFTs.</p>
    </div>
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
          disabled={$busyStore === 'fetch'}
        >
          {$busyStore === 'fetch' ? 'Fetching…' : 'Refresh'}
        </button>
        <button
          class="btn ghost"
          type="button"
          onclick={handleApprove}
          disabled={approveDisabled}
        >
          {approved
            ? 'Approved'
            : $busyStore === 'approve'
              ? 'Approving…'
              : 'Approve staking contract'}
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

    {#if $userStats || $globalStats}
      <div class="stats-grid">
        <article class="stats-card">
          <p class="label">Your voting power</p>
          <p class="value">{formatBigInt($userStats?.totalVotingPower)}</p>
        </article>
        <article class="stats-card">
          <p class="label">Current points</p>
          <p class="value">{formatPoints($userStats?.currentPoints)}</p>
          <span class="subtext"
            >{formatPerSecond($userStats?.pointsPerSecond)}</span
          >
        </article>
        <article class="stats-card">
          <p class="label">Staked NFTs</p>
          <p class="value">
            {($userStats?.stakedNFTCount ?? 0).toLocaleString()}
          </p>
        </article>
      </div>
      <div class="stats-grid global">
        <article class="stats-card compact">
          <p class="label">Global voting power</p>
          <p class="value">{formatBigInt($globalStats?.totalVotingPower)}</p>
        </article>
        <article class="stats-card compact">
          <p class="label">Total staked NFTs</p>
          <p class="value">
            {($globalStats?.totalStakedNFTs ?? 0).toLocaleString()}
          </p>
        </article>
      </div>
    {/if}

    <div class="status-row">
      <span>{selectionCount} ready to stake</span>
      <span>{availableCount} available</span>
    </div>
    <p class="helper-text">
      Click “View stake data” on any NFT to inspect its lock, claim points
      visibility, or unstake after unlock.
    </p>

    {#if $dataStatus === 'loading'}
      <p class="empty-state">Loading staking data…</p>
    {:else if $dataStatus === 'error'}
      <div class="banner warn">
        {$dataError ?? 'Unable to load staking data. Please try refreshing.'}
      </div>
    {:else if $dataStatus === 'empty'}
      <p class="empty-state">
        No Potentials NFTs were found for this wallet in the indexer yet.
      </p>
    {:else if $myTokens.length === 0}
      <p class="empty-state">
        Data loaded, but no NFTs are currently available for staking.
      </p>
    {:else}
      <div class="token-grid">
        {#each $myTokens as token (token.tokenId)}
          <article
            class={`token-card ${token.selected ? 'selected' : ''} ${token.isStaked ? 'staked' : ''}`}
          >
            <div class="token-card-header">
              <label class="checkbox">
                <input
                  type="checkbox"
                  checked={token.selected}
                  aria-label={`Select token ${token.tokenId}`}
                  disabled={token.isStaked || $pausedStore}
                  onchange={(event) =>
                    toggleSelection(token.tokenId, event.currentTarget.checked)}
                />
                <span>Select</span>
              </label>
              {#if token.isStaked}
                <span class="badge">Staked</span>
              {:else}
                <span class="badge available">Available</span>
              {/if}
            </div>
            <p class="token-id">Token #{token.tokenId}</p>
            <p class="token-meta">
              Voting power: {token.votingPower.toLocaleString()}
            </p>
            <label class="lock-label">
              Lock duration
              <select
                value={token.lockMonths}
                disabled={token.isStaked || $pausedStore}
                onchange={(event) =>
                  updateLock(token.tokenId, Number(event.currentTarget.value))}
              >
                {#each LOCK_OPTIONS as months}
                  <option value={months}>
                    {months}
                    {months === 1 ? 'month' : 'months'}
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
        {$busyStore === 'stake' ? 'Staking…' : 'Stake selected'}
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
<StakeModal {loadStakingData} />
