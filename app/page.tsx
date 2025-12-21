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

import { useReadContract } from "wagmi";
import { parseAbi } from "viem";


// Constants
const CARD_SBT_ADDRESS = process.env.NEXT_PUBLIC_CARD_SBT_ADDRESS || "0x4003055676749a0433EA698A8B70E45d398FC87f";

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
        // Ensure SDK is ready
        try {
          await sdk.actions.ready();
        } catch (e) {
          console.warn("Farcaster SDK ready signal failed", e);
        }

        // Get nonce/token from Farcaster
        const result = await sdk.quickAuth.getToken();
        if (!result) {
          // Not in a frame or failed to get token
          setIsLoadingAuth(false);
          return;
        }

        // Verify with our backend
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


  // 2. CHECK FOR CARD & FETCH DATA
  const { data: cardTokenId, isLoading: isCardLoading } = useReadContract({
    address: CARD_SBT_ADDRESS as `0x${string}`,
    abi: parseAbi(["function cardOf(address owner) view returns (uint256)"]),
    functionName: "cardOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const { data: cardData } = useReadContract({
    address: CARD_SBT_ADDRESS as `0x${string}`,
    abi: parseAbi([
      "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
      "function getCard(uint256 tokenId) view returns (Profile memory)"
    ]),
    functionName: "getCard",
    args: cardTokenId ? [cardTokenId] : undefined,
    query: {
      enabled: !!cardTokenId && Number(cardTokenId) > 0,
    }
  });

  // Extract Profile DataSafely
  const profileName = cardData?.displayName || "Future Legend";
  const profileRole = cardData?.bio || "Wayfarer"; // Using bio as role/title for preview
  const profilePic = cardData?.avatarUrl || null;




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
      {/* Strict Modal Removed for Cleaner Landing Experience */}

      <WelcomePopup />
      <motion.div
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Toggle Restored */}
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
            ONCHAIN <br /> IDENTITY<span className={styles.dot}>.</span>
          </motion.h1>

          {isAuthenticated ? (
            <motion.p className={styles.subtitle} variants={itemVariants}>
              <span className={styles.highlight}>Authorized</span> • FID {fid}
            </motion.p>
          ) : (
            <motion.p className={styles.subtitle} variants={itemVariants}>
              Enter your onchain identity to continue.
            </motion.p>
          )}
        </div>

        {/* If auth error, show it */}
        {authError && <p style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{authError}</p>}

        {!isWalletConnected ? (
          <motion.div variants={itemVariants} className={styles.connectPrompt}>
            <p className={styles.subtitle} style={{ marginBottom: '24px', opacity: 0.7 }}>
              Connect to access the Base Identity Protocol.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Wallet>
                <ConnectWallet className={styles.basePostButton}>
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
          <div className={styles.menu} style={{ gap: '16px' }}>
            {/* 1. IDENTITY CARD (Smart Preview) */}
            <Link href="/profile" style={{ textDecoration: 'none', gridColumn: 'span 2' }}>
              <motion.div
                className={styles.dashboardCardPrimary}
                variants={itemVariants}
                whileHover={{ scale: 1.02, borderColor: '#0052FF' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: !cardTokenId || Number(cardTokenId) === 0
                    ? 'linear-gradient(135deg, rgba(0,82,255,0.1) 0%, rgba(0,0,0,0) 100%)' // Keep specific create gradient or map to variable?
                    // Actually, Create Card should probably utilize the theme too, but gold badge handles status.
                    // Let's use the variable but maybe override for "Create" state if unique.
                    // For consistency, let's use the variable but add the noise texture conditionally via CSS class if possible, or just use variable.
                    : 'var(--card-gradient-primary)',
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                {/* Status Badge */}
                <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    color: !cardTokenId || Number(cardTokenId) === 0 ? '#FFD700' : '#00FF94',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: !cardTokenId || Number(cardTokenId) === 0 ? '#FFD700' : '#00FF94', boxShadow: !cardTokenId || Number(cardTokenId) === 0 ? '0 0 10px #FFD700' : '0 0 10px #00FF94' }} />
                    {!cardTokenId || Number(cardTokenId) === 0 ? 'UNCLAIMED' : 'VERIFIED'}
                  </div>
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '16px' }}>

                  {!cardTokenId || Number(cardTokenId) === 0 ? (
                    /* STATE: UNCLAIMED or DISCONNECTED (Bold Call to Action) */
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                        {isAuthenticated && !isWalletConnected ? "Wallet Disconnected" : "Start Your Journey"}
                      </div>

                      {isAuthenticated && !isWalletConnected ? (
                        <div style={{
                          padding: '12px 16px',
                          background: 'rgba(255, 215, 0, 0.1)',
                          border: '1px solid #FFD700',
                          borderRadius: '12px',
                          color: '#FFD700',
                          fontSize: '14px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <span>⚠️</span> SYNC WALLET TO VIEW CARD
                        </div>
                      ) : (
                        <h2 style={{ fontSize: '32px', fontWeight: 900, lineHeight: '0.9', margin: 0, color: 'white', letterSpacing: '-1px' }}>
                          CREATE IDENTITY <span style={{ color: '#0052FF' }}>→</span>
                        </h2>
                      )}
                    </div>
                  ) : (
                    /* STATE: VERIFIED (Mini Card Visual) */
                    <>
                      {/* Avatar Preview */}
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.2)', overflow: 'hidden', flexShrink: 0, background: '#333'
                      }}>
                        {profilePic ? (
                          <img src={profilePic} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👤</div>
                        )}
                      </div>

                      <div style={{ paddingBottom: '4px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'white', lineHeight: '1.1' }}>
                          {profileName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>
                          {profileRole}
                        </div>
                        <div style={{ fontSize: '10px', color: '#0052FF', marginTop: '4px', fontWeight: 700, letterSpacing: '0.5px' }}>
                          VIEW FULL ID →
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </Link>

            {/* 2. GLOBAL FEED (Secondary) */}
            <Link href="/feed" style={{ textDecoration: 'none', gridColumn: 'span 2' }}>
              <motion.div
                className={styles.dashboardCardSecondary}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', color: '#666', marginBottom: '4px' }}>
                      EXPLORE
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'white' }}>Global Feed</h3>
                  </div>
                  <div style={{ opacity: 0.5 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  </div>
                </div>
              </motion.div>
            </Link>

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
              maxWidth: '360px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
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
