import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract Config (Replace with deployed address later or use env)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CARD_SBT_ADDRESS || "0x4003055676749a0433EA698A8B70E45d398FC87f";
const CONTRACT_ABI = parseAbi([
    "function totalSupply() view returns (uint256)",
    "function profiles(uint256) view returns (string displayName, string avatarUrl, string bio, string socials, string websites)",
    "function ownerOf(uint256) view returns (address)"
]);

// Determine Chain based on address or env (Hardcoded fallback is on Mainnet 8453)
import { base, baseSepolia } from 'viem/chains';
const IS_MAINNET = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' || CONTRACT_ADDRESS.startsWith("0x4003"); // 0x4003 is our mainnet deployment
const TARGET_CHAIN = IS_MAINNET ? base : baseSepolia;

const client = createPublicClient({
    chain: TARGET_CHAIN,
    transport: http()
});

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    // Fallback logic handled by constant above


    try {
        const totalSupply = await client.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'totalSupply'
        });

        const cards = [];
        // Fetch last 20 cards (reverse chronological)
        // Adjust loop for pagination in production
        const start = Number(totalSupply);
        const end = Math.max(1, start - 20);

        for (let i = start; i >= end; i--) {
            try {
                // Parallelize these in production with multicall
                const [profile, owner] = await Promise.all([
                    client.readContract({
                        address: CONTRACT_ADDRESS as `0x${string}`,
                        abi: CONTRACT_ABI,
                        functionName: 'profiles',
                        args: [BigInt(i)]
                    }),
                    client.readContract({
                        address: CONTRACT_ADDRESS as `0x${string}`,
                        abi: CONTRACT_ABI,
                        functionName: 'ownerOf',
                        args: [BigInt(i)]
                    })
                ]);

                // profile returns array/object depending on viem version + ABI
                // with named outputs in ABI, it usually returns an object or array
                // let's assume array for safety matching the ABI order: displayName, avatarUrl, bio, socials, websites

                // Safe casting: profile is readonly
                const p = profile as any; // Viem returns array for unnamed struct read usually, or object for named? 
                // With parseAbi and named returns, it often returns an array. [displayName, avatarUrl, ...]

                cards.push({
                    tokenId: i,
                    owner: owner,
                    displayName: p[0],
                    avatarUrl: p[1],
                    bio: p[2],
                    socials: p[3],
                    websites: p[4]
                });
            } catch (err) {
                console.warn(`Failed to fetch card ${i}`, err);
            }
        }

        return NextResponse.json(cards);
    } catch (e) {
        console.error("Feed API Error:", e);
        return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
    }
}
