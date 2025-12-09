import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, encodeFunctionData, parseAbi } from 'viem';
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

// USDC Addresses
const USDC_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_ADDRESS = IS_MAINNET ? USDC_MAINNET : USDC_SEPOLIA;




interface MintButtonProps {
    onMintSuccess: (hash: string) => void;
    profile: {
        name: string;
        bio: string;
        profilePicUrl: string;
        links: any[]; // simplified for now
    };
}

export default function MintButton({ onMintSuccess, profile }: MintButtonProps) {
    const { address } = useAccount();

    const handleOnStatus = useCallback((status: any) => {
        console.log('Transaction status:', status);
        if (status.statusName === 'success') {
            onMintSuccess(status.transactionReceipts[0].transactionHash);
        }
    }, [onMintSuccess]);

    const handleError = useCallback((err: any) => {
        console.error("Transaction Error:", err);
        // If specific error about address, alert user
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
                socials: JSON.stringify(profile.links || []),
                websites: ""
            }, 1], // 1 = PaymentMethod.ETH
            value: parseUnits("0.0003", 18) // 0.0003 ETH (~$1)
        }
    ];

    return (
        <div className="flex w-full flex-col gap-2">
            <Transaction
                contracts={calls}
                className="w-full"
                chainId={TARGET_CHAIN.id}
                onStatus={handleOnStatus}
                onError={handleError}
            >
                <TransactionButton
                    className="mt-0 mr-0 mb-0 ml-0 w-full rounded-xl bg-blue-600 py-3 px-4 font-bold text-white hover:bg-blue-700"
                    text="MINT IDENTITY ($1.00)"
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
