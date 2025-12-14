
import { NextResponse } from 'next/server';
import { computeScore } from '../../../utils/scoring';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // 1. Fetch Data in Parallel
    // In a real implementation, you would fetch from:
    // - Base RPC (using viem or ethers) for transaction history
    // - Zora API (GraphQL) for posts/mints
    // - Farcaster Hub (Neynar/Hubble) for casts/reactions

    // MOCK DATA for v1 Prototype / "Example Code" Requirement
    // To allow testing "Low" vs "High" scores, we can use specific mock addresses or random generation.
    // For production, replace these Math.random() calls with real API fetches.

    const isDemoLow = address.toLowerCase().includes('0x000'); // Quick hack to force low score for testing

    const mockData = {
        dailyTxCount: isDemoLow ? 1 : Math.floor(Math.random() * 15),
        activeDaysLast30d: isDemoLow ? 2 : Math.floor(Math.random() * 30),
        zoraPosts: isDemoLow ? 0 : Math.floor(Math.random() * 10),
        zoraMints: isDemoLow ? 1 : Math.floor(Math.random() * 20),
        baseCasts: isDemoLow ? 5 : Math.floor(Math.random() * 100),
        baseReacts: isDemoLow ? 10 : Math.floor(Math.random() * 200),
    };

    const scoreResult = computeScore(mockData);

    // Intentional delay to simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({
        address,
        ...mockData,
        ...scoreResult
    });
}
