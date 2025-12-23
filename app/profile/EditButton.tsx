import { useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi'; // Added useReadContract
import { parseUnits, parseAbi, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import {
    Transaction,
    TransactionButton,
    TransactionStatus,
    TransactionStatusLabel,
    TransactionStatusAction,
    TransactionToast,
    TransactionToastIcon,
    TransactionToastLabel,
    TransactionToastAction
} from '@coinbase/onchainkit/transaction';

// Configuration
const CARD_SBT_ADDRESS = process.env.NEXT_PUBLIC_CARD_SBT_ADDRESS || "0x4003055676749a0433EA698A8B70E45d398FC87f";
// Check if address matches our known mainnet deployment
const IS_KNOWN_MAINNET = CARD_SBT_ADDRESS.toLowerCase() === "0x4003055676749a0433EA698A8B70E45d398FC87f".toLowerCase();
// Force Mainnet if we are using the mainnet contract, otherwise fallback to env or Sepolia
const CHAIN_ID = IS_KNOWN_MAINNET ? "8453" : (process.env.NEXT_PUBLIC_CHAIN_ID || "84532");
const IS_MAINNET = CHAIN_ID === "8453";
const TARGET_CHAIN = IS_MAINNET ? base : baseSepolia;

interface EditButtonProps {
    onUpdateSuccess: (hash: string) => void;
    profile: {
        name: string;
        bio: string;
        profilePicUrl: string;
        roleTitle?: string;
        twitter?: string;
        website?: string;
        links: any[];
    };
}

export default function EditButton({ onUpdateSuccess, profile }: EditButtonProps) {
    const { address } = useAccount();

    // 1. DYNAMIC PRICE FETCHING
    const { data: editPriceWei, isLoading, isError } = useReadContract({
        address: CARD_SBT_ADDRESS as `0x${string}`,
        abi: parseAbi(["function editPriceETH() view returns (uint256)"]),
        functionName: "editPriceETH",
        chainId: TARGET_CHAIN.id,
    });

    // Fallback if read fails (safe default to avoid crash, but read should work)
    const currentPrice = editPriceWei !== undefined ? BigInt(editPriceWei.toString()) : parseUnits("0.0006", 18);

    // Visual: We prioritize the contract read, but format clearly. 
    // If the contract says 0.0006, that is what is required.
    const displayPrice = editPriceWei !== undefined ? formatEther(editPriceWei as bigint) : "0.0006";

    const isReady = !isLoading && !isError && editPriceWei !== undefined;

    const handleOnStatus = useCallback((status: any) => {

        if (status.statusName === 'success') {
            onUpdateSuccess(status.transactionReceipts[0].transactionHash);
        }
    }, [onUpdateSuccess]);

    const handleError = useCallback((err: any) => {
        console.error("Transaction Error:", err);
        if (err.message && err.message.includes("address")) {
            console.error("Contract address configuration missing. Please check .env settings.");
        }
    }, []);

    // Validate Address Configuration
    if (!CARD_SBT_ADDRESS || CARD_SBT_ADDRESS === "0xMyCardSBTAddress") {
        console.error("Missing NEXT_PUBLIC_CARD_SBT_ADDRESS env var");
        return (
            <div className="w-full p-3 bg-red-100 text-red-700 rounded-xl text-center text-sm font-bold">
                ⚠️ Contract Config Missing
            </div>
        );
    }

    // Contracts for Batch Transaction (OnchainKit handles encoding)
    const calls = [
        // 1. Update Card with ETH (Method 1)
        {
            address: CARD_SBT_ADDRESS as `0x${string}`,
            abi: parseAbi([
                "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
                "function updateCard(Profile memory _profile, uint8 _method) external payable"
            ]),
            functionName: "updateCard",
            args: [{
                displayName: profile.name || "User",
                avatarUrl: profile.profilePicUrl || "",
                bio: profile.bio || "",
                socials: JSON.stringify({
                    roleTitle: profile.roleTitle,
                    twitter: profile.twitter,
                    website: profile.website,
                    links: profile.links || []
                }),
                websites: ""
            }, 1], // 1 = PaymentMethod.ETH
            value: currentPrice // DYNAMIC VALUE
        }
    ];

    return (
        <div className="flex w-full flex-col gap-2">
            <Transaction
                key={currentPrice.toString()} // Force re-init when price loads/changes
                contracts={calls}
                className="w-full"
                chainId={TARGET_CHAIN.id}
                // @ts-ignore
                isSponsored={!!process.env.NEXT_PUBLIC_PAYMASTER_URL} // Enable sponsorship if URL is present
                onStatus={handleOnStatus}
                onError={handleError}
            >
                <TransactionButton
                    className={`mt-0 mr-0 mb-0 ml-0 w-full rounded-none border-b border-white/10 bg-transparent py-4 px-2 text-left font-bold transition-all hover:bg-white/5 hover:pl-5 ${!isReady ? 'opacity-50 cursor-not-allowed' : 'text-white'}`}
                    text={isLoading ? "LOADING PRICE..." : `UPDATE CARD (${displayPrice} ETH)`}
                    disabled={!isReady}
                />

                <TransactionStatus>
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                </TransactionStatus>

                <TransactionToast>
                    <TransactionToastIcon />
                    <TransactionToastLabel />
                    <TransactionToastAction />
                </TransactionToast>
            </Transaction>
        </div>
    );
}
