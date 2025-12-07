const { ethers, run } = require("hardhat");

async function main() {
    console.log("Starting deployment...");

    // CONSTANTS FOR BASE SEPOLIA
    // USDC on Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

    // Treasury (default to deployer for now if not set)
    const [deployer] = await ethers.getSigners();
    const TREASURY = process.env.TREASURY_ADDRESS || deployer.address;

    // Prices (6 decimals for USDC)
    const MINT_PRICE = 1000000; // $1
    const EDIT_PRICE = 2000000; // $2

    console.log(`Deploying with account: ${deployer.address}`);
    console.log(`Treasury: ${TREASURY}`);
    console.log(`USDC: ${USDC_ADDRESS}`);

    const CardSBT = await ethers.getContractFactory("CardSBT");
    const cardSBT = await CardSBT.deploy(
        USDC_ADDRESS,
        TREASURY,
        MINT_PRICE,
        EDIT_PRICE
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
                MINT_PRICE,
                EDIT_PRICE
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
