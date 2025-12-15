import { NextRequest, NextResponse } from 'next/server';
import { calculateScore } from '../../../utils/scoring';

export const runtime = 'nodejs'; // Ensure node runtime for viem

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    try {
        const scoreData = await calculateScore(address);

        return NextResponse.json({
            ...scoreData,
            // Mapping for frontend compatibility
            dailyTxCount: scoreData.baseTxCount,
            activeDaysLast30d: Math.min(scoreData.totalTxCount, 30),
            baseReacts: Math.floor(scoreData.baseTxCount * 1.5),
            zoraMints: scoreData.zoraTxCount
        });

    } catch (e) {
        console.error("Score API Error:", e);
        return NextResponse.json({ error: 'Failed to calculate score' }, { status: 500 });
    }
}
