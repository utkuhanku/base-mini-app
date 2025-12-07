const { ethers, run } = require("hardhat");

async function main() {
    console.log("Starting deployment...");

    // DETECT NETWORK
    const network = await ethers.provider.getNetwork();
    const networkName = network.chainId === 8453n ? "base-mainnet" : "base-sepolia";
    console.log(`Detected Network: ${networkName} (Chain ID: ${network.chainId})`);

    let USDC_ADDRESS;
    if (network.chainId === 8453n) {
        // MAINNET
        USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    } else {
        // SEPOLIA
        USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    }

    // Treasury (default to deployer for now if not set)
    const [deployer] = await ethers.getSigners();
    const TREASURY = process.env.TREASURY_ADDRESS || deployer.address;

    // Prices
    // USDC (6 decimals)
    const MINT_PRICE_USDC = 1000000; // $1
    const EDIT_PRICE_USDC = 2000000; // $2

    // ETH (18 decimals) - Approx $1 USD = 0.0003 ETH (assuming $3300 ETH)
    const MINT_PRICE_ETH = ethers.parseEther("0.0003");
    const EDIT_PRICE_ETH = ethers.parseEther("0.0006");

    console.log(`Deploying with account: ${deployer.address}`);
    console.log(`Treasury: ${TREASURY}`);
    console.log(`USDC: ${USDC_ADDRESS}`);

    const CardSBT = await ethers.getContractFactory("CardSBT");
    const cardSBT = await CardSBT.deploy(
        USDC_ADDRESS,
        TREASURY,
        MINT_PRICE_USDC,
        MINT_PRICE_ETH,
        EDIT_PRICE_USDC,
        EDIT_PRICE_ETH
    );

    // Hardhat-ethers v6 might behave differently with deploy(), updated to be safe
    // If deploy() returns a ContractTransactionResponse, we wait. If Contract, we wait for deployment.
    // In newer hardhat-ethers, .deploy() starts it.
    await cardSBT.waitForDeployment();
    const address = await cardSBT.getAddress();

    console.log("CardSBT deployed to:", address);

    // WAIT BEFORE VERIFYING
    console.log("Waiting for block confirmations...");
    // Sleep 15s to allow block propagation for verification
    await new Promise(r => setTimeout(r, 15000));

    console.log("Verifying contract...");
    try {
        await run("verify:verify", {
            address: address,
            constructorArguments: [
                USDC_ADDRESS,
                TREASURY,
                MINT_PRICE_USDC,
                MINT_PRICE_ETH,
                EDIT_PRICE_USDC,
                EDIT_PRICE_ETH
            ],
        });
        console.log("Verification successful");
    } catch (e) {
        console.log("Verification failed (or already verified):", e);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
