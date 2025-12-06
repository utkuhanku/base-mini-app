"use client";
import React from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import styles from "./publicProfile.module.css";
// import { useReadContract } from "wagmi"; // Future integration

// Mock Data for Demo
const MOCK_EVENTS = [
    { name: "Base Meetup Istanbul", date: "2024-10-15", location: "Istanbul, TR" },
    { name: "ETHGlobal Hackathon", date: "2024-11-12", location: "Bangkok, TH" },
];

const MOCK_POAPS = [
    { id: 1, image: "https://placehold.co/100x100/4F46E5/FFFFFF/png?text=POAP+1", name: "Early Adopter" },
    { id: 2, image: "https://placehold.co/100x100/EC4899/FFFFFF/png?text=POAP+2", name: "Builder" },
];

export default function PublicProfileUI({ basename }: { basename: string }) {
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

    return (
        <div className={styles.container}>
            {/* Header / Identity Card */}
            <motion.div
                className={styles.heroSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.h1 className={styles.title}>{basename.toUpperCase()}</motion.h1>

                <motion.div
                    className={styles.cardContainer}
                    style={{ rotateX, rotateY, z: 100 }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className={styles.businessCard}>
                        <div className={styles.cardAccent}></div>
                        <div className={styles.cardHeader}>
                            <div className={styles.chip}></div>
                            <div className={styles.baseLogo}>Base</div>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.cardProfilePlaceholder}>{basename.charAt(0).toUpperCase()}</div>
                            <div className={styles.cardInfo}>
                                <h2 className={styles.cardName}>{basename}</h2>
                                <p className={styles.cardBio}>Building on Base.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Actions: "Open in App" if on web */}
            <div className={styles.actions}>
                <button
                    className={styles.primaryButton}
                    onClick={() => {
                        // Deep link to open THIS profile in Base App
                        const currentUrl = window.location.href;
                        const deepLink = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`;
                        window.location.href = deepLink;
                    }}
                >
                    OPEN IN BASE APP
                </button>
            </div>

            <div className={styles.actions}>
                <button
                    className={styles.secondaryButton}
                    onClick={() => alert("Minting Coming Soon!")}
                >
                    MINT CONNECTION (Coming Soon)
                </button>
                <button className={styles.secondaryButton}>
                    CHECK-IN
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

            {/* Social Proof Section */}
            <div className={styles.socialSection}>

                {/* SBT Gallery */}
                <div className={styles.sectionBlock}>
                    <h3 className={styles.sectionTitle}>CONNECTIONS</h3>
                    <div className={styles.grid}>
                        <div className={styles.emptyState}>No connections minted yet.</div>
                    </div>
                </div>

                {/* Events */}
                <div className={styles.sectionBlock}>
                    <h3 className={styles.sectionTitle}>ATTENDED EVENTS</h3>
                    <div className={styles.list}>
                        {MOCK_EVENTS.map((evt, i) => (
                            <div key={i} className={styles.listItem}>
                                <span className={styles.date}>{evt.date}</span>
                                <span className={styles.name}>{evt.name}</span>
                                <span className={styles.location}>{evt.location}</span>
                            </div>
                        ))}
                    </div>
                    <button className={styles.textButton}>Find Events Near You &rarr;</button>
                </div>

                {/* POAPs */}
                <div className={styles.sectionBlock}>
                    <h3 className={styles.sectionTitle}>POAP COLLECTION</h3>
                    <div className={styles.poapGrid}>
                        {MOCK_POAPS.map((p) => (
                            <div key={p.id} className={styles.poapItem}>
                                <Image src={p.image} alt={p.name} width={60} height={60} className={styles.poapImage} />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
