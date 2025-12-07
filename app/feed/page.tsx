"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import styles from "../profile/profile.module.css"; // Reuse profile styles for consistency

// Mock Data
const MOCK_FEED = [
    {
        name: "Jesse Pollak",
        bio: "Building Base. Let's grow onchain.",
        role: "business", // Hiring/Founder
        address: "jesse.base.eth",
        links: [{ title: "Twitter", url: "https://twitter.com/jessepollak" }]
    },
    {
        name: "Brian Armstrong",
        bio: "Coinbase CEO. Crypto is the future.",
        role: "business",
        address: "brian.eth",
        links: [{ title: "Blog", url: "https://brian.armstrong.xyz" }]
    },
    {
        name: "Vitalik",
        bio: "Ethereum.",
        role: "creator", // Dev
        address: "vitalik.eth",
        links: [{ title: "Blog", url: "https://vitalik.eth.limo" }]
    },
    {
        name: "Base God",
        bio: "Thank you Base God.",
        role: "creator",
        address: "basegod.eth",
        links: []
    },
];

export default function FeedPage() {
    const [feed, setFeed] = useState<any[]>(MOCK_FEED);

    useEffect(() => {
        // Inject Local User if Published
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("userProfile");
            if (saved) {
                try {
                    const local = JSON.parse(saved);
                    if (local.isPublished) {
                        // Add local user to top of feed
                        setFeed([local, ...MOCK_FEED]);
                    }
                } catch (e) { console.error(e) }
            }
        }
    }, []);

    return (
        <div className={styles.container} style={{ overflowY: 'auto', paddingBottom: '80px', height: '100vh' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                maxWidth: '400px',
                marginBottom: '2rem',
                paddingTop: '1rem'
            }}>
                <motion.h1 className={styles.title} style={{ margin: 0, fontSize: '1.8rem' }}>
                    GLOBAL FEED<span className={styles.dot}>.</span>
                </motion.h1>
                <Link href="/" style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textDecoration: 'none'
                }}>
                    ✕
                </Link>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '400px' }}>
                {feed.map((user, index) => (
                    <FeedCard key={index} user={user} index={index} />
                ))}

                <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem 0' }}>
                    All caught up!
                </div>
            </div>
        </div>
    );
}

// Compact Feed Card
function FeedCard({ user, index }: { user: any, index: number }) {
    // Deterministic Variant Logic
    const getCardVariant = (seed: string) => {
        if (!seed) return "variantClassic";
        const sum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variants = ["variantClassic", "variantAurora", "variantMidnight", "variantDot", "variantBlue"];
        return variants[sum % variants.length];
    };

    const seed = user.address || user.name;
    const baseVariant = getCardVariant(seed);
    const finalVariant = user.role === 'business' ? 'variantGold' : baseVariant;
    const score = (seed.length * 42) % 1000 + 100;

    const handleDM = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `https://go.cb-w.com/messaging?address=${user.address || user.name}`;
    };

    // Convert Role to Badge Class (mapping legacy string if needed, mostly handled by styles)
    const roleClass = user.role === 'business' ? styles.badgeHiring : styles.badgeTalent;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Link href={`/${user.address || user.name}?name=${encodeURIComponent(user.name)}&bio=${encodeURIComponent(user.bio)}&role=${user.role}`} style={{ textDecoration: 'none' }}>
                <div className={`${styles.businessCard} ${styles[finalVariant]}`} style={{ height: 'auto', minHeight: '200px', cursor: 'pointer' }}>
                    {/* Points Badge */}
                    <div className={styles.pointsBadge} style={{ top: '12px', right: '12px' }}>
                        <span style={{ color: user.role === 'business' ? '#FFD700' : '#0052FF' }}>💎</span>
                        {score}
                    </div>

                    <div className={styles.cardAccent}></div>

                    <div className={styles.cardHeader} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div className={styles.chip}></div>
                            <div className={styles.baseLogo}>
                                <Image src="/base-logo.svg" alt="Base" width={16} height={16} />
                                Base
                            </div>
                            {/* Role Badge */}
                            <div className={`${styles.roleBadge} ${roleClass}`}>
                                {user.role ? user.role.toUpperCase() : 'CREATOR'}
                            </div>
                        </div>
                    </div>

                    <div className={styles.cardBody} style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                        {user.profilePicUrl ? (
                            <Image src={user.profilePicUrl} alt="Pic" width={50} height={50} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div className={styles.cardProfilePlaceholder} style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 className={styles.cardName} style={{ fontSize: '1.2rem' }}>{user.name}</h2>
                            <p className={styles.cardBio} style={{ fontSize: '0.8rem', opacity: 0.8 }}>{user.bio}</p>
                        </div>
                    </div>

                    <div className={styles.cardFooter} style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {/* Links (Limit to 1 in feed) */}
                                {user.links && user.links.length > 0 && (
                                    <div className={styles.cardLink}>
                                        {user.links[0].title} ↗
                                    </div>
                                )}
                            </div>

                            {/* ACTIONS */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {/* DM BUTTON */}
                                <button
                                    onClick={handleDM}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
