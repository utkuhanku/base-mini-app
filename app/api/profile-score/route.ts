import { NextRequest, NextResponse } from 'next/server';
import { calculateScore } from '../../../utils/scoring';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

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
