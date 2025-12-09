"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "../profile/profile.module.css"; // Reusing profile styles for cards
import Link from "next/link";

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
        <div className="min-h-screen bg-black text-white p-4 pb-24">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <Link href="/" style={{
                    position: 'absolute',
                    left: 0,
                    color: 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    fontSize: '24px'
                }}>
                    ←
                </Link>
                <motion.h1
                    className={styles.title}
                    style={{ fontWeight: 800, letterSpacing: '-1px', fontSize: '2rem', margin: '0 auto' }} // Center title override
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    GLOBAL FEED<span className={styles.dot}>.</span>
                </motion.h1>
            </div>

            <p className="text-center text-gray-500 mb-8">Discover everyone building on Base.</p>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid gap-6 max-w-md mx-auto">
                    {cards.map((card) => (
                        <motion.div
                            key={card.tokenId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Reusing the card style structure roughly */}
                            <div className={`${styles.businessCard} ${styles.variantClassic}`} style={{ transform: 'none', marginBottom: 0 }}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.chip}></div>
                                    <div className={styles.baseLogo}>
                                        <Image src="/base-logo.svg" alt="Base" width={20} height={20} />
                                        #{card.tokenId}
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    {card.avatarUrl ? (
                                        <Image src={card.avatarUrl} alt={card.displayName} width={60} height={60} className={styles.cardProfilePic} />
                                    ) : (
                                        <div className={styles.cardProfilePlaceholder}>{card.displayName ? card.displayName.charAt(0) : "U"}</div>
                                    )}
                                    <div className={styles.cardInfo}>
                                        <h2 className={styles.cardName}>{card.displayName || "Unknown"}</h2>
                                        <p className={styles.cardBio}>{card.bio || "No bio"}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3 pl-4 pr-4">
                                        {(() => {
                                            try {
                                                const links = JSON.parse(card.socials || "[]");
                                                return links.map((link: any, i: number) => (
                                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                                        className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition text-blue-300">
                                                        {link.title} ↗
                                                    </a>
                                                ));
                                            } catch (e) { return null; }
                                        })()}
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <a href={`https://basescan.org/address/${card.owner}`} target="_blank" className="text-xs text-gray-400 hover:text-white transition">
                                        {card.owner.slice(0, 6)}...{card.owner.slice(-4)}
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {cards.length === 0 && (
                        <div className="text-center text-gray-600 py-12">
                            No cards minted yet. Be the first!
                            <div className="mt-4">
                                <Link href="/profile" className={styles.button}>
                                    MINT YOUR CARD
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
