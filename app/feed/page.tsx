"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "../page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    const router = useRouter();

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
            {/* Header */}
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
                <div style={{ width: '100%', textAlign: 'center' }}>
                    <h1 style={{ fontWeight: 800, letterSpacing: '4px', fontSize: '14px', color: 'white', margin: 0 }}>
                        NETWORK STATE<span style={{ color: '#0052FF' }}>.</span>
                    </h1>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '100px' }}>
                    <div className={styles.loader} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '1px' }}>SYNCING...</p>
                </div>
            ) : (
                <div className={styles.dashboardGrid} style={{ maxWidth: '420px', width: '100%' }}>
                    {/* CTA for New Users */}
                    <div style={{ marginBottom: '24px' }}>
                        <button
                            onClick={() => router.push('/profile?create=true')}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'var(--card-gradient-primary)',
                                border: '1px solid var(--base-blue)',
                                borderRadius: '16px',
                                color: 'var(--base-blue)',
                                fontWeight: 800,
                                fontSize: '13px',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0, 82, 255, 0.1)'
                            }}
                        >
                            + Mint Your Identity
                        </button>
                    </div>

                    {cards.map((card, index) => {
                        // Parse Socials
                        let twitter = "";
                        let website = "";
                        let roleTitle = "";
                        let customLinks: any[] = [];
                        try {
                            if (card.socials && typeof card.socials === 'string') {
                                let raw = card.socials;
                                if (raw.startsWith('"') && raw.endsWith('"')) {
                                    raw = JSON.parse(raw);
                                }
                                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

                                if (Array.isArray(parsed)) {
                                    // Legacy Array
                                    customLinks = parsed.map((l: any) => ({
                                        label: l.label || l.title || "Link",
                                        url: l.url
                                    }));
                                    const tw = customLinks.find(l => l.label.toLowerCase().includes("twitter") || l.label.toLowerCase().includes("x") || l.url.includes("x.com"));
                                    if (tw) twitter = tw.url;

                                    const web = customLinks.find(l => l.label.toLowerCase().includes("website"));
                                    if (web) website = web.url;
                                } else {
                                    // Standard Object
                                    const socialData = parsed;
                                    twitter = socialData.twitter || "";
                                    website = socialData.website || "";
                                    roleTitle = socialData.roleTitle || "";
                                    customLinks = Array.isArray(socialData.links) ? socialData.links : [];
                                }
                            } else if (typeof card.socials === 'object') {
                                const socialData = card.socials as any;
                                twitter = socialData.twitter || "";
                                website = socialData.website || "";
                                roleTitle = socialData.roleTitle || "";
                                customLinks = Array.isArray(socialData.links) ? socialData.links : [];
                            }
                        } catch (e) {
                            console.error("Error parsing socials for card:", card.tokenId, e);
                        }

                        // Determine Display Role
                        const displayRole = roleTitle || "CITIZEN";

                        return (
                            <motion.div
                                key={card.tokenId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <div
                                    className={styles.voidCard}
                                    onClick={() => router.push(`/profile/${card.owner}`)}
                                    style={{ padding: '20px', minHeight: 'auto', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                                >
                                    {/* Avatar (Void Style - Small) */}
                                    <div style={{ marginRight: '16px', position: 'relative' }}>
                                        {card.avatarUrl ? (
                                            <img src={card.avatarUrl} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }} />
                                        )}
                                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: '10px', height: '10px', background: 'var(--base-blue)', borderRadius: '50%', border: '2px solid var(--bg-card)' }} />
                                    </div>

                                    {/* Text Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                            <span className={styles.voidLabel} style={{ marginBottom: 0, fontSize: '9px', color: 'var(--base-blue)' }}>{displayRole.toUpperCase()}</span>
                                            <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>#{card.tokenId}</span>
                                        </div>
                                        <h3 className={styles.voidTitle} style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{card.displayName}</h3>
                                        {card.bio && (
                                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%' }}>
                                                {card.bio}
                                            </p>
                                        )}
                                    </div>

                                    {/* Social Actions (Right Side) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                        {/* Twitter */}
                                        {twitter && (
                                            <a
                                                href={twitter}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ color: 'var(--text-tertiary)', transition: 'color 0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                            </a>
                                        )}
                                        {/* Website */}
                                        {website && (
                                            <a
                                                href={website}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ color: 'var(--text-tertiary)', transition: 'color 0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}

                    {cards.length === 0 && (
                        <div className="text-center py-12">
                            <p style={{ color: 'var(--text-secondary)', letterSpacing: '2px', fontSize: '10px' }}>VOID IS EMPTY</p>
                        </div>
                    )}

                    <div style={{ height: '80px' }} />
                </div>
            )}
        </div>
    );
}

