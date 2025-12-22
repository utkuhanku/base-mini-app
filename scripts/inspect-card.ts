import { createPublicClient, http, parseAbi } from 'viem';
import { base, baseSepolia } from 'viem/chains';

async function main() {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
    });

    const CONTRACT_ADDRESS = "0x4003055676749a0433EA698A8B70E45d398FC87f";

    console.log("Reading profiles from contract...");

    for (let i = 1; i <= 5; i++) {
        try {
            const data = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: parseAbi([
                    "function profiles(uint256) view returns (string displayName, string avatarUrl, string bio, string socials, string websites)"
                ]),
                functionName: "profiles",
                args: [BigInt(i)]
            });

            const [name, avatar, bio, socials, websites] = data as [string, string, string, string, string];
            console.log(`\n--- TOKEN #${i} ---`);
            console.log("Name:", name);
            console.log("Bio:", bio);
            console.log("Socials (RAW):", socials);
        } catch (e) {
            // console.log(`Token #${i} error or not existent`);
        }

        const parsed = JSON.parse(encoded);
        console.log("Parsed Object:", parsed);
    } catch (e) {
        console.error("Parse Error:", e);
    }
}

main().catch(console.error);
