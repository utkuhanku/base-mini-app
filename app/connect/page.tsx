"use client";
import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
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

        setStatus("Minting Connection SBT... (Simulation)");

        // TODO: Integrate actual smart contract call here
        // 1. Upload image to IPFS (simulated)
        // 2. Call ConnectionSBT.mintConnection(partnerAddress, ipfsUri)

        setTimeout(() => {
            setStatus("Success! Connection SBT minted.");
        }, 2000);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Mint Connection</h1>

            <div className={styles.cameraContainer}>
                {imgSrc ? (
                    <img src={imgSrc} alt="Selfie" className={styles.previewImage} />
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

            <div className={styles.controls}>
                {!imgSrc ? (
                    <button className={styles.button} onClick={capture}>
                        Take Selfie
                    </button>
                ) : (
                    <button className={styles.secondaryButton} onClick={retake}>
                        Retake Photo
                    </button>
                )}

                <input
                    className={styles.input}
                    placeholder="Partner's Wallet Address (0x...)"
                    value={partnerAddress}
                    onChange={(e) => setPartnerAddress(e.target.value)}
                />

                <button
                    className={styles.button}
                    onClick={handleMint}
                    disabled={!imgSrc || !partnerAddress}
                    style={{ opacity: (!imgSrc || !partnerAddress) ? 0.5 : 1 }}
                >
                    Mint Connection SBT
                </button>

                {status && <div className={styles.status}>{status}</div>}
            </div>
        </div>
    );
}
