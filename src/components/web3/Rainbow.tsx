import type { FC, PropsWithChildren } from "react";
import { BrowserProvider } from "ethers";
import type { Provider, Eip1193Provider } from "ethers";

import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
  ConnectButton,
} from "@rainbow-me/rainbowkit";

import { WagmiProvider, useAccountEffect, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { CHAIN_ID, RPC_URL } from "@/lib/contract";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@rainbow-me/rainbowkit/styles.css";

/* ---- Svelte stores & helpers ------------------------------------ */
import { walletAddress, username, userProvider } from "@stores/auth.svelte";
import { ClearCache, POTENTIALS_KEY } from "@constants/cache";

/* ------------------------------------------------------------------ */
/* 1.  Global wagmi / RainbowKit config (must not re‑create on render) */
/* ------------------------------------------------------------------ */
export const wagmiConfig = getDefaultConfig({
  appName: "Degenerous DAO",
  appIcon: "https://media.degenerousdao.com/assets/logo.png",
  projectId: "0b8a3fac6220753a719b9aeceb8f19fb",
  chains: [sepolia],
  transports: { [CHAIN_ID]: http(RPC_URL) },
  ssr: false,
});

const queryClient = new QueryClient();

/* ------------------------------------------------------------------ */
/* 2.  Provider wrapper                                               */
/* ------------------------------------------------------------------ */
export const Web3Providers: FC<PropsWithChildren> = ({ children }) => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        modalSize="wide"
        theme={darkTheme({
          accentColor: "rgb(51, 226, 230)",
          accentColorForeground: "rgb(51, 226, 230)",
          borderRadius: "large",
          fontStack: "rounded",
          overlayBlur: "large",
        })}
      >
        {children}
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

/* ------------------------------------------------------------------ */
/* 3.  Sync RainbowKit ↔ Svelte stores with one hook                  */
/* ------------------------------------------------------------------ */
function useSyncStores() {
  useAccountEffect({
    async onConnect({ address, connector }) {
      /* update local stores */
      walletAddress.set(address);
      username.set(`${address.slice(0, 6)}…${address.slice(-4)}`);

      /* RainbowKit returns an EIP‑1193 provider (type unknown) */
      const raw = (await connector.getProvider()) as Eip1193Provider;
      const provider = new BrowserProvider(raw, "any") as Provider;
      userProvider.set(provider);
    },

    onDisconnect() {
      /* ensure surrounding Svelte UI notices logout */
      ClearCache(POTENTIALS_KEY);
      location.reload();
    },
  });
}

/* ------------------------------------------------------------------ */
/* 4.  Custom Connect / Account button                                */
/* ------------------------------------------------------------------ */
const RainbowConnectInner: FC = () => {
  useSyncStores();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        if (!mounted) return <div aria-hidden="true" />;

        const connected = account && chain;

        if (!connected) {
          return (
            <button className="orange-btn" onClick={openConnectModal}>
              Sign&nbsp;in
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button className="orange-btn" onClick={openChainModal}>
              Wrong&nbsp;network
            </button>
          );
        }

        return (
          <button className="orange-btn" onClick={openAccountModal}>
            Sign&nbsp;out
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};

/* ------------------------------------------------------------------ */
/* 5.  Export ready‑to‑mount component                                */
/* ------------------------------------------------------------------ */
const Rainbow: FC = () => (
  <Web3Providers>
    <RainbowConnectInner />
  </Web3Providers>
);

export default Rainbow;
