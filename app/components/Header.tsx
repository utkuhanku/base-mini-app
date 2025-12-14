"use client";
import {
    ConnectWallet,
    Wallet,
    WalletDropdown,
    WalletDropdownDisconnect,
    WalletDropdownLink
} from "@coinbase/onchainkit/wallet";
import {
    Address,
    Avatar,
    Name,
    Identity,
    EthBalance
} from "@coinbase/onchainkit/identity";
import styles from "./Header.module.css";
import { useTheme } from "./ThemeProvider";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    return (
        <div className={styles.headerWrapper}>
            <div className={styles.headerContainer}>
                {/* Back Button (Only if not home) */}
                {pathname !== '/' && (
                    <button
                        onClick={handleBack}
                        className={styles.backButton}
                        aria-label="Go Back"
                    >
                        ← BACK
                    </button>
                    /* Note: If design requires just "←", we can adjust. 
                       "BACK" is clearer. */
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                    <Wallet>
                        <ConnectWallet className={styles.connectButton}>
                            <Avatar className="h-6 w-6" />
                            <Name />
                        </ConnectWallet>
                        {/* Theme Toggle Button (Base Logo) */}
                        <button
                            onClick={toggleTheme}
                            className={styles.themeToggle}
                            aria-label="Toggle Theme"
                            title={theme === 'dark' ? "Switch to Blue Mode" : "Switch to Dark Mode"}
                        >
                            <div className={styles.logoCircle}>
                                <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="50" cy="50" r="50" fill={theme === 'dark' ? "white" : "#0052FF"} />
                                    <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75C63.8071 75 75 63.8071 75 50C75 36.1929 63.8071 25 50 25ZM50 70C38.9543 70 30 61.0457 30 50C30 38.9543 38.9543 30 50 30C61.0457 30 70 38.9543 70 50C70 61.0457 61.0457 70 50 70Z" fill={theme === 'dark' ? "#0052FF" : "white"} />
                                </svg>
                            </div>
                        </button>

                        <WalletDropdown>
                            <Identity hasCopyAddressOnClick>
                                <Avatar />
                                <Name />
                                <Address />
                                <EthBalance />
                            </Identity>
                            <WalletDropdownLink
                                icon="wallet"
                                href="https://keys.coinbase.com"
                            >
                                Wallet
                            </WalletDropdownLink>
                            <WalletDropdownDisconnect />
                        </WalletDropdown>
                    </Wallet>
                </div>
            </div>
        </div>
    );
}
