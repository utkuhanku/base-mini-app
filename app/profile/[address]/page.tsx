"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useReadContract } from "wagmi";
import { parseAbi } from "viem";
import Link from "next/link";
import styles from "../profile.module.css";
import ScoreView from "../ScoreView";

const CARD_SBT_ADDRESS = process.env.NEXT_PUBLIC_CARD_SBT_ADDRESS || "0x4003055676749a0433EA698A8B70E45d398FC87f";

interface PageProps {
    params: {
        address: string;
    }
}

export default function PublicProfilePage({ params }: PageProps) {
    const { address } = params;
    const [showScore, setShowScore] = useState(false);
    const [activeHelp, setActiveHelp] = useState<string | null>(null);

    // 1. Get Token ID
    const { data: tokenId } = useReadContract({
        address: CARD_SBT_ADDRESS as `0x${string}`,
        abi: parseAbi(["function cardOf(address owner) view returns (uint256)"]),
        functionName: "cardOf",
        args: [address as `0x${string}`],
        query: { enabled: !!address }
    });

    // 2. Get Profile Data
    const { data: profileData, isLoading } = useReadContract({
        address: CARD_SBT_ADDRESS as `0x${string}`,
        abi: parseAbi([
            "function profiles(uint256) view returns (string displayName, string avatarUrl, string bio, string socials, string websites)"
        ]),
        functionName: "profiles",
        args: tokenId ? [tokenId] : undefined,
        query: { enabled: !!tokenId }
    });

    // Parse Data
    const profile = {
        name: "",
        bio: "",
        profilePicUrl: "",
        role: "creator", // Default or parsed from socials if stored there
        roleTitle: "",
        twitter: "",
        website: "",
        links: []
    };

    if (profileData) {
        // [displayName, avatarUrl, bio, socials, websites]
        const p = profileData as any;
        profile.name = p[0];
        profile.profilePicUrl = p[1];
        profile.bio = p[2];
        try {
            const socials = JSON.parse(p[3] || "{}");
            profile.roleTitle = socials.roleTitle;
            profile.twitter = socials.twitter;
            profile.website = socials.website;
            profile.links = socials.links || [];
        } catch (e) {
            // ignore JSON error
        }
    }

    if (!tokenId && !isLoading) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>Identity Not Found</p>
                <Link href="/" style={{ marginTop: '16px', color: '#0052FF' }}>Return Home</Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header / Back Link */}
            <div style={{ width: '100%', maxWidth: '420px', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Link href="/feed" style={{
                    color: 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '8px 16px',
                    borderRadius: '100px'
                }}>
                    ← BACK
                </Link>
            </div>

            {/* --- BLUE IDENTITY CARD --- */}
            <div className={styles.identityCard}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardChip} />
                    <div className={styles.verifiedBadge}><div className={styles.verifiedDot} />Verified</div>
                    <div className={styles.pointsPill}><span>💎</span> #{Number(tokenId)}</div>
                </div>

                <div className={styles.cardBody}>
                    <div className={styles.cardAvatarContainer}>
                        {profile.profilePicUrl ? (
                            <img src={profile.profilePicUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: '#ccc' }} />
                        )}
                    </div>
                    <div className={styles.cardInfo}>
                        <div className={styles.cardName}>{profile.name || "Anon"}</div>
                        <div className={styles.cardBio}>{profile.roleTitle || "Builder"}</div>
                    </div>
                </div>

                <div className={styles.cardFooter}>
                    {profile.twitter && <a href={profile.twitter} target="_blank" className={styles.socialPill}>TWITTER / X ↗</a>}
                    {profile.website && <a href={profile.website} target="_blank" className={styles.socialPill}>WEBSITE ↗</a>}
                    {!profile.twitter && !profile.website && <span style={{ fontSize: 9, opacity: 0.5, fontStyle: 'italic' }}>@base.eth</span>}
                </div>

                <div className={styles.qrCodeMini}>
                    <QRCodeSVG value={`https://base.org?user=${address}`} size={32} bgColor="white" fgColor="black" />
                </div>
            </div>

            {/* --- MEMORIES & EVENTS (Read Only) --- */}
            <div className={styles.sectionContainer}>
                {/* Memories */}
                <div>
                    <div className={styles.sectionHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Minted Memories</span>
                            <button
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#666',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                    padding: '4px 8px',
                                    zIndex: 50,
                                    position: 'relative'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveHelp('memories');
                                }}
                            >
                                ?
                            </button>
                        </div>
                        <span style={{ opacity: 0.5, fontSize: '12px' }}>0</span>
                    </div>
                    <div className={styles.memoriesScroll}>
                        {/* Empty State for now or fetch items if we had them */}
                        <div className={styles.memoryCard} style={{ width: '100%', maxWidth: 'none', flexDirection: 'row', gap: '16px', alignItems: 'center', justifyContent: 'flex-start', padding: '0 16px', height: '80px', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '24px', opacity: 0.3 }}>⚙️</div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>No Memories Yet</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events */}
                <div>
                    <div className={styles.sectionHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Events</span>
                            <button
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#666',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                    padding: '4px 8px',
                                    zIndex: 50,
                                    position: 'relative'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveHelp('events');
                                }}
                            >
                                ?
                            </button>
                        </div>
                        <span style={{ opacity: 0.5, fontSize: '12px' }}>0</span>
                    </div>
                    <div className={styles.eventsList}>
                        <div className={styles.eventItem} style={{ borderStyle: 'dashed', opacity: 0.3 }}>
                            <div>
                                <div style={{ fontSize: '10px', color: '#888', fontWeight: 700, marginBottom: '4px' }}>UPCOMING</div>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>No Events</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ANALYTICS (CHECK SCORE) --- */}
            <div className={styles.basePostSection} style={{ borderTop: 'none', marginTop: '40px', paddingTop: '0' }}>
                <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', marginBottom: '32px' }} />

                {showScore ? (
                    <ScoreView address={address} onClose={() => setShowScore(false)} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#666' }}>
                            Onchain Analytics
                        </div>
                        <button
                            onClick={() => setShowScore(true)}
                            style={{
                                background: 'linear-gradient(145deg, #111 0%, #000 100%)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '24px',
                                width: '100%',
                                maxWidth: '420px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0052FF 0%, #001040 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                    📊
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ color: 'white', fontWeight: 800, fontSize: '14px', letterSpacing: '0.5px' }}>CHECK SCORE</div>
                                    <div style={{ color: '#666', fontSize: '11px' }}>Analyze wallet activity & reputation</div>
                                </div>
                            </div>
                            <div style={{ color: '#444' }}>→</div>
                        </button>
                    </div>
                )}
            </div>

            {/* HELP MODAL OVERLAY (Simplified) */}
            {activeHelp && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
                }} onClick={() => setActiveHelp(null)}>
                    <div style={{
                        background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px',
                        maxWidth: '360px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                            {activeHelp === 'memories' ? 'MINTED MEMORIES' : 'EVENTS'}
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>
                            This section shows the user's onchain history.
                            <br /><br />
                            <span style={{ color: '#0052FF' }}>Synced from Base.</span>
                        </div>
                        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', opacity: 0.5, cursor: 'pointer' }} onClick={() => setActiveHelp(null)}>
                            TAP ANYWHERE TO CLOSE
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
