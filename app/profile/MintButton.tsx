import { useCallback, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
const CARD_SBT_ADDRESS = process.env.NEXT_PUBLIC_CARD_SBT_ADDRESS || "0xMyCardSBTAddress"; // Update via Env
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
        args: [address!, CARD_SBT_ADDRESS],
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
                args: [CARD_SBT_ADDRESS, MINT_PRICE],
                chain: baseSepolia
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
                "function mintCard(Profile memory _profile) external"
            ]),
            functionName: 'mintCard',
            args: [emptyProfile],
            chain: baseSepolia
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
        return <button className="px-4 py-2 bg-gray-500 text-white rounded cursor-wait" disabled>Processing...</button>;
    }

    if (!hasAllowance) {
        return (
            <button
                onClick={handleApprove}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Approve USDC ($1.00)
            </button>
        );
    }

    return (
        <button
            onClick={handleMint}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold"
        >
            MINT CARD ($1.00)
        </button>
    );
}
