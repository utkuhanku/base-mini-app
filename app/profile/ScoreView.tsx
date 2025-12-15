
'use client';

import { useEffect, useState } from 'react';
import { ScoreData } from '../../utils/scoring';
import { generateStory, StoryPrototype } from '../../utils/storyEngine';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './profile.module.css';

// Extended ScoreData with frontend-specific props if needed, but for now ScoreData covers basics. 
// The API returns mixed fields (dailyTxCount, etc) which are not in strict ScoreData.
// Let's define the expected frontend shape here or extend ScoreData.

interface FrontendScoreData extends ScoreData {
    dailyTxCount: number;
    activeDaysLast30d: number;
    baseReacts: number;
    zoraMints: number;
}

export default function ScoreView({ address, onClose }: { address: string, onClose: () => void }) {
    const [data, setData] = useState<FrontendScoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [story, setStory] = useState<StoryPrototype | null>(null);
    const [showStory, setShowStory] = useState(false);

    // Zora Connection State (Mock)
    const [zoraConnected, setZoraConnected] = useState(false);
    const [verifyingZora, setVerifyingZora] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/profile-score?address=${address}`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setZoraConnected(d.zoraMints > 0);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [address]);

    const handleConnectZora = () => {
        setVerifyingZora(true);
        setTimeout(() => {
            setVerifyingZora(false);
            setZoraConnected(true);
            if (data) {
                setData({
                    ...data,
                    normalizedScore: Math.min(data.normalizedScore + 0.15, 0.99),
                    zoraMints: data.zoraMints === 0 ? 5 : data.zoraMints
                });
            }
        }, 1500);
    }

    if (loading) {
        return (
            <div className={styles.scoreInlineContainer} style={{ minHeight: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={styles.scoreLabel}
                >
                    CALCULATING_ONCHAIN_AURA...
                </motion.div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <motion.div
            className={styles.scoreInlineContainer}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className={styles.scoreInlineCard}>

                {/* Header */}
                <div className={styles.scoreInlineHeader}>
                    <div className={styles.scoreLabel}>ID.COLOR // V3.0</div>
                    <div className="flex gap-4 items-center">
                        <div className={styles.scoreLabel}>{address.slice(0, 6)}...{address.slice(-4)}</div>
                        {/* Collapse Button */}
                        <button onClick={onClose} className={styles.scoreCollapseBtn}>
                            ✕ COLLAPSE
                        </button>
                    </div>
                </div>

                {/* Orb & Score */}
                <div className={styles.scoreOrbContainerInline}>
                    <motion.div
                        className={styles.scoreOrbInline}
                        style={{ background: data.color, boxShadow: `0 0 120px ${data.color}` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.8, type: "spring" }}
                    />
                    <div className={styles.scoreValueInline}>
                        {data.normalizedScore.toFixed(2)}
                    </div>
                </div>

                {/* Zora Warning */}
                {!zoraConnected && (
                    <div className={styles.zoraWarning}>
                        <div className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffcccc" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            <span className={styles.zoraWarningText}>Low Zora Signal Detected</span>
                        </div>
                        <button onClick={handleConnectZora} className={styles.zoraConnectBtn}>
                            {verifyingZora ? 'Verifying...' : 'Connect Zora'}
                        </button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className={styles.scoreGrid}>
                    <StatCell
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
                        label="Transactions"
                        value={data.dailyTxCount}
                    />
                    <StatCell
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                        label="Active Days"
                        value={data.activeDaysLast30d}
                    />
                    <StatCell
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>}
                        label="Zora Mints"
                        value={zoraConnected ? data.zoraMints : 0}
                        warning={!zoraConnected}
                    />
                    <StatCell
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>}
                        label="Base Signal"
                        value={data.baseReacts}
                    />
                </div>

                {/* Action / Story */}
                <motion.button
                    className={styles.storyButton}
                    onClick={() => {
                        setStory(generateStory(data));
                        setShowStory(true);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    <span>Generate Base Story AI</span>
                </motion.button>

                {/* Story Result (Inline Expand) */}
                <AnimatePresence>
                    {showStory && story && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div style={{ width: 8, height: 8, background: data.color, borderRadius: '50%', margin: '0 0 12px 0', boxShadow: `0 0 10px ${data.color}` }} />

                                <h3 style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: 2, color: data.color, marginBottom: 12 }}>
                                    {story.title}
                                </h3>

                                <p style={{ color: '#eee', fontSize: 16, lineHeight: 1.6, marginBottom: 24, fontFamily: 'sans-serif' }}>
                                    "{story.narrative}"
                                </p>

                                <a
                                    href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`${story.title}\n\n"${story.narrative}"\n\nGenerated on Identity.Color`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.storyButton}
                                    style={{ background: 'white', color: 'black', border: 'none' }}
                                >
                                    Share on Warpcast
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function StatCell({ icon, label, value, warning }: { icon: any, label: string, value: number, warning?: boolean }) {
    return (
        <div className={styles.scoreStatBox} style={warning ? { border: '1px solid rgba(255,20,20,0.3)', background: 'rgba(255,0,0,0.05)' } : {}}>
            <div className={styles.statIcon} style={warning ? { color: '#ff8888' } : {}}>{icon}</div>
            <div className={styles.statLabel} style={warning ? { color: '#ffcccc' } : {}}>{label}</div>
            <div className={styles.statValue} style={warning ? { color: '#ff8888' } : {}}>{warning ? 'N/A' : value}</div>
        </div>
    );
}
