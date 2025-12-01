"use client";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const { context } = useMiniKit();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Identity App</h1>

        <p className={styles.subtitle}>
          Welcome, {context?.user?.displayName || "Guest"}.
        </p>

        <div className={styles.menu}>
          <Link href="/profile" className={styles.menuItem}>
            <div className={styles.menuIcon}>👤</div>
            <div className={styles.menuText}>
              <h3>My Profile</h3>
              <p>Manage your identity and links</p>
            </div>
          </Link>

          <Link href="/connect" className={styles.menuItem}>
            <div className={styles.menuIcon}>🤝</div>
            <div className={styles.menuText}>
              <h3>Mint Connection</h3>
              <p>Meet someone and mint an SBT</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
