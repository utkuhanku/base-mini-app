
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const CARD_ADDRESS = "0x4003055676749a0433EA698A8B70E45d398FC87f";
const TOKEN_ID = 1n; // User is #1

const client = createPublicClient({
    chain: base,
    transport: http(),
});

async function main() {
    console.log(`Reading Card #${TOKEN_ID} from ${CARD_ADDRESS}...`);

    const data = await client.readContract({
        address: CARD_ADDRESS,
        abi: parseAbi([
            "function profiles(uint256) view returns (string displayName, string avatarUrl, string bio, string socials, string websites)"
        ]),
        functionName: "profiles",
        args: [TOKEN_ID]
    });

    console.log("\nRAW DATA RETURNED:");
    console.log("Name:", data[0]);
    console.log("Avatar:", data[1]);
    console.log("Bio:", data[2]);
    console.log("Socials (RAW):", data[3]);
    console.log("Websites:", data[4]);

    console.log("\n--- PARSING ATTEMPT ---");
    try {
        let encoded = data[3];
        console.log("Type:", typeof encoded);

        if (typeof encoded === 'string' && encoded.startsWith('"') && encoded.endsWith('"')) {
            console.log("Detected double stringify, peeling one layer...");
            encoded = JSON.parse(encoded);
            console.log("New Value:", encoded);
        }

        const parsed = JSON.parse(encoded);
        console.log("Parsed Object:", parsed);
    } catch (e) {
        console.error("Parse Error:", e);
    }
}

main().catch(console.error);
