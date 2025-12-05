"use client";
import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { motion } from "framer-motion";
import styles from "./connect.module.css";

export default function ConnectPage() {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [partnerAddress, setPartnerAddress] = useState("");
    const [status, setStatus] = useState("");

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };

    const handleMint = async () => {
        if (!imgSrc || !partnerAddress) {
            setStatus("Please take a photo and enter a wallet address.");
            return;
        }

        setStatus("INITIALIZING MINT SEQUENCE...");

        setTimeout(() => {
            setStatus("CONNECTION ESTABLISHED. TOKEN MINTED.");
        }, 2000);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    } as const;

    return (
        <motion.div
            className={styles.container}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.h1 className={styles.title} variants={itemVariants}>
                MINT CONNECTION<span className={styles.dot}>.</span>
            </motion.h1>

            <motion.div className={styles.cameraFrame} variants={itemVariants}>
                <div className={styles.cornerTL}></div>
                <div className={styles.cornerTR}></div>
                <div className={styles.cornerBL}></div>
                <div className={styles.cornerBR}></div>

                <div className={styles.cameraContainer}>
                    {imgSrc ? (
                        <Image src={imgSrc} alt="Selfie" fill className={styles.previewImage} />
                    ) : (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className={styles.webcam}
                            videoConstraints={{ facingMode: "user" }}
                        />
                    )}
                </div>
            </motion.div>

            <motion.div className={styles.controls} variants={itemVariants}>
                {!imgSrc ? (
                    <motion.button
                        className={styles.button}
                        onClick={capture}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        CAPTURE IMAGE
                    </motion.button>
                ) : (
                    <motion.button
                        className={styles.secondaryButton}
                        onClick={retake}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        RETAKE
                    </motion.button>
                )}

                <div className={styles.inputGroup}>
                    <label className={styles.label}>PARTNER ADDRESS</label>
                    <input
                        className={styles.input}
                        placeholder="0x..."
                        value={partnerAddress}
                        onChange={(e) => setPartnerAddress(e.target.value)}
                    />
                </div>

                <motion.button
                    className={styles.mintButton}
                    onClick={handleMint}
                    disabled={!imgSrc || !partnerAddress}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    MINT SBT
                </motion.button>

                {status && (
                    <motion.div
                        className={styles.status}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <span className={styles.statusDot}></span>
                        {status}
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}
