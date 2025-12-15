import { createPublicClient, http, formatEther } from 'viem';
import { base, zora } from 'viem/chains';

export interface ScoreData {
    address: string;
    baseTxCount: number;
    zoraTxCount: number;
    baseBalance: string;
    zoraBalance: string;
    totalTxCount: number;
    normalizedScore: number;
    color: string;
}

const baseClient = createPublicClient({
    chain: base,
    transport: http()
});

const zoraClient = createPublicClient({
    chain: zora,
    transport: http()
});

export const calculateScore = async (address: string): Promise<ScoreData> => {
    try {
        const [baseCount, zoraCount, baseBal, zoraBal] = await Promise.all([
            baseClient.getTransactionCount({ address: address as `0x${string}` }),
            zoraClient.getTransactionCount({ address: address as `0x${string}` }),
            baseClient.getBalance({ address: address as `0x${string}` }),
            zoraClient.getBalance({ address: address as `0x${string}` })
        ]);

        const totalTx = baseCount + zoraCount;

        // Simple Scoring Algorithm
        // 0-10 tx = Low
        // 10-50 tx = Medium
        // 50+ tx = High
        // + Bonus for Zora activity

        let score = 0;

        // Base Activity (60% weight)
        if (baseCount > 0) score += 0.1;
        if (baseCount > 10) score += 0.2;
        if (baseCount > 50) score += 0.2;
        if (baseCount > 100) score += 0.1;

        // Zora Activity (40% weight)
        if (zoraCount > 0) score += 0.1;
        if (zoraCount > 5) score += 0.2;
        if (zoraCount > 20) score += 0.1;

        // Cap at 0.99
        const normalizedScore = Math.min(score, 0.99);

        // Determine Color based on score
        let color = "#666666"; // Gray (New)
        if (normalizedScore > 0.3) color = "#0052FF"; // Base Blue
        if (normalizedScore > 0.6) color = "#FFD700"; // Gold
        if (normalizedScore > 0.85) color = "#00FFFF"; // Cyan/Diamond

        return {
            address,
            baseTxCount: baseCount,
            zoraTxCount: zoraCount,
            baseBalance: formatEther(baseBal),
            zoraBalance: formatEther(zoraBal),
            totalTxCount: totalTx,
            normalizedScore,
            color
        };

    } catch (error) {
        console.error("Error calculating score:", error);
        return {
            address,
            baseTxCount: 0,
            zoraTxCount: 0,
            baseBalance: "0",
            zoraBalance: "0",
            totalTxCount: 0,
            normalizedScore: 0.1,
            color: "#666666"
        };
    }
};
