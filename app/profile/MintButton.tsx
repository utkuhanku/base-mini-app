import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits, parseAbi } from 'viem';
import { base, baseSepolia } from 'viem/chains';

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
    const { address, chainId } = useAccount();
    const { switchChainAsync } = useSwitchChain();
    const [isApproving, setIsApproving] = useState(false);
    const [isMinting, setIsMinting] = useState(false);

    const { writeContractAsync } = useWriteContract();

    // 1. Check Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: USDC_ADDRESS,
        abi: parseAbi(["function allowance(address owner, address spender) view returns (uint256)"]),
        functionName: 'allowance',
        args: [address!, CARD_SBT_ADDRESS as `0x${string}`],
        query: {
            enabled: !!address && !!CARD_SBT_ADDRESS,
            refetchInterval: 2000,
        }
    });

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            // Force Switch Chain if needed
            if (chainId !== TARGET_CHAIN.id) {
                await switchChainAsync({ chainId: TARGET_CHAIN.id });
            }

            await writeContractAsync({
                address: USDC_ADDRESS,
                abi: parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]),
                functionName: 'approve',
                args: [CARD_SBT_ADDRESS as `0x${string}`, MINT_PRICE],
                chain: TARGET_CHAIN,
            });

            // Wait for receipt loop for better UX
            // In a real app we use useWaitForTransactionReceipt on the hash, but here we just wait/poll allowance
            let checks = 0;
            const interval = setInterval(() => {
                refetchAllowance();
                checks++;
                if (checks > 10) clearInterval(interval); // Stop after 20s
            }, 2000);

            // Optimistic finish
            setTimeout(() => {
                setIsApproving(false);
            }, 4000);

        } catch (e) {
            console.error("Approval failed:", e);
            alert("Approval failed: " + (e as any).message);
            setIsApproving(false);
        }
    };

    const handleMint = async () => {
        setIsMinting(true);
        try {
            const emptyProfile = {
                displayName: "User",
                avatarUrl: "",
                bio: "",
                socials: "",
                websites: ""
            };

            const hash = await writeContractAsync({
                address: CARD_SBT_ADDRESS as `0x${string}`,
                abi: parseAbi([
                    "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
                    "function mintCard(Profile memory _profile, uint8 _method) external"
                ]),
                functionName: 'mintCard',
                args: [emptyProfile, 0], // 0 = PaymentMethod.USDC
                chain: TARGET_CHAIN
            });

            onMintSuccess(hash);
            setIsMinting(false);

        } catch (e) {
            console.error("Mint failed:", e);
            setIsMinting(false);
        }
    };

    const hasAllowance = allowance && allowance >= MINT_PRICE;

    // --- STYLES ---
    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '1.2rem',
        borderRadius: '16px',
        fontWeight: 800,
        fontSize: '1rem',
        cursor: 'pointer',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        transition: 'all 0.2s ease',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem', // Spacing
    };

    const primaryStyle: React.CSSProperties = {
        ...buttonStyle,
        background: 'linear-gradient(135deg, #0052FF 0%, #003399 100%)', // Blue logic
        color: 'white',
        boxShadow: '0 4px 12px rgba(0, 82, 255, 0.3)',
    };

    const actionStyle: React.CSSProperties = {
        ...buttonStyle,
        background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)', // Gold logic
        color: 'black',
        boxShadow: '0 4px 12px rgba(184, 134, 11, 0.4)',
    };

    const loadingStyle: React.CSSProperties = {
        ...buttonStyle,
        background: '#333',
        color: '#888',
        cursor: 'wait',
    };

    if (isMinting || isApproving) {
        return (
            <button style={loadingStyle} disabled>
                {isApproving ? "APPROVING USDC..." : "MINTING ID..."}
            </button>
        );
    }

    if (!hasAllowance) {
        return (
            <button onClick={handleApprove} style={primaryStyle}>
                APPROVE USDC ($1.00)
            </button>
        );
    }

    return (
        <button onClick={handleMint} style={actionStyle}>
            MINT CARD ($1.00)
        </button>
    );
}
