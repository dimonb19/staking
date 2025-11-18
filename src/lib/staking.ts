import { ethers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { sepolia as viemSepolia } from 'viem/chains';
import {
  STAKING_ABI,
  STAKING_ABI_VIEM,
  STAKING_ADDRESS,
  RPC_URL,
  CHAIN_ID,
} from '@lib/contract';

export const readProvider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);

const sepolia = {
  ...viemSepolia,
  id: CHAIN_ID,
  rpcUrls: {
    ...viemSepolia.rpcUrls,
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
} as const;

const viemClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

type RawStakeTuple = readonly [
  bigint | number,
  bigint | number,
  bigint | number,
  string,
];

export function stakingContract(
  readerOrSigner?: ethers.Provider | ethers.Signer,
) {
  const p = readerOrSigner ?? readProvider;
  return new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, p);
}

export async function isPaused(provider?: ethers.Provider) {
  const c = stakingContract(provider ?? readProvider);
  return await c.isStakingPaused();
}

export async function stakeTokens(
  signer: ethers.Signer,
  tokenIds: number[],
  months: number[],
) {
  if (tokenIds.length === 0) throw new Error('No tokens selected');
  if (tokenIds.length !== months.length) throw new Error('Length mismatch');
  const c = stakingContract(signer);
  const tx = await c.stake(tokenIds, months);
  return await tx.wait();
}

export async function unstakeTokens(signer: ethers.Signer, tokenIds: number[]) {
  const c = stakingContract(signer);
  const tx = await c.unstake(tokenIds);
  return await tx.wait();
}

export async function getStakeInfo(
  provider: ethers.Provider,
  tokenId: number,
): Promise<StakeInfo> {
  const c = stakingContract(provider);
  const result = (await c.getStakeInfo(tokenId)) as RawStakeTuple;
  return normalizeStakeInfo(tokenId, result);
}

export async function getUserStakes(
  owner: `0x${string}`,
  totalSupply = 1000,
  batchSize = 100,
): Promise<StakeInfo[]> {
  const tokenIds = Array.from({ length: totalSupply }, (_, i) => BigInt(i + 1));
  const batches: bigint[][] = [];
  for (let i = 0; i < tokenIds.length; i += batchSize) {
    batches.push(tokenIds.slice(i, i + batchSize));
  }

  const stakes: StakeInfo[] = [];
  for (const batch of batches) {
    const res = await viemClient.multicall({
      contracts: batch.map((id) => ({
        address: STAKING_ADDRESS as `0x${string}`,
        abi: STAKING_ABI_VIEM,
        functionName: 'getStakeInfo' as const,
        args: [id],
      })),
    });

    res.forEach((result, idx) => {
      if (result.status !== 'success') return;
      const info = normalizeStakeInfo(
        Number(batch[idx]),
        result.result as RawStakeTuple,
      );
      if (
        info.owner &&
        info.owner.toLowerCase() === owner.toLowerCase() &&
        info.startTime > 0
      ) {
        stakes.push(info);
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return stakes;
}

function normalizeStakeInfo(tokenId: number, tuple: RawStakeTuple): StakeInfo {
  const [start, unlock, lockMonthsRaw, owner] = tuple;
  const lockMonths =
    typeof lockMonthsRaw === 'bigint'
      ? Number(lockMonthsRaw)
      : Number(lockMonthsRaw ?? 0);
  return {
    tokenId,
    startTime: Number(start),
    unlockTime: Number(unlock),
    lockMonths,
    owner,
  };
}
