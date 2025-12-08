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
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "84532";
const IS_MAINNET = CHAIN_ID === "8453";
const TARGET_CHAIN = IS_MAINNET ? base : baseSepolia;

// USDC Addresses
const USDC_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_ADDRESS = IS_MAINNET ? USDC_MAINNET : USDC_SEPOLIA;

const CARD_SBT_ADDRESS = process.env.NEXT_PUBLIC_CARD_SBT_ADDRESS || "0xMyCardSBTAddress";
const MINT_PRICE = parseUnits("1", 6); // $1 USDC

export default function MintButton({ onMintSuccess }: { onMintSuccess: (hash: string) => void }) {
    const { address } = useAccount();

    const handleOnStatus = useCallback((status: any) => {
        console.log('Transaction status:', status);
        if (status.statusName === 'success') {
            onMintSuccess(status.transactionReceipts[0].transactionHash);
        }
    }, [onMintSuccess]);

    // Contracts for Batch Transaction (OnchainKit handles encoding)
    const calls = [
        // 1. Approve USDC
        {
            address: USDC_ADDRESS as `0x${string}`,
            abi: parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]),
            functionName: "approve",
            args: [CARD_SBT_ADDRESS as `0x${string}`, MINT_PRICE]
        },
        // 2. Mint Card
        {
            address: CARD_SBT_ADDRESS as `0x${string}`,
            abi: parseAbi([
                "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
                "function mintCard(Profile memory _profile, uint8 _method) external"
            ]),
            functionName: "mintCard",
            args: [{
                displayName: "User",
                avatarUrl: "",
                bio: "",
                socials: "",
                websites: ""
            }, 0] // 0 = PaymentMethod.USDC
        }
    ];

    return (
        <div className="flex w-full flex-col gap-2">
            <Transaction
                contracts={calls}
                className="w-full"
                chainId={TARGET_CHAIN.id}
                onStatus={handleOnStatus}
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
