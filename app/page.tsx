"use client";
import sdk from "@farcaster/miniapp-sdk";
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
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const { context } = useMiniKit(); // Keep for legacy/context access if needed
  const { address, isConnected: wagmiConnected } = useAccount();
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Quick Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fid, setFid] = useState<number | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Perform Quick Auth on Mount
  useEffect(() => {
    const authenticate = async () => {
      setIsLoadingAuth(true);
      setAuthError(null);
      try {
        // Ensure SDK is ready (optional but good practice)
        // await sdk.actions.ready(); 

        // Get nonce/token from Farcaster
        const result = await sdk.quickAuth.getToken();
        if (!result) {
          // Not in a frame or failed to get token
          setIsLoadingAuth(false);
          return;
        }

        // Verify with our backend
        // We use sdk.quickAuth.fetch to automatically include the token in headers if supported, 
        // OR we manually attach it. 
        // Docs say sdk.quickAuth.fetch wraps generic fetch but auto-adds auth? 
        // Actually, if we already have the token, we can just use standard fetch with header 
        // OR use the result.token. 
        // Wait, standard pattern: use the token we just got.

        // Let's use standard fetch with the token we got, to be safe and explicit.
        const response = await fetch("/api/auth", {
          headers: {
            'Authorization': `Bearer ${result.token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to verify authentication");
        }

        const data = await response.json();
        if (data.success && data.user?.fid) {
          setFid(data.user.fid);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Quick Auth failed:", err);
        setAuthError("Failed to authenticate with Farcaster.");
      } finally {
        setIsLoadingAuth(false);
      }
    };

    authenticate();
  }, []);

  useEffect(() => {
    setIsWalletConnected(wagmiConnected && !!address);
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

  if (isLoadingAuth) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.loader} />
        <p>Verifying Identity...</p>
      </div>
    );
  }

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

        {isAuthenticated ? (
          <motion.p className={styles.subtitle} variants={itemVariants}>
            Welcome, FID: {fid}
          </motion.p>
        ) : (
          <motion.p className={styles.subtitle} variants={itemVariants}>
            Guest User
          </motion.p>
        )}

        {/* If auth error, show it */}
        {authError && <p style={{ color: 'red', marginBottom: '1rem' }}>{authError}</p>}

        {!isWalletConnected ? (
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
            {/* All main menu items enabled when wallet is connected */}
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <motion.div
                className={styles.menuItem}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "var(--accent-glow)" }}
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

            <Link href="/explore" style={{ textDecoration: 'none' }}>
              <motion.div
                className={styles.menuItem}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "var(--accent-glow)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.menuIcon}>🔍</div>
                <div className={styles.menuText}>
                  <h3>Explore</h3>
                  <p>Find others on Base</p>
                </div>
                <div className={styles.arrow}>→</div>
              </motion.div>
            </Link>

            <Link href="/feed" style={{ textDecoration: 'none' }}>
              <motion.div
                className={styles.menuItem}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "var(--accent-glow)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.menuIcon}>🌍</div>
                <div className={styles.menuText}>
                  <h3>Global Feed</h3>
                  <p>Discover & Connect</p>
                </div>
                <div className={styles.arrow}>→</div>
              </motion.div>
            </Link>

            <Link href="/connect" style={{ textDecoration: 'none' }}>
              <motion.div
                className={styles.menuItem}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "var(--accent-glow)" }}
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
