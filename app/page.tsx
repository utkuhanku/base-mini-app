"use client";
import sdk from "@farcaster/miniapp-sdk";

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
import ThemeToggle from "./components/ThemeToggle";
import WelcomePopup from "./components/WelcomePopup";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  const { address, isConnected: wagmiConnected } = useAccount();
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Quick Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fid, setFid] = useState<number | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

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
      <div className={styles.container} style={{ justifyContent: 'center' }}>
        <div className={styles.loader} />
        <p style={{ color: 'var(--text-secondary)' }}>Verifying Identity...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <WelcomePopup />
      <motion.div
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Modern Absolute Theme Toggle */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          padding: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <ThemeToggle />
        </div>

        <div className={styles.heroHeader}>
          <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#0052FF', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/base-logo.svg" alt="Base" width={20} height={20} style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '1px', color: 'var(--base-blue)', textTransform: 'uppercase' }}>On Base</span>
          </motion.div>

          <motion.h1 className={styles.title} variants={itemVariants}>
            IDENTITY<span className={styles.dot}>.</span>
          </motion.h1>

          {isAuthenticated ? (
            <motion.p className={styles.subtitle} variants={itemVariants}>
              <span className={styles.highlight}>Authorized</span> • FID {fid}
            </motion.p>
          ) : (
            <motion.p className={styles.subtitle} variants={itemVariants}>
              Please authenticate to access your profile.
            </motion.p>
          )}
        </div>

        {/* If auth error, show it */}
        {authError && <p style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{authError}</p>}

        {!isWalletConnected ? (
          <motion.div variants={itemVariants} className={styles.connectPrompt}>
            <p>Connect your wallet to mint and explore.</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Wallet>
                <ConnectWallet className={styles.connectButtonOverride}>
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
            <div style={{ position: 'relative' }}>
              <Link href="/profile" style={{ textDecoration: 'none', flex: 1 }}>
                <motion.div className={styles.menuItem} variants={itemVariants} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <div className={styles.menuText}>
                    <h3>MY IDENTITY</h3>
                    <p>View & Share Card</p>
                  </div>
                  <div className={styles.arrow}>→</div>
                </motion.div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveHelp('identity'); }}
                style={{
                  position: 'absolute', right: '48px', top: '50%', transform: 'translateY(-50%)',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgba(0, 82, 255, 0.1)', border: '1px solid rgba(0, 82, 255, 0.4)',
                  color: '#0052FF', fontSize: '11px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20
                }}
              >
                ?
              </button>
            </div>

            {/* Global Feed */}
            <div style={{ position: 'relative' }}>
              <Link href="/feed" style={{ textDecoration: 'none', flex: 1 }}>
                <motion.div className={styles.menuItem} variants={itemVariants} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <div className={styles.menuText}>
                    <h3>COMMUNITY FEED</h3>
                    <p>Explore Global Profiles</p>
                  </div>
                  <div className={styles.arrow}>→</div>
                </motion.div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveHelp('feed'); }}
                style={{
                  position: 'absolute', right: '48px', top: '50%', transform: 'translateY(-50%)',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgba(0, 82, 255, 0.1)', border: '1px solid rgba(0, 82, 255, 0.4)',
                  color: '#0052FF', fontSize: '11px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20
                }}
              >
                ?
              </button>
            </div>

            {/* Connection Minting */}
            <div style={{ position: 'relative' }}>
              <Link href="/connect" style={{ textDecoration: 'none', flex: 1 }}>
                <motion.div className={styles.menuItem} variants={itemVariants} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <div className={styles.menuText}>
                    <h3>MINT CONNECTION</h3>
                    <p>Bond with others</p>
                  </div>
                  <div className={styles.arrow}>→</div>
                </motion.div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveHelp('connect'); }}
                style={{
                  position: 'absolute', right: '48px', top: '50%', transform: 'translateY(-50%)',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgba(0, 82, 255, 0.1)', border: '1px solid rgba(0, 82, 255, 0.4)',
                  color: '#0052FF', fontSize: '11px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20
                }}
              >
                ?
              </button>
            </div>
          </div>
        )
        }
      </motion.div >

      {/* HELP MODAL OVERLAY */}
      {/* We use inline styles here for simplicity to avoid creating new CSS module classes right now, reusing the aesthetic */}
      {
        activeHelp && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
          }} onClick={() => setActiveHelp(null)}>
            <div style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px',
              maxWidth: '360px', width: '100%', baseShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }} onClick={e => e.stopPropagation()}>

              {activeHelp === 'identity' && (
                <>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', marginBottom: '12px', letterSpacing: '-0.5px' }}>BASE IDENTITY</div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>
                    Your onchain passport. Manage your appearance, track your social score, and view your verified credentials.
                    <br /><br />
                    <span style={{ color: '#0052FF' }}>This is step 1: Establishing who you are.</span>
                  </div>
                </>
              )}

              {activeHelp === 'feed' && (
                <>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', marginBottom: '12px', letterSpacing: '-0.5px' }}>COMMUNITY FEED</div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>
                    See who is building on Base. Discover other identities and verify their reputation signals.
                    <br /><br />
                    <span style={{ color: '#0052FF' }}>This is step 2: Finding your network.</span>
                  </div>
                </>
              )}

              {activeHelp === 'connect' && (
                <>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', marginBottom: '12px', letterSpacing: '-0.5px' }}>MINT CONNECTION</div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>
                    The core of the social graph. Meet someone IRL, take a photo, and mint a permanent bond onchain.
                    <br /><br />
                    <span style={{ color: '#0052FF' }}>This is step 3: Solidifying trust.</span>
                  </div>
                </>
              )}

              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', opacity: 0.5, cursor: 'pointer' }} onClick={() => setActiveHelp(null)}>
                TAP ANYWHERE TO CLOSE
              </div>
            </div>
          </div>
        )
      }

      {/* Marquee at bottom for 'Financial Ticker' feel */}
      <div className={styles.marqueeContainer}>
        <motion.div
          className={styles.marquee}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
        >
          <span>
            BASE IS FOR EVERYONE &nbsp;//&nbsp;
            BUILD ONCHAIN &nbsp;//&nbsp;
            STAY BASED &nbsp;//&nbsp;
            BASE IS FOR EVERYONE &nbsp;//&nbsp;
            BUILD ONCHAIN &nbsp;//&nbsp;
            STAY BASED &nbsp;//&nbsp;
            BASE IS FOR EVERYONE &nbsp;//&nbsp;
            BUILD ONCHAIN &nbsp;//&nbsp;
            STAY BASED &nbsp;//&nbsp;
          </span>
        </motion.div>
      </div>
    </div >
  );
}
