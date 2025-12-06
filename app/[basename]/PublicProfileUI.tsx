"use client";
import React from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import styles from "./publicProfile.module.css";

import { useSearchParams } from "next/navigation";

export default function PublicProfileUI({ basename }: { basename: string }) {
    const searchParams = useSearchParams();
    const sharedName = searchParams.get("name");
    const sharedBio = searchParams.get("bio");

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

    const cardVariant = getCardVariant(basename);

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
                <div className={`${styles.businessCard} ${styles[cardVariant]}`}>
                    <div className={styles.cardAccent}></div>
                    <div className={styles.cardHeader}>
                        <div className={styles.chip}></div>
                        <div className={styles.baseLogo}>
                            <Image src="/base-logo.svg" alt="Base" width={28} height={28} />
                            Base
                        </div>
                    </div>
                    <div className={styles.cardBody}>
                        {/* Placeholder for now since we can't fetch profile pic yet */}
                        <div className={styles.cardProfilePlaceholder}>
                            {(sharedName || basename).charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.cardInfo}>
                            {/* Use Shared Name if available, else fallback to formatted Address */}
                            <h2 className={styles.cardName}>
                                {sharedName || (basename.length > 15 ? basename.slice(0, 6) + "..." + basename.slice(-4) : basename)}
                            </h2>
                            <p className={styles.cardBio}>
                                {sharedBio || "Onchain Identity"}
                            </p>
                        </div>
                    </div>
                    <div className={styles.cardFooter}>
                        {sharedLinks.length > 0 ? (
                            sharedLinks.map((link, i) => (
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
