
export interface StoryPrototype {
    title: string;
    narrative: string;
    archetype: string;
}

export const ZORA_MOCK_IMAGES = [
    "https://ipfs.io/ipfs/bafybeicj5s5z4y2l4l4d5s5z4y2l4l4d5s5z4y2l4l4d5s5z4y2l4",
    "https://zora.co/assets/og-image.png",
];

export function generateStory(stats: { dailyTxCount: number, zoraMints: number, baseReacts: number }): StoryPrototype {
    const { dailyTxCount, zoraMints, baseReacts } = stats;

    // Determine Archetype (Based Version)
    let archetype = "The Lurker";
    if (dailyTxCount > 5) archetype = "Based Builder";
    if (zoraMints > 5) archetype = "Mint Maxi";
    if (baseReacts > 100) archetype = "Reply Guy";
    if (dailyTxCount > 10 && zoraMints > 10) archetype = "GigaBrain";

    // Narrative Templates (Crypto Native / Based Slang)
    const narratives = {
        "The Lurker": "Anon, you're ghosting the chain. Low signal, high potential. Time to stop watching the charts and start shipping. The mempool is waiting for you. Ignite the wallet and get based.",

        "Based Builder": `You're cooking on-chain. ${dailyTxCount} txs today? You're not just using the network, you're scaling it. Deploying contracts, shipping features, staying based. WAGMI is written in your code.`,

        "Mint Maxi": `Respect the vibes. You've collected ${zoraMints} pieces of culture. Your wallet is a museum of the new internet. While others fade, you mint. Pure appreciation for the craft. Stay aesthetic.`,

        "Reply Guy": `You're the noise in the signal—in a good way. ${baseReacts} interactions? You're keeping Farcaster alive. Town square loudmouth, engagement farmer, community glue. The algorithm loves you.`,

        "GigaBrain": "Absolute unit of a wallet. You deploy, you mint, you engage. You are playing 4D chess on L2 while others are stuck on L1 fees. High IQ on-chain behavior. You are the Alpha."
    };

    const narrative = narratives[archetype as keyof typeof narratives] || narratives["The Lurker"];

    return {
        title: `ARCHETYPE // ${archetype.toUpperCase()}`,
        narrative,
        archetype
    };
}
