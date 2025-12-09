"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function WelcomePopup() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check if already seen
        const hasSeen = localStorage.getItem('hasSeenWelcome');
        if (hasSeen) {
            setIsVisible(false);
            return;
        }

        // Auto-close after 3.5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            localStorage.setItem('hasSeenWelcome', 'true');
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '20px'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 12 }}
                        style={{
                            background: '#111',
                            padding: '2rem',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center',
                            boxShadow: '0 0 50px rgba(0, 82, 255, 0.3)'
                        }}
                    >
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <Image src="/base-logo.svg" alt="Base" width={48} height={48} />
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                            My First Mini App
                        </h2>

                        <p style={{ color: '#888', fontSize: '0.9rem', maxWidth: '240px', lineHeight: '1.5' }}>
                            Send your feedback to <span style={{ color: '#fff', fontWeight: 'bold' }}>utkus</span> on Base App.
                        </p>

                        <motion.div
                            style={{ height: '3px', background: '#0052FF', borderRadius: '4px', marginTop: '1.5rem', width: '100%' }}
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3.5, ease: "linear" }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
