
import { createPublicClient, http, parseAbi, formatEther } from 'viem';
import { base } from 'viem/chains';

const CARD_SBT_ADDRESS = "0x4003055676749a0433EA698A8B70E45d398FC87f";

async function main() {
    const client = createPublicClient({
        chain: base,
        transport: http()
    });

    try {
        const abi = parseAbi([
            "function mintPriceETH() view returns (uint256)",
            "function editPriceETH() view returns (uint256)"
        ]);

        const mintPrice = await client.readContract({
            address: CARD_SBT_ADDRESS,
            abi: abi,
            functionName: "mintPriceETH"
        });

        const editPrice = await client.readContract({
            address: CARD_SBT_ADDRESS,
            abi: abi,
            functionName: "editPriceETH"
        });

        console.log(`Mint Price: ${formatEther(mintPrice)} ETH (${mintPrice} wei)`);
        console.log(`Edit Price: ${formatEther(editPrice)} ETH (${editPrice} wei)`);

    } catch (error) {
        console.error("Error reading prices:", error);
    }
}

main();
