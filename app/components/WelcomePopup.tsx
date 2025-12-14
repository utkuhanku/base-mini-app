"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function WelcomePopup() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has seen this version of the welcome popup
        const hasSeen = localStorage.getItem("hasSeenWelcomePopup_v1");
        if (!hasSeen) {
            // Delay slightly for effect
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("hasSeenWelcomePopup_v1", "true");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 10000,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px'
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: '24px',
                            padding: '32px',
                            maxWidth: '360px',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '24px',
                            boxShadow: '0 20px 50px -10px rgba(0, 82, 255, 0.3)'
                        }}
                    >
                        {/* Base Logo */}
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: '#0052FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(0, 82, 255, 0.5)'
                        }}>
                            <Image src="/base-logo.svg" alt="Base" width={32} height={32} style={{ filter: 'brightness(0) invert(1)' }} />
                        </div>

                        {/* English Text */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'white' }}>
                                HELLO BASED 🔵
                            </h2>
                            <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#ccc', margin: 0 }}>
                                My first MiniApp is evolving with your valuable feedback. Every comment you make contributes to our progress.
                                <br /><br />
                                <span style={{ color: '#0052FF', fontWeight: 700, whiteSpace: 'nowrap' }}>Build on BASE 🟦</span>
                            </p>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleClose}
                            style={{
                                background: 'white', color: 'black', border: 'none',
                                padding: '16px 32px', borderRadius: '16px',
                                fontSize: '14px', fontWeight: 800, width: '100%',
                                cursor: 'pointer', letterSpacing: '0.5px'
                            }}
                        >
                            LET'S GO
                        </button>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
