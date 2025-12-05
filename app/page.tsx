"use client";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import styles from "./page.module.css";

export default function Home() {
  const { context } = useMiniKit();
  const { address, isConnected: wagmiConnected } = useAccount();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (wagmiConnected && address) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [wagmiConnected, address]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  } as const;

  return (
    <div className={styles.container}>
      <div className={styles.marqueeContainer}>
        <motion.div
          className={styles.marquee}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
        >
          <span>
            <Image src="/base-logo.svg" alt="Base" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
            BASE IS FOR EVERYONE &nbsp;•&nbsp;
            <Image src="/base-logo.svg" alt="Base" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 12px' }} />
            BASE IS FOR EVERYONE &nbsp;•&nbsp;
            <Image src="/base-logo.svg" alt="Base" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 12px' }} />
            BASE IS FOR EVERYONE &nbsp;•&nbsp;
            <Image src="/base-logo.svg" alt="Base" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 12px' }} />
            BASE IS FOR EVERYONE &nbsp;•&nbsp;
          </span>
        </motion.div>
      </div>

      <motion.div
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} style={{ marginBottom: '1rem', opacity: 0.6 }}>
          <Image src="/base-logo.svg" alt="Base" width={48} height={48} />
        </motion.div>

        <motion.h1 className={styles.title} variants={itemVariants}>
          IDENTITY<span className={styles.dot}>.</span>
        </motion.h1>

        <motion.p className={styles.subtitle} variants={itemVariants}>
          Welcome, {context?.user?.displayName || "Guest"}.
        </motion.p>

        {!isConnected ? (
          <motion.div variants={itemVariants} className={styles.connectPrompt}>
            <p style={{ marginBottom: '1rem' }}>Please connect your wallet to continue.</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
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
          </motion.div>
        ) : (
          <div className={styles.menu}>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <motion.div
                className={styles.menuItem}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 82, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.menuIcon}>👤</div>
                <div className={styles.menuText}>
                  <h3>My Profile</h3>
                  <p>Manage your digital identity</p>
                </div>
                <div className={styles.arrow}>→</div>
              </motion.div>
            </Link>

            <Link href="/connect" style={{ textDecoration: 'none' }}>
              <motion.div
                className={styles.menuItem}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 82, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.menuIcon}>🤝</div>
                <div className={styles.menuText}>
                  <h3>Mint Connection</h3>
                  <p>Establish a new bond</p>
                </div>
                <div className={styles.arrow}>→</div>
              </motion.div>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
