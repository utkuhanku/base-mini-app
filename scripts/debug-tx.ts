
import { createPublicClient, http, parseAbi, parseUnits } from 'viem';
import { base } from 'viem/chains';

// Env vars provided manually or via dotenv if needed
const CONTRACT_ADDRESS = "0x4003055676749a0433EA698A8B70E45d398FC87f";
const USER_ADDRESS = "0x6eddd...79A8"; // From the screenshot approximately, or just use a random one to test 'mint'
// Actually for updateCard, I need to be the owner of a token.
// Let's test `mintCard` first since anyone can call it.

const client = createPublicClient({
    chain: base,
    transport: http()
});

async function main() {
    console.log("Debugging Contract Interaction...");

    const abi = parseAbi([
        "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
        "function mintCard(Profile memory _profile, uint8 _method) external payable",
        "function updateCard(Profile memory _profile, uint8 _method) external payable",
        "function mintPriceETH() view returns (uint256)",
        "function editPriceETH() view returns (uint256)"
    ]);

    // Error Definitions
    const errors = [
        "error InvalidAmount()",
        "error InsufficientFunds()",
        "error InvalidPayment()",
        "error ProfileAlreadyMinted()",
        "error ProfileAlreadyExists()"
    ];

    const abiWithErrors = parseAbi([
        "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
        "function mintCard(Profile memory _profile, uint8 _method) external payable",
        "function updateCard(Profile memory _profile, uint8 _method) external payable",
        "function mintPriceETH() view returns (uint256)",
        "function editPriceETH() view returns (uint256)",
        ...errors
    ]);

    // 1. Try to read prices
    try {
        const pPrice: any = await client.readContract({ address: CONTRACT_ADDRESS, abi: abiWithErrors, functionName: 'mintPriceETH' });
        console.log("Contract Mint Price ETH:", pPrice.toString(), "wei");
    } catch (e) {
        console.log("Could not read mintPriceETH:", e.message?.split('\n')[0]);
    }

    try {
        const uPrice: any = await client.readContract({ address: CONTRACT_ADDRESS, abi: abiWithErrors, functionName: 'editPriceETH' });
        console.log("Contract Edit Price ETH:", uPrice.toString(), "wei");
    } catch (e) {
        console.log("Could not read editPriceETH:", e.message?.split('\n')[0]);
    }

    // 2. Simulate Mint with LOW value
    console.log("\n--- Simulating Mint with 0.00013 ETH ---");
    try {
        await client.simulateContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'mintCard',
            args: [{
                displayName: "Test User",
                avatarUrl: "",
                bio: "Test Bio",
                socials: "{}",
                websites: ""
            }, 1], // 1 = ETH
            value: parseUnits("0.00013", 18),
            account: "0x1234567890123456789012345678901234567890" // Random sender
        });
        console.log("SUCCESS: Mint simulated with 0.00013 ETH");
    } catch (e) {
        console.log("FAILURE: Mint Reverted");
        console.log("Reason:", e.message || e);
    }

    // 3. Simulate Mint with HIGHER value (Standard Hackathon Price usually 0.0003 or 0.0005)
    console.log("\n--- Simulating Mint with 0.0005 ETH ---");
    try {
        await client.simulateContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'mintCard',
            args: [{
                displayName: "Test User",
                avatarUrl: "",
                bio: "Test Bio",
                socials: "{}",
                websites: ""
            }, 1], // 1 = ETH
            value: parseUnits("0.0005", 18),
            account: "0x1234567890123456789012345678901234567890"
        });
        console.log("SUCCESS: Mint simulated with 0.0005 ETH");
    } catch (e) {
        console.log("FAILURE: Mint Reverted with 0.0005 ETH");
    }

    // Error Definitions
    const errors = [
        "error InvalidAmount()",
        "error InsufficientFunds()",
        "error InvalidPayment()",
        "error ProfileAlreadyMinted()",
        "error ProfileAlreadyExists()"
    ];

    const abiWithErrors = parseAbi([
        "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
        "function mintCard(Profile memory _profile, uint8 _method) external payable",
        ...errors
    ]);

    // 4. Simulate Mint with ORIGINAL 0.0006 ETH
    console.log("\n--- Simulating Mint with 0.0006 ETH ---");
    try {
        await client.simulateContract({
            address: CONTRACT_ADDRESS,
            abi: abiWithErrors,
            functionName: 'mintCard',
            args: [{
                displayName: "Test User 2", // Changed name slightly
                avatarUrl: "",
                bio: "Test Bio",
                socials: "{}",
                websites: ""
            }, 1],
            value: parseUnits("0.0006", 18),
            account: "0x1234567890123456789012345678901234567890"
        });
        console.log("SUCCESS: Mint simulated with 0.0006 ETH");
    } catch (e) {
        console.log("FAILURE: Mint Reverted with 0.0006 ETH");
        console.log("Error Name:", e.name);
        console.log("Full Error:", e.message?.slice(0, 200));
        // check data
        if (e.data) console.log("Revert Data:", e.data);
    }
}

main();
