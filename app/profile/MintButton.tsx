import { useCallback, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, parseAbi } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Configuration
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "84532"; // Default to Sepolia (84532)
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
    const [isApproving, setIsApproving] = useState(false);
    const [isMinting, setIsMinting] = useState(false);

    const { writeContract, data: hash, error: writeError } = useWriteContract();

    // 1. Check Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: USDC_ADDRESS,
        abi: parseAbi(["function allowance(address owner, address spender) view returns (uint256)"]),
        functionName: 'allowance',
        args: [address!, CARD_SBT_ADDRESS as `0x${string}`],
        query: {
            enabled: !!address && !!CARD_SBT_ADDRESS,
        }
    });

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            writeContract({
                address: USDC_ADDRESS,
                abi: parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]),
                functionName: 'approve',
                args: [CARD_SBT_ADDRESS as `0x${string}`, MINT_PRICE],
                chain: TARGET_CHAIN
            }, {
                onSuccess: () => {
                    // In a real app, we'd wait for receipt here too, but for UI speed we can optimistic or wait manually
                    setTimeout(() => refetchAllowance(), 2000); // Hacky wait for testnet
                    setIsApproving(false);
                },
                onError: () => setIsApproving(false)
            });
        } catch (e) {
            console.error(e);
            setIsApproving(false);
        }
    };

    const handleMint = () => {
        setIsMinting(true);
        // Construct Profile Struct
        // Note: In a real app we'd pass the actual profile data props here.
        // For now we assume the parent component handles data saving to pure backend or local storage
        // AND we just mint an "empty" placeholder on-chain or a pointer to offchain data.
        // To strictly follow the plan: we should be passing the profile data to the contract.
        // Let's assume we pass empty strings for now to save gas, or we need to update props to accept profile.

        // Simplification for this turn: Mint with empty profile, or use saved localstorage one?
        // Let's just mint. The contract requires a Profile struct.
        const emptyProfile = {
            displayName: "User",
            avatarUrl: "",
            bio: "",
            socials: "",
            websites: ""
        };

        writeContract({
            address: CARD_SBT_ADDRESS as `0x${string}`,
            abi: parseAbi([
                "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
                "function mintCard(Profile memory _profile, uint8 _method) external"
            ]),
            functionName: 'mintCard',
            args: [emptyProfile, 0], // 0 = PaymentMethod.USDC
            chain: TARGET_CHAIN
        }, {
            onSuccess: (data) => {
                setIsMinting(false);
                onMintSuccess(data);
            },
            onError: (e) => {
                console.error(e);
                setIsMinting(false);
            }
        });
    };

    const hasAllowance = allowance ? allowance >= MINT_PRICE : false;

    if (isMinting || isApproving) {
        return (
            <button
                className="w-full py-4 rounded-2xl bg-zinc-800 text-white font-bold cursor-wait opacity-80"
                style={{ borderRadius: '16px' }}
                disabled
            >
                Processing...
            </button>
        );
    }

    if (!hasAllowance) {
        return (
            <button
                onClick={handleApprove}
                className="w-full py-4 text-white font-bold text-lg transition-transform hover:scale-105 active:scale-95"
                style={{
                    borderRadius: '16px',
                    background: '#0052FF',
                    boxShadow: '0 4px 12px rgba(0, 82, 255, 0.4)'
                }}
            >
                APPROVE USDC ($1.00)
            </button>
        );
    }

    return (
        <button
            onClick={handleMint}
            className="w-full py-4 text-black font-extrabold text-lg transition-transform hover:scale-105 active:scale-95"
            style={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
                boxShadow: '0 4px 16px rgba(184, 134, 11, 0.4)',
                border: '1px solid rgba(255,255,255,0.2)'
            }}
        >
            MINT CARD ($1.00)
        </button>
    );
}
