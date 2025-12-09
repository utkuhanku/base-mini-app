const { createPublicClient, http, parseAbi, formatEther } = require('viem');
const { base } = require('viem/chains');

const CONTRACT_ADDRESS = "0x4003055676749a0433EA698A8B70E45d398FC87f";

async function main() {
    console.log("Reading contract state from Base Mainnet...");
    const client = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org")
    });

    const abi = parseAbi([
        "function mintPriceETH() view returns (uint256)",
        "function mintPriceUSDC() view returns (uint256)",
        "function editPriceETH() view returns (uint256)",
        "function paymentMethod() view returns (uint8)"
        // Note: PaymentMethod is an enum but we can't easily read it globally if it's not public state variable, 
        // but the error implies we might need to check if we are sending the right value.
    ]);

    try {
        const [mintETH, mintUSDC, editETH] = await client.multicall({
            contracts: [
                { address: CONTRACT_ADDRESS, abi, functionName: 'mintPriceETH' },
                { address: CONTRACT_ADDRESS, abi, functionName: 'mintPriceUSDC' },
                { address: CONTRACT_ADDRESS, abi, functionName: 'editPriceETH' }
            ],
            allowFailure: false
        });

        console.log("--- LIVE CONTRACT VALUES ---");
        console.log(`Address: ${CONTRACT_ADDRESS}`);
        console.log(`Mint Price ETH:  ${mintETH} (${formatEther(mintETH)} ETH)`);
        console.log(`Mint Price USDC: ${mintUSDC}`);
        console.log(`Edit Price ETH:  ${editETH} (${formatEther(editETH)} ETH)`);
    } catch (error) {
        console.error("Error reading contract:", error);
    }
}

main();
