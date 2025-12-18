const { createWalletClient, createPublicClient, http, parseAbi, parseUnits } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { base } = require('viem/chains');
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CARD_SBT_ADDRESS || "0x4003055676749a0433EA698A8B70E45d398FC87f";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in .env");
    process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

const wallet = createWalletClient({
    account,
    chain: base,
    transport: http()
});

const publicClient = createPublicClient({
    chain: base,
    transport: http()
});

async function main() {
    console.log(`📡 Connecting to Base Mainnet...`);
    console.log(`📝 Updating prices on contract: ${CONTRACT_ADDRESS}`);
    console.log(`🔑 Account: ${account.address}`);

    // ETH Prices (Approximate)
    // $0.50 @ $3800/ETH ≈ 0.000131 ETH. Let's start with 0.00015 ETH (~$0.57)
    // $0.75 @ $3800/ETH ≈ 0.000197 ETH. Let's start with 0.000225 ETH (~$0.85)

    // We'll trust the user wants low barriers.
    // 0.00015 ETH
    // 0.000225 ETH

    // USDC Prices (6 decimals)
    // $0.50 = 500000
    // $0.75 = 750000

    const MINT_PRICE_ETH = parseUnits('0.00015', 18);
    const EDIT_PRICE_ETH = parseUnits('0.000225', 18);

    const MINT_PRICE_USDC = 500000n; // 0.5 USDC
    const EDIT_PRICE_USDC = 750000n; // 0.75 USDC

    console.log(`
    New Settings:
    - Mint ETH: ${MINT_PRICE_ETH} wei (0.00015 ETH)
    - Edit ETH: ${EDIT_PRICE_ETH} wei (0.000225 ETH)
    - Mint USDC: ${MINT_PRICE_USDC} (0.50 USDC)
    - Edit USDC: ${EDIT_PRICE_USDC} (0.75 USDC)
    `);

    const abi = parseAbi([
        "function setPricing(uint256 _mintPriceUSDC, uint256 _mintPriceETH, uint256 _editPriceUSDC, uint256 _editPriceETH) external"
    ]);

    try {
        const hash = await wallet.writeContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'setPricing',
            args: [MINT_PRICE_USDC, MINT_PRICE_ETH, EDIT_PRICE_USDC, EDIT_PRICE_ETH]
        });

        console.log(`✅ Transaction sent! Hash: ${hash}`);
        console.log(`Waiting for confirmation...`);

        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`🎉 Prices Updated Successfully!`);

    } catch (error) {
        console.error("❌ Error updating prices:", error);
    }
}

main();
