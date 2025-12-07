import { ReactNode } from "react";
import { base, baseSepolia } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "84532";
const targetChain = CHAIN_ID === "8453" ? base : baseSepolia;

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={targetChain}
    >
      {children}
    </OnchainKitProvider>
  );
}
