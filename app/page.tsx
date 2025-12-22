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
  const profileName = cardData?.displayName || "My Identity";
  const profileRole = cardData?.bio || "Wayfarer"; // Using bio as role/title for preview
  const profilePic = cardData?.avatarUrl || null;

  const hasCard = !!cardTokenId && Number(cardTokenId) > 0;




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
          <div className={styles.dashboardGrid}>

            {/* 1. IDENTITY CARD (Void Style) */}
            <Link href={hasCard ? `/profile/${address}` : "/connect"} style={{ textDecoration: 'none', width: '100%' }}>
              <motion.div
                className={styles.voidCard}
                data-active={hasCard ? "true" : "false"}
                variants={itemVariants}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.voidLabel}>IDENTITY LAYER</span>
                  {!hasCard && !isWalletConnected ? (
                    <h3 className={styles.voidTitle} style={{ color: '#666' }}>Connect Wallet</h3>
                  ) : !hasCard && isWalletConnected ? (
                    <h3 className={styles.voidTitle}>Create Identity <span style={{ color: '#0052FF' }}>→</span></h3>
                  ) : (
                    <div>
                      <h3 className={styles.voidTitle}>{profileName}</h3>
                      <span style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>{profileRole}</span>
                    </div>
                  )}
                </div>

                <div className={styles.voidIcon}>
                  {hasCard ? (
                    // Avatar or Icon
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', overflow: 'hidden' }}>
                      {profilePic ? <img src={profilePic} alt="" style={{ width: '100%', height: '100%' }} /> : null}
                    </div>
                  ) : (
                    <span style={{ fontSize: '24px' }}>👤</span>
                  )}
                </div>
              </motion.div>
            </Link>

            {/* 2. GLOBAL FEED (Void Style) */}
            <Link href="/feed" style={{ textDecoration: 'none', width: '100%' }}>
              <motion.div
                className={styles.voidCard}
                variants={itemVariants}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.voidLabel}>NETWORK STATE</span>
                  <h3 className={styles.voidTitle}>Global Feed</h3>
                </div>
                <div className={styles.voidIcon}>
                  🌐
                </div>
              </motion.div>
            </Link>


            {/* 3. BASE POSTING (Void Style) */}
            <motion.div
              style={{
                textDecoration: 'none',
                width: '100%',
                cursor: 'pointer'
              }}
              variants={itemVariants}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                const hypePhrases = [
                  "Onchain is the new online. @baseposting 🔵",
                  "Nothing stops the builders. Base is inevitable. @baseposting",
                  "Based and blue-pilled. The future is here. @baseposting 🛡️",
                  "Just deployed on Base. Fees low, vibes high. @baseposting",
                  "Crypto is better on Base. Join the movement. @baseposting 🚀",
                  "Stay Base, Stay Safe, Stay Onchain. @baseposting",
                  "Everything is onchain. Everything is Base. @baseposting 🔵"
                ];
                const randomPhrase = hypePhrases[Math.floor(Math.random() * hypePhrases.length)];
                const signature = " @utkus_eth Stay Based 🟦";
                const finalOverlay = randomPhrase + signature;

                // DEEP LINK STRATEGY
                const appIntent = `twitter://post?message=${encodeURIComponent(finalOverlay)}`;
                const webIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalOverlay)}`;

                window.location.href = appIntent;

                setTimeout(() => {
                  if (sdk && sdk.actions && sdk.actions.openUrl) {
                    sdk.actions.openUrl(webIntent);
                  } else {
                    window.open(webIntent, '_blank');
                  }
                }, 500);
              }}
            >
              <div className={styles.voidCard} data-variant="bop">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.voidLabel} style={{ color: '#0052FF' }}>STAY BASED</span>
                  <h3 className={styles.voidTitle}>Base Posting</h3>
                </div>
                <div className={styles.voidIcon} style={{ opacity: 1, filter: 'drop-shadow(0 0 8px rgba(0,82,255,0.4))' }}>
                  🔵
                </div>
              </div>
            </motion.div>

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
