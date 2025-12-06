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
        <div className="flex justify-end items-start p-4 fixed top-0 right-0 z-50 w-full pointer-events-none">
            <div className="pointer-events-auto bg-black/80 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-white/10">
                <Wallet>
                    <ConnectWallet className="bg-transparent border-none text-white hover:bg-white/10 transition-colors">
                        <Avatar className="h-6 w-6" />
                        <Name className="text-white" />
                    </ConnectWallet>
                    <WalletDropdown className="absolute top-12 right-0 w-64 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl p-2 z-[60]">
                        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                            <Avatar />
                            <Name />
                            <Address />
                            <EthBalance />
                        </Identity>
                        <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com" className="hover:bg-white/5 rounded-md transition-colors">
                            Wallet
                        </WalletDropdownLink>
                        <WalletDropdownDisconnect className="hover:bg-red-500/10 text-red-400 rounded-md transition-colors" />
                    </WalletDropdown>
                </Wallet>
            </div>
        </div>
    );
}
