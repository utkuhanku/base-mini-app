"use client";
import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import styles from "./publicProfile.module.css";
import { QRCodeSVG } from "qrcode.react";

import { useSearchParams } from "next/navigation";

export default function PublicProfileUI({ basename }: { basename: string }) {
    const searchParams = useSearchParams();
    const sharedName = searchParams.get("name");
    const sharedBio = searchParams.get("bio");
    const sharedRole = searchParams.get("role"); // Read Role

    let sharedLinks: { title: string; url: string }[] = [];
    try {
        const linksParam = searchParams.get("links");
        if (linksParam) {
            sharedLinks = JSON.parse(linksParam);
        }
    } catch (e) {
        console.error("Failed to parse links", e);
    }

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(event.clientX - centerX);
        y.set(event.clientY - centerY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Deterministic Variant Logic (Reused)
    const getCardVariant = (seed: string) => {
        if (!seed) return "variantClassic";
        const sum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variants = ["variantClassic", "variantAurora", "variantMidnight", "variantDot", "variantBlue"];
        return variants[sum % variants.length];
    };

    // Check Local Storage for self-viewing (Simulating persistence for the owner)
    const [localProfile, setLocalProfile] = useState<{ name: string, bio: string, role: string, profilePicUrl: string, links: any[] } | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("userProfile");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Standardize comparison: strict casing or insensitive?
                    // User might search "Utkus" but saved as "utkus".
                    if (parsed.name && parsed.name.toLowerCase() === basename.toLowerCase()) {
                        setLocalProfile(parsed);
                    }
                } catch (e) {
                    console.error("Error parsing local profile", e);
                }
            }
        }
    }, [basename]);

    // Priority: URL Params (Shared) > Local Storage (Self) > Defaults
    const displayProfile = {
        name: sharedName || localProfile?.name || (basename.length > 15 ? basename.slice(0, 6) + "..." + basename.slice(-4) : basename),
        bio: sharedBio || localProfile?.bio || "Onchain Identity",
        role: sharedRole || localProfile?.role || 'creator', // Default to creator
        pic: localProfile?.profilePicUrl || "", // URL params typically don't carry full base64 images, so we only use local or empty
        links: sharedLinks.length > 0 ? sharedLinks : (localProfile?.links || [])
    };

    // Logic: If BUSINESS, override variant to Gold. Else deterministic.
    const baseVariant = getCardVariant(basename);
    const finalVariant = displayProfile.role === 'business' ? "variantGold" : baseVariant;

    // Placeholder for score, as it's used in JSX but not defined in the provided snippet
    const score = 100; // You might want to replace this with actual score logic

    const handleDM = () => {
        // Deep link to Coinbase Wallet Messaging
        window.location.href = `https://go.cb-w.com/messaging?address=${basename}`;
    };

    return (
        <div className={styles.container}>
            {/* Header Title */}
            <motion.h1 className={styles.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                IDENTITY<span className={styles.dot}>.</span>
            </motion.h1>

            {/* Identity Card (Visual Clone of Profile) */}
            <motion.div
                className={styles.cardContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ rotateX, rotateY, z: 100 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div className={`${styles.businessCard} ${styles[finalVariant]}`}>
                    {/* Points Badge */}
                    <div className={styles.pointsBadge}>
                        <span style={{ color: displayProfile.role === 'business' ? '#FFD700' : '#0052FF' }}>💎</span>
                        {score}
                    </div>

                    <div className={styles.cardAccent}></div>
                    <div className={styles.cardHeader}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div className={styles.chip}></div>
                            <div className={styles.baseLogo}>
                                <Image src="/base-logo.svg" alt="Base" width={20} height={20} />
                                Base
                            </div>
                            {/* Role Badge */}
                            <div className={`${styles.roleBadge} ${displayProfile.role === 'business' ? styles.badgeHiring : styles.badgeTalent}`}>
                                {displayProfile.role}
                            </div>
                        </div>
                    </div>
                    <div className={styles.cardBody}>
                        {displayProfile.pic ? (
                            <Image src={displayProfile.pic} alt="Profile" width={60} height={60} className={styles.cardProfilePic} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                        ) : (
                            <div className={styles.cardProfilePlaceholder}>
                                {displayProfile.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className={styles.cardInfo}>
                            <h2 className={styles.cardName}>
                                {displayProfile.name}
                            </h2>
                            <p className={styles.cardBio}>
                                {displayProfile.bio}
                            </p>
                        </div>
                    </div>
                    <div className={styles.cardFooter}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginRight: '40px', alignItems: 'center' }}>
                            {/* DM BUTTON */}
                            <button
                                onClick={handleDM}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white'
                                }}
                                title="Send DM"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </button>

                            {displayProfile.links.length > 0 ? (
                                displayProfile.links.map((link: any, i: number) => (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                                        {link.title} ↗
                                    </a>
                                ))
                            ) : (
                                <a href={`https://basescan.org/address/${basename}`} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                                    Basescan ↗
                                </a>
                            )}
                        </div>
                        <div className={styles.cardQr}>
                            <QRCodeSVG
                                value={`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                size={36}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="L"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Actions: Open in App (Smart Button) */}
            <div className={styles.actions}>
                <button
                    className={styles.primaryButton}
                    onClick={() => {
                        const currentUrl = window.location.href;
                        // Use the deep link to force open the app experience
                        const deepLink = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`;
                        window.location.href = deepLink;
                    }}
                >
                    OPEN IN BASE APP
                </button>

                <button
                    className={styles.secondaryButton}
                    onClick={() => alert("Minting Coming Soon!")}
                >
                    MINT CONNECTION (Coming Soon)
                </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <a
                    href="https://wallet.coinbase.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0052FF', fontSize: '0.8rem', textDecoration: 'none' }}
                >
                    Don&apos;t have the app? Download Here
                </a>
            </div>

            {/* Social Social Proof */}
            <div className={styles.sectionDivider} />
            <div className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>CONNECTIONS</h3>
                <div className={styles.emptyState}>No connections minted yet.</div>
            </div>

            <div className={styles.sectionDivider} />
            <div className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>ATTENDED EVENTS</h3>
                <div className={styles.emptyState}>No events attended yet.</div>
            </div>
        </div>
    );
}
