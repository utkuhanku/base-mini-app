import { useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi'; // Added useReadContract
import { parseUnits, encodeFunctionData, parseAbi, formatEther } from 'viem';
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

interface MintButtonProps {
    onMintSuccess: (hash: string) => void;
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

export default function MintButton({ onMintSuccess, profile }: MintButtonProps) {
    const { address } = useAccount();

    // 1. DYNAMIC PRICE FETCHING
    const { data: mintPriceWei, isLoading, isError } = useReadContract({
        address: CARD_SBT_ADDRESS as `0x${string}`,
        abi: parseAbi(["function mintPriceETH() view returns (uint256)"]),
        functionName: "mintPriceETH",
        chainId: TARGET_CHAIN.id,
    });

    // Fallback if read fails (safe default to avoid crash, but read should work)
    // Default 0.0003 ETH (~$1.00) if fetch pending/failed - MATCHING ONCHAIN PRICE
    const currentPrice = mintPriceWei !== undefined ? BigInt(mintPriceWei.toString()) : parseUnits("0.0003", 18);

    // Format for display (e.g. "0.0003")
    const displayPrice = mintPriceWei !== undefined ? formatEther(mintPriceWei as bigint) : "0.0003";

    // Allow 0 price
    const isReady = !isLoading && !isError && mintPriceWei !== undefined;

    const handleOnStatus = useCallback((status: any) => {

        if (status.statusName === 'success') {
            onMintSuccess(status.transactionReceipts[0].transactionHash);
        }
    }, [onMintSuccess]);

    const handleError = useCallback((err: any) => {
        console.error("Transaction Error:", err);
        if (err.message && err.message.includes("address")) {
            alert("Contract address configuration missing. Please check .env settings.");
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
        // 1. Mint Card with ETH
        {
            address: CARD_SBT_ADDRESS as `0x${string}`,
            abi: parseAbi([
                "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
                "function mintCard(Profile memory _profile, uint8 _method) external payable"
            ]),
            functionName: "mintCard",
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
                onStatus={handleOnStatus}
                onError={handleError}
            >
                <TransactionButton
                    className={`mt-0 mr-0 mb-0 ml-0 w-full rounded-none border-b border-white/10 bg-transparent py-4 px-2 text-left font-bold transition-all hover:bg-white/5 hover:pl-5 ${!isReady ? 'opacity-50 cursor-not-allowed' : 'text-white'}`}
                    text={isLoading ? "LOADING PRICE..." : `MINT IDENTITY (${displayPrice} ETH)`}
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
