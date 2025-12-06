"use client";
import { useState, useEffect } from "react";

export function AddToFavorites() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Show only if we haven't dismissed it yet
        const dismissed = localStorage.getItem("dismissItems");
        if (!dismissed) {
            // Small delay to not overwhelm
            const timer = setTimeout(() => setShow(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem("dismissItems", "true");
    };

    if (!show) return null;

    return (
        <div
            style={{
                position: "fixed",
                bottom: "0",
                left: "0",
                width: "100%",
                background: "linear-gradient(to right, #0052FF, #0038FF)",
                color: "white",
                padding: "1rem",
                zIndex: 9999,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
                borderTop: "1px solid rgba(255,255,255,0.2)",
            }}
        >
            <div style={{ flex: 1, paddingRight: "1rem" }}>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "0.9rem" }}>
                    Add to Favorites
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.9 }}>
                    Tap the menu icon (...) and select &quot;Add to Favorites&quot; for quick access!
                </p>
            </div>
            <button
                onClick={handleDismiss}
                style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    padding: "0.5rem",
                }}
            >
                ✕
            </button>
        </div>
    );
}
