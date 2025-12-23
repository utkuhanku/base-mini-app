
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

    // Error definitions already declared above
    // Reuse abiWithErrors logic if needed or just use current abi for test

    // 4. Simulate Mint with ORIGINAL 0.0006 ETH

    // 5. Simulate Mint with EXACT 0.0003 ETH
    console.log("\n--- Simulating Mint with EXACT 0.0003 ETH ---");
    try {
        await client.simulateContract({
            address: CONTRACT_ADDRESS,
            abi: abiWithErrors,
            functionName: 'mintCard',
            args: [{
                displayName: "Test User Exact",
                avatarUrl: "",
                bio: "Test Bio",
                socials: "{}",
                websites: ""
            }, 1],
            value: parseUnits("0.0003", 18), // EXACT
            account: "0x1234567890123456789012345678901234567890" // Random
        });
        console.log("SUCCESS: Mint simulated with EXACT 0.0003 ETH");
    } catch (e) {
        console.log("FAILURE: Mint Reverted with EXACT 0.0003 ETH");
        console.log("Reason:", e.message?.slice(0, 100));
    }

    // 6. Simulate Mint with OVERPAYMENT (0.00031 ETH)
    console.log("\n--- Simulating Mint with 0.00031 ETH (Overpayment) ---");
    try {
        await client.simulateContract({
            address: CONTRACT_ADDRESS,
            abi: abiWithErrors,
            functionName: 'mintCard',
            args: [{
                displayName: "Test User Over",
                avatarUrl: "",
                bio: "Test Bio",
                socials: "{}",
                websites: ""
            }, 1],
            value: parseUnits("0.00031", 18),
            account: "0x1234567890123456789012345678901234567890"
        });
        console.log("SUCCESS: Mint simulated with OVERPAYMENT");
    } catch (e) {
        console.log("FAILURE: Mint Reverted with OVERPAYMENT");
        // We expect this to fail if strict equality is used
    }

    // 7. Simulate Edit with EXACT 0.0006 ETH
    // NOTE: Update usually requires the user to OWN a card? 
    // Or does it mint if not exists? No, updateCard usually assumes existence.
    // Simulating updateCard from random address (who has no card) might revert with "ProfileDoesntExist" or similar.
    // But let's check if it reverts with InsufficientPayment FIRST.
    console.log("\n--- Simulating Edit with EXACT 0.0006 ETH ---");
    try {
        await client.simulateContract({
            address: CONTRACT_ADDRESS,
            abi: abiWithErrors,
            functionName: 'updateCard',
            args: [{
                displayName: "Test User Update",
                avatarUrl: "",
                bio: "Test Bio",
                socials: "{}",
                websites: ""
            }, 1],
            value: parseUnits("0.0006", 18),
            account: "0x6eddd....." // Actually we need a real owner address to pass "ProfileDoesntExist" check if it comes first.
            // Let's use the random address, if it fails with "ProfileNotFound" then Payment was likely OK.
        });
        console.log("SUCCESS: Edit simulated (or passed payment check)");
    } catch (e) {
        console.log("FAILURE: Edit Reverted");
        console.log("Reason:", e.message?.slice(0, 200));
    }
}

main();
