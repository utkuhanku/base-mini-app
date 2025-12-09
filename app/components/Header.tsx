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
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    return (
        <div className={styles.headerWrapper}>
            <div className={styles.headerContainer}>
                <Wallet>
                    <ConnectWallet className={styles.connectButton}>
                        <Avatar className="h-6 w-6" />
                        <Name />
                    </ConnectWallet>
                    {/* ThemeToggle moved to Main Screen */}

                    {/* OnchainKit Dropdown Styling overrides needed via its specific props or global overrides if module fails to penetrate. 
                        For now, we keep it clean. OnchainKit usually handles its own dropdown visuals well enough for default dark mode. */}
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
    );
}
