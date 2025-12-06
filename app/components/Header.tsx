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

export default function Header() {
    return (
        <div className="flex justify-between items-center p-4 absolute top-0 right-0 z-50 w-full pointer-events-none">
            <div className="flex-grow" />
            <div className="pointer-events-auto">
                <Wallet>
                    <ConnectWallet>
                        <Avatar className="h-6 w-6" />
                        <Name />
                    </ConnectWallet>
                    <WalletDropdown>
                        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                            <Avatar />
                            <Name />
                            <Address />
                            <EthBalance />
                        </Identity>
                        <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com">
                            Wallet
                        </WalletDropdownLink>
                        <WalletDropdownDisconnect />
                    </WalletDropdown>
                </Wallet>
            </div>
        </div>
    );
}
