import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, parseAbi } from 'viem';
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
        links: any[];
    };
}

export default function EditButton({ onUpdateSuccess, profile }: EditButtonProps) {
    const { address } = useAccount();

    const handleOnStatus = useCallback((status: any) => {
        console.log('Transaction status:', status);
        if (status.statusName === 'success') {
            onUpdateSuccess(status.transactionReceipts[0].transactionHash);
        }
    }, [onUpdateSuccess]);

    const handleError = useCallback((err: any) => {
        console.error("Transaction Error:", err);
        if (err.message && err.message.includes("address")) {
            alert("Contract address configuration missing. Please check .env settings.");
        }
    }, []);

    // Validate Address Configuration
    if (!CARD_SBT_ADDRESS || CARD_SBT_ADDRESS === "0xMyCardSBTAddress") {
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
                socials: JSON.stringify(profile.links || []),
                websites: ""
            }, 1], // 1 = PaymentMethod.ETH
            value: parseUnits("0.0006", 18) // 0.0006 ETH (~$2)
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
                    text="UPDATE CARD ($2.00)"
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
