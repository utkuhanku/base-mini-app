"use client";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./page.module.css";

export default function Home() {
  const { context } = useMiniKit();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (context?.user?.walletAddress) {
      setIsConnected(true);
    }
  }, [context]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  } as const;

  return (
    <div className={styles.container}>
      <div className={styles.marqueeContainer}>
        <motion.div
          className={styles.marquee}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
        >
          <span>
            <Image src="/base-logo.svg" alt="Base" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
            BASE IS FOR EVERYONE &nbsp;•&nbsp;
            <Image src="/base-logo.svg" alt="Base" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 12px' }} />
            BASE IS FOR EVERYONE &nbsp;•&nbsp;
            <Image src="/base-logo.svg" alt="Base" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 12px' }} />
            BASE IS FOR EVERYONE &nbsp;•&nbsp;
            <Image src="/base-logo.svg" alt="Base" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 12px' }} />
            BASE IS FOR EVERYONE &nbsp;•&nbsp;
          </span>
        </motion.div>
      </div>

      <motion.div
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} style={{ marginBottom: '1rem', opacity: 0.6 }}>
          <Image src="/base-logo.svg" alt="Base" width={48} height={48} />
        </motion.div>

        <motion.h1 className={styles.title} variants={itemVariants}>
          IDENTITY<span className={styles.dot}>.</span>
        </motion.h1>

        <motion.p className={styles.subtitle} variants={itemVariants}>
          Welcome, {context?.user?.displayName || "Guest"}.
        </motion.p>

        {!isConnected ? (
          <motion.div variants={itemVariants} className={styles.connectPrompt}>
            <p>Please connect your wallet to continue.</p>
            {/* The MiniKit provider handles the actual connection modal automatically or via its own UI, 
                 but we can show a message here if it's not connected yet. 
                 In a real Base App, the wallet is usually provided by the host. */}
          </motion.div>
        ) : (
          <div className={styles.menu}>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <motion.div
                className={styles.menuItem}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 82, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.menuIcon}>👤</div>
                <div className={styles.menuText}>
                  <h3>My Profile</h3>
                  <p>Manage your digital identity</p>
                </div>
                <div className={styles.arrow}>→</div>
              </motion.div>
            </Link>

            <Link href="/connect" style={{ textDecoration: 'none' }}>
              <motion.div
                className={styles.menuItem}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 82, 255, 0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.menuIcon}>🤝</div>
                <div className={styles.menuText}>
                  <h3>Mint Connection</h3>
                  <p>Establish a new bond</p>
                </div>
                <div className={styles.arrow}>→</div>
              </motion.div>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
