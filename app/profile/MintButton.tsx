import {
    Transaction,
    TransactionButton,
    TransactionStatus,
    TransactionStatusLabel,
    TransactionStatusAction
} from '@coinbase/onchainkit/transaction';
import { parseEther } from 'viem';
import { useState } from 'react';
import styles from './profile.module.css';

// 🚨 REPLACE THIS WITH YOUR OWN WALLET ADDRESS TO RECEIVE FUNDS 🚨
const TREASURY_ADDRESS = "0x7215d50A7008c1d2ccCbB7807aa03E599E8B9a51"; // Placeholder

export default function MintButton({ className, onMintSuccess }: { className?: string, onMintSuccess: (txHash: string) => void }) {

    const calls = [
        {
            to: TREASURY_ADDRESS as `0x${string}`,
            value: parseEther('0.0002'), // ~ $0.60
            data: '0x' as `0x${string}`,
        },
    ] as const;

    const handleSuccess = (response: any) => {
        console.log("Transaction Status:", response);
        if (response.status === 'SUCCESS') {
            const txHash = response.transactionReceipts?.[0]?.transactionHash || "";
            onMintSuccess(txHash);
        }
    };

    return (
        <div className={className}>
            <Transaction
                chainId={8453} // Base Mainnet
                calls={calls}
                onStatus={handleSuccess}
            >
                <TransactionButton
                    className={styles.mintButton} // We'll add this specific style class
                    text="MINT ONCHAIN (0.0002 ETH)"
                />
                <TransactionStatus>
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                </TransactionStatus>
            </Transaction>
            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '8px', textAlign: 'center' }}>
                Pay 0.0002 ETH to Publish to Global Feed
            </div>
        </div>
    );
}
