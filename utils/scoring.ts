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

export const calculateScore = async (address: string, zoraCreatorName?: string): Promise<ScoreData & { followers: number, reactions: number, badge: string }> => {
    try {
        const [baseCount, zoraCount, baseBal, zoraBal] = await Promise.all([
            baseClient.getTransactionCount({ address: address as `0x${string}` }),
            zoraClient.getTransactionCount({ address: address as `0x${string}` }),
            baseClient.getBalance({ address: address as `0x${string}` }),
            zoraClient.getBalance({ address: address as `0x${string}` })
        ]);

        const totalTx = baseCount + zoraCount;

        // --- Deterministic Social Simulation ---
        // We use the address characters to generate pseudo-random but stable numbers
        const addressSum = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Followers: Base roughly on tx count + random factor from address
        // A user with 100 tx might have 150-500 followers
        // A user with 0 tx might have 10-50 followers (bots/farming)
        const randomFactor = (addressSum % 100) / 100; // 0.0 - 1.0
        let followers = Math.floor((totalTx * 2.5) + (randomFactor * 200) + 12);

        // Reactions: Usually higher than followers if active
        let reactions = Math.floor(followers * (1.2 + randomFactor));

        // Zora Creator Bonus
        let zoraBonus = 0;
        if (zoraCreatorName && zoraCreatorName.length > 2) {
            // If they entered a name, we give them "benefit of the doubt" simulation
            zoraBonus = 0.25;
            followers += 240; // Creator boost
            reactions += 850;
        }

        let score = 0;

        // Base Activity (50% weight)
        if (baseCount > 0) score += 0.1;
        if (baseCount > 10) score += 0.2;
        if (baseCount > 50) score += 0.1;
        if (baseCount > 200) score += 0.1;

        // Zora Activity (30% weight)
        if (zoraCount > 0) score += 0.1;
        if (zoraCount > 5) score += 0.2;

        // Wealth / DeFi Signal (20%)
        const ethBal = parseFloat(formatEther(baseBal));
        if (ethBal > 0.005) score += 0.1;
        if (ethBal > 0.1) score += 0.1;

        score += zoraBonus;

        // Cap at 0.99
        const normalizedScore = Math.min(score, 0.99);

        // Determine Color & Badge
        let color = "#666666"; // Gray
        let badge = "Novice";

        if (normalizedScore > 0.3) { color = "#0052FF"; badge = "Citizen"; } // Base Blue
        if (normalizedScore > 0.6) { color = "#FFD700"; badge = "Gold" }
        if (normalizedScore > 0.85) { color = "#00FFFF"; badge = "Diamond"; }

        return {
            address,
            baseTxCount: baseCount,
            zoraTxCount: zoraCount,
            baseBalance: formatEther(baseBal),
            zoraBalance: formatEther(zoraBal),
            totalTxCount: totalTx,
            normalizedScore,
            color,
            followers,
            reactions,
            badge
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
            color: "#666666",
            followers: 0,
            reactions: 0,
            badge: "Ghost"
        };
    }
};
