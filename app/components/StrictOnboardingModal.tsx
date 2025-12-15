"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function StrictOnboardingModal() {
    const router = useRouter();

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10001, // Higher than WelcomePopup
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '24px',
                    padding: '40px',
                    maxWidth: '400px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '24px',
                    boxShadow: '0 0 100px rgba(0, 82, 255, 0.2)'
                }}
            >
                {/* Lock Icon or Alert */}
                <div style={{ fontSize: '48px' }}>🔐</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Access Restricted
                    </h2>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#888', margin: 0 }}>
                        Identity is the new currency. You must mint your Onchain Identity to verify your signal and access the feed.
                    </p>
                </div>

                {/* Action Button - Redirects to Profile/Mint */}
                <button
                    onClick={() => router.push('/profile')}
                    style={{
                        background: '#0052FF', color: 'white', border: 'none',
                        padding: '16px 32px', borderRadius: '100px',
                        fontSize: '14px', fontWeight: 800, width: '100%',
                        cursor: 'pointer', letterSpacing: '1px',
                        textTransform: 'uppercase',
                        boxShadow: '0 10px 30px rgba(0, 82, 255, 0.4)'
                    }}
                >
                    MINT IDENTITY
                </button>

            </motion.div>
        </div>
    );
}
