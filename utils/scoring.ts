
export interface ScoreData {
    dailyTxCount: number;
    activeDaysLast30d: number;
    zoraPosts: number;
    zoraMints: number;
    baseCasts: number;
    baseReacts: number;
}

export interface ScoreResult {
    rawScore: number;
    normalizedScore: number;
    color: string;
}

export function calculateColor(normalizedScore: number): string {
    // 0 -> deep red (#FF3B30) -> rgb(255, 59, 48)
    // 1 -> Base blue (#0052FF) -> rgb(0, 82, 255)
    const red = { r: 255, g: 59, b: 48 };
    const blue = { r: 0, g: 82, b: 255 };

    const t = Math.max(0, Math.min(1, normalizedScore)); // Clamp 0-1

    const r = Math.round(red.r + (blue.r - red.r) * t);
    const g = Math.round(red.g + (blue.g - red.g) * t);
    const b = Math.round(red.b + (blue.b - red.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
}

export function computeScore(data: ScoreData): ScoreResult {
    // 2.1 On-chain activity
    // onchainScore = min(dailyTxCount, 10) * 2 + activeDaysLast30d
    const onchainScore = (Math.min(data.dailyTxCount, 10) * 2) + data.activeDaysLast30d;

    // 2.2 Zora activity
    // zoraScore = (zoraPosts * 1) + (zoraMints * 1.5)
    const zoraScore = (data.zoraPosts * 1) + (data.zoraMints * 1.5);

    // 2.3 Farcaster/Base activity
    // baseAppScore = (baseCasts * 0.5) + (baseReacts * 0.2)
    const baseAppScore = (data.baseCasts * 0.5) + (data.baseReacts * 0.2);

    // 2.4 Normalization
    const rawScore = onchainScore + zoraScore + baseAppScore;
    const normalizedScore = Math.min(Math.max(rawScore / 100, 0), 1);

    return {
        rawScore,
        normalizedScore,
        color: calculateColor(normalizedScore)
    };
}
