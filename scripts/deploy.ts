import { ethers } from "hardhat";

async function main() {
    console.log("Deploying ConnectionSBT...");

    const connectionSBT = await ethers.deployContract("ConnectionSBT");

    await connectionSBT.waitForDeployment();

    console.log(
        `ConnectionSBT deployed to ${connectionSBT.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
