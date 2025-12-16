
const { createPublicClient, http, parseAbi, formatEther } = require('viem');
const { base } = require('viem/chains');

const CONTRACT_ADDRESS = "0x4003055676749a0433EA698A8B70E45d398FC87f";

const client = createPublicClient({
    chain: base,
    transport: http()
});

async function main() {
    console.log("Checking Prices...");

    const abi = parseAbi([
        "function mintPriceETH() view returns (uint256)",
        "function editPriceETH() view returns (uint256)"
    ]);

    try {
        const mintPrice = await client.readContract({ address: CONTRACT_ADDRESS, abi, functionName: 'mintPriceETH' });
        console.log("MINT PRICE:", mintPrice.toString(), "wei", `(${formatEther(mintPrice)} ETH)`);
    } catch (e) {
        console.log("Error reading mintPriceETH:", e.message.split('\n')[0]);
    }

    try {
        const editPrice = await client.readContract({ address: CONTRACT_ADDRESS, abi, functionName: 'editPriceETH' });
        console.log("EDIT PRICE:", editPrice.toString(), "wei", `(${formatEther(editPrice)} ETH)`);
    } catch (e) {
        console.log("Error reading editPriceETH:", e.message.split('\n')[0]);
    }
}

main();
