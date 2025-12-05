"use client";
import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { motion } from "framer-motion";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import styles from "./connect.module.css";

const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS_HERE"; // TODO: Replace with deployed address
const ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "partner", "type": "address" },
            { "internalType": "string", "name": "uri", "type": "string" }
        ],
        "name": "mintConnection",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export default function ConnectPage() {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [partnerAddress, setPartnerAddress] = useState("");
    const [status, setStatus] = useState("");

    const { address } = useAccount();
    const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isPending) setStatus("Confirming in wallet...");
        if (isConfirming) setStatus("Processing transaction...");
        if (isConfirmed) setStatus("CONNECTION ESTABLISHED. TOKEN MINTED.");
        if (writeError) setStatus(`Error: ${writeError.message}`);
    }, [isPending, isConfirming, isConfirmed, writeError]);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
        setStatus("");
    };

    const handleMint = async () => {
        if (!imgSrc || !partnerAddress) {
            setStatus("Please take a photo and enter a wallet address.");
            return;
        }

        if (!address) {
            setStatus("Please connect your wallet first.");
            return;
        }

        // In a real app, upload imgSrc to IPFS/Storage here and get the URI.
        // For this demo, we'll use a placeholder or the data URL (not recommended for on-chain but works for demo if short enough, though likely too long).
        // Using a placeholder for now as per plan.
        const tokenURI = "https://placehold.co/600x400/0052FF/FFFFFF/png?text=Connection+SBT";

        try {
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: "mintConnection",
                args: [partnerAddress as `0x${string}`, tokenURI],
            });
        } catch (e) {
            console.error(e);
            setStatus("Minting failed to start.");
        }
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
                    disabled={!imgSrc || !partnerAddress || isPending || isConfirming}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isPending || isConfirming ? "MINTING..." : "MINT SBT"}
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
