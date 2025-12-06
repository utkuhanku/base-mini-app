"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./explore.module.css";
import PublicProfileUI from "../[basename]/PublicProfileUI";
import { motion } from "framer-motion";

export default function ExplorePage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");

    // Simple debounce logic
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);

        // Clear previous timeout if typing
        // actually for a purely visual demo, let's just set it. 
        // In a real app we'd debounce API calls.
        // Here we just want instant feedback or slight delay.
        if (val.length > 2) {
            setDebouncedTerm(val);
        } else {
            setDebouncedTerm("");
        }
    };

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => router.push("/")}>
                ← Back
            </button>

            <motion.h1
                className={styles.title}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                EXPLORE<span className={styles.dot}>.</span>
            </motion.h1>

            <motion.div
                className={styles.searchContainer}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <input
                    className={styles.searchInput}
                    placeholder="Search name or 0x address..."
                    value={searchTerm}
                    onChange={handleSearch}
                    autoFocus
                />
                <div className={styles.searchIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </motion.div>

            <div className={styles.resultContainer}>
                {debouncedTerm ? (
                    // abusing the PublicProfileUI to render the card
                    // We pass the search term as the "basename"
                    <div style={{ transform: 'scale(0.9)' }}>
                        <PublicProfileUI basename={debouncedTerm} />
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        Start typing to find identities...
                    </div>
                )}
            </div>
        </div>
    );
}
