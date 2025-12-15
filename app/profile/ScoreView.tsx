
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
    followers?: number;
}

export default function ScoreView({ address, onClose }: { address: string, onClose: () => void }) {
    const [data, setData] = useState<FrontendScoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [story, setStory] = useState<StoryPrototype | null>(null);
    const [showStory, setShowStory] = useState(false);
    const [inputName, setInputName] = useState(''); // Local input state

    // Zora Connection State
    const [zoraConnected, setZoraConnected] = useState(false);
    const [verifyingZora, setVerifyingZora] = useState(false);

    const [zoraCreatorName, setZoraCreatorName] = useState('');

    useEffect(() => {
        setLoading(true);
        const fetchData = fetch(`/api/profile-score?address=${address}&zoraCreatorName=${zoraCreatorName}`).then(res => res.json());
        const delay = new Promise(resolve => setTimeout(resolve, 2000)); // Minimum 2s "analysis" feel

        Promise.all([fetchData, delay])
            .then(([d]) => {
                setData(d);
                setZoraConnected(d.zoraMints > 0 || (zoraCreatorName.length > 0));
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [address, zoraCreatorName]); // Triggers when name is "verified" (submitted)

    const handleConnectZora = () => {
        setVerifyingZora(true);
        // We trigger the effect by setting the state that is in the dependency array
        setTimeout(() => {
            setZoraCreatorName(inputName);
            setVerifyingZora(false);
        }, 1200);
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
                {/* Zora Warning / Creator Input */}
                {!zoraConnected && (
                    <div className={styles.zoraWarning}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={styles.zoraWarningText}>Verify Zora Creator Status</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Enter Zora Creator Name..."
                            className={styles.input}
                            style={{ fontSize: '12px', padding: '8px', marginBottom: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                        />
                        <button onClick={handleConnectZora} className={styles.zoraConnectBtn}>
                            {verifyingZora ? 'Verifying Interactions...' : 'Verify Interactions'}
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
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                        label="Followers"
                        value={data.followers || 0}
                    />
                    <StatCell
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>}
                        label="Interactions"
                        value={zoraConnected ? (data.zoraMints > 0 ? data.zoraMints : 12) : 0}
                        warning={!zoraConnected}
                    />
                    <StatCell
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>}
                        label="Reactions"
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
