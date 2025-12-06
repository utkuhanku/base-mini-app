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
        <div className="flex justify-start items-start p-4 fixed top-0 left-0 z-50 w-full pointer-events-none">
            <div className="pointer-events-auto bg-black/90 backdrop-blur-md rounded-2xl p-1 shadow-2xl border border-white/10">
                <Wallet>
                    <ConnectWallet className="bg-transparent border-none text-white hover:bg-white/10 transition-colors flex items-center gap-2 px-3 py-2 rounded-xl">
                        <Avatar className="h-6 w-6" />
                        <Name className="text-white font-medium" />
                    </ConnectWallet>
                    <WalletDropdown className="absolute top-14 left-0 w-72 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-2xl p-2 z-[100]">
                        <Identity className="px-4 pt-3 pb-2 mb-2" hasCopyAddressOnClick>
                            <Avatar />
                            <Name className="text-white" />
                            <Address className="text-gray-400" />
                            <EthBalance className="text-gray-400" />
                        </Identity>
                        <div className="flex flex-col gap-1">
                            <WalletDropdownLink
                                icon="wallet"
                                href="https://keys.coinbase.com"
                                className="hover:bg-white/5 rounded-lg active:bg-white/10 transition-colors flex items-center gap-3 px-4 py-3 text-white"
                            >
                                Wallet
                            </WalletDropdownLink>
                            <WalletDropdownDisconnect className="hover:bg-red-500/10 text-red-500 rounded-lg active:bg-red-500/20 transition-colors flex items-center gap-3 px-4 py-3" />
                        </div>
                    </WalletDropdown>
                </Wallet>
            </div>
        </div>
    );
}
