"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../profile/profile.module.css";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

interface CardProfile {
    tokenId: number;
    owner: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
    socials: string;
}

export default function FeedPage() {
    const [cards, setCards] = useState<CardProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/cards")
            .then((res) => res.json())
            .then((data) => {
                setCards(data);
                setLoading(false);
            })
            .catch((e) => {
                console.error(e);
                setLoading(false);
            });
    }, []);

    return (
        <div className={styles.container} style={{ minHeight: '100vh', justifyContent: 'flex-start', paddingTop: '40px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                <Link href="/" style={{
                    position: 'absolute',
                    left: 0,
                    color: 'rgba(255,255,255,0.4)',
                    textDecoration: 'none',
                    fontSize: '24px',
                    transition: 'color 0.2s',
                    zIndex: 10
                }}>
                    ←
                </Link>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ width: '100%', textAlign: 'center' }}
                >
                    <h1 style={{ fontWeight: 800, letterSpacing: '4px', fontSize: '14px', color: 'white', margin: 0 }}>
                        GLOBAL FEED<span style={{ color: '#0052FF' }}>.</span>
                    </h1>
                </motion.div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '100px' }}>
                    <div className={styles.loader} />
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '1px' }}>SYNCING NETWORK...</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '420px' }}>
                    {cards.map((card, index) => {
                        // Parse Socials
                        let twitter = "";
                        let website = "";
                        let roleTitle = "";
                        let customLinks: any[] = [];
                        try {
                            const socialData = JSON.parse(card.socials || "{}");
                            twitter = socialData.twitter || "";
                            website = socialData.website || "";
                            roleTitle = socialData.roleTitle || "";
                            customLinks = Array.isArray(socialData.links) ? socialData.links : [];
                        } catch (e) {
                            // ignore
                        }

                        return (
                            <motion.div
                                key={card.tokenId}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {/* PREMIUM IDENTITY CARD */}
                                <div className={styles.identityCard} style={{ position: 'relative', overflow: 'hidden' }}>
                                    <Link href={`/profile/${card.owner}`} style={{ textDecoration: 'none', position: 'absolute', inset: 0, zIndex: 0 }} />

                                    <div className={styles.cardHeader} style={{ position: 'relative', zIndex: 1 }}>
                                        <div className={styles.cardChip} />
                                        <div className={styles.verifiedBadge}>
                                            <div className={styles.verifiedDot} />
                                            Verified
                                        </div>
                                        <div className={styles.pointsPill}><span>💎</span> #{card.tokenId}</div>
                                    </div>

                                    <div className={styles.cardBody} style={{ position: 'relative', zIndex: 1 }}>
                                        <div className={styles.cardAvatarContainer}>
                                            {card.avatarUrl ? (
                                                <img src={card.avatarUrl} alt={card.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#333' }} />
                                            )}
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <div className={styles.cardName}>{card.displayName || "Anon"}</div>
                                            <div className={styles.cardBio}>{roleTitle || card.bio || "Builder"}</div>
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter} style={{ position: 'relative', zIndex: 2, gap: '8px', flexWrap: 'wrap' }}>
                                        {twitter && (
                                            <a
                                                href={twitter}
                                                target="_blank"
                                                className={styles.socialPill}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                TWITTER ↗
                                            </a>
                                        )}
                                        {website && (
                                            <a
                                                href={website}
                                                target="_blank"
                                                className={styles.socialPill}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                WEBSITE ↗
                                            </a>
                                        )}
                                        {customLinks.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.url}
                                                target="_blank"
                                                className={styles.socialPill}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {link.label?.toUpperCase() || "LINK"} ↗
                                            </a>
                                        ))}

                                        {!twitter && !website && customLinks.length === 0 && (
                                            <div className={styles.socialPill} style={{ opacity: 0.7, pointerEvents: 'none' }}>
                                                {card.owner.slice(0, 6)}...{card.owner.slice(-4)}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.qrCodeMini}>
                                        <QRCodeSVG value={`https://basescan.org/address/${card.owner}`} size={32} bgColor="white" fgColor="black" />
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}

                    {cards.length === 0 && (
                        <div className="text-center text-gray-600 py-12">
                            <p style={{ color: '#666' }}>No identities found.</p>
                        </div>
                    )}

                    <div style={{ height: '80px' }} /> {/* Spacer */}
                </div>
            )}
        </div>
    );
}
