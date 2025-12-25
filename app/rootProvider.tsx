"use client";

import { ReactNode, useState } from "react";
import { base, baseSepolia } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { createConfig, http, WagmiProvider } from "wagmi";
import { coinbaseWallet } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@coinbase/onchainkit/styles.css";

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "84532";
const targetChain = CHAIN_ID === "8453" ? base : baseSepolia;

const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [
    coinbaseWallet({
      appName: 'Identity',
    }),
  ],
  ssr: true,
});

import "@farcaster/auth-kit/styles.css";
import { AuthKitProvider } from "@farcaster/auth-kit";

const authKitConfig = {
  rpcUrl: "https://mainnet.optimism.io", // Mainnet Optimism RPC for Farcaster
  domain: "base-mini-app-beryl.vercel.app", // Domain from MiniKit Config
  siweUri: "https://base-mini-app-beryl.vercel.app/login", // Redirect URI (optional, but good practice)
};

export function RootProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthKitProvider config={authKitConfig}>
          <OnchainKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={targetChain}
          >
            {children}
          </OnchainKitProvider>
        </AuthKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
