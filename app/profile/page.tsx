"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useReadContract } from "wagmi";
import styles from "./profile.module.css";

const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS_HERE"; // TODO: Replace with deployed address
const ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface Link {
  title: string;
  url: string;
}

interface Profile {
  name: string;
  bio: string;
  profilePicUrl: string;
  links: Link[];
}

function Gallery() {
  const { address } = useAccount();
  const [tokens, setTokens] = useState<string[]>([]);

  // 1. Get Balance
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Note: For a real app, we should use a loop or a multicall to fetch all tokens.
  // For this demo, we'll just try to fetch the first few if balance exists.
  // A better approach in production is using an Indexer (The Graph) or an API.
  // Here we will just mock fetching the first token if balance > 0 for demonstration of the pattern.

  const { data: firstTokenId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "tokenOfOwnerByIndex",
    args: address && balance && Number(balance) > 0 ? [address, BigInt(0)] : undefined,
  });

  const { data: firstTokenURI } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "tokenURI",
    args: firstTokenId !== undefined ? [firstTokenId] : undefined,
  });

  useEffect(() => {
    if (firstTokenURI) {
      setTokens([firstTokenURI]);
    }
  }, [firstTokenURI]);

  if (!address || !balance || Number(balance) === 0) {
    return null;
  }

  return (
    <div className={styles.galleryContainer}>
      <h3 className={styles.galleryTitle}>MY CONNECTIONS</h3>
      <div className={styles.galleryGrid}>
        {tokens.map((uri, i) => (
          <div key={i} className={styles.galleryItem}>
            {/* Handling IPFS or direct URLs. For this demo we assume http/https */}
            <Image src={uri} alt={`Connection ${i}`} width={100} height={100} className={styles.galleryImage} />
          </div>
        ))}
        {Number(balance) > tokens.length && (
          <div className={styles.moreCount}>+{Number(balance) - tokens.length} more</div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { context } = useMiniKit();
  const [profile, setProfile] = useState<Profile>({
    name: "",
    bio: "",
    profilePicUrl: "",
    links: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse profile from local storage", e);
        // Fallback to default or clear invalid data
        localStorage.removeItem("userProfile");
      }
    } else if (context?.user?.displayName) {
      setProfile(prev => ({ ...prev, name: context.user.displayName || "" }));
      setIsEditing(true);
    }
  }, [context]);

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    setIsEditing(false);
  };

  const addLink = () => {
    setProfile({
      ...profile,
      links: [...profile.links, { title: "", url: "" }],
    });
  };

  const updateLink = (index: number, field: keyof Link, value: string) => {
    const newLinks = [...profile.links];
    newLinks[index][field] = value;
    setProfile({ ...profile, links: newLinks });
  };

  const removeLink = (index: number) => {
    const newLinks = profile.links.filter((_, i) => i !== index);
    setProfile({ ...profile, links: newLinks });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Profile link copied!");
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (showShare) {
    return (
      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.h1 className={styles.title}>SHARE ID<span className={styles.dot}>.</span></motion.h1>

        <div className={styles.shareCard}>
          <div className={styles.qrContainer}>
            <QRCodeSVG
              value={typeof window !== 'undefined' ? window.location.href : ""}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="H"
            />
          </div>
          <p className={styles.shareText}>Scan to view profile</p>

          <button className={styles.button} onClick={copyLink}>
            COPY LINK
          </button>

          <button className={styles.secondaryButton} onClick={() => setShowShare(false)}>
            CLOSE
          </button>
        </div>
      </motion.div>
    );
  }

  if (isEditing) {
    return (
      <motion.div
        className={styles.container}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.h1 className={styles.title}>EDIT ID<span className={styles.dot}>.</span></motion.h1>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>PROFILE PICTURE URL</label>
            <input
              className={styles.input}
              value={profile.profilePicUrl}
              onChange={(e) => setProfile({ ...profile, profilePicUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>NAME</label>
            <input
              className={styles.input}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Enter your name"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>BIO</label>
            <textarea
              className={styles.textarea}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>LINKS</label>
            <div className={styles.linkList}>
              {profile.links.map((link, i) => (
                <div key={i} className={styles.linkItem}>
                  <input
                    className={styles.input}
                    placeholder="Title"
                    value={link.title}
                    onChange={(e) => updateLink(i, "title", e.target.value)}
                  />
                  <input
                    className={styles.input}
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                  />
                  <button className={styles.removeButton} onClick={() => removeLink(i)}>✕</button>
                </div>
              ))}
              <button className={styles.addButton} onClick={addLink}>
                + ADD LINK
              </button>
            </div>
          </div>

          <button className={styles.button} onClick={handleSave}>
            SAVE CHANGES
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h1 className={styles.title}>MY IDENTITY<span className={styles.dot}>.</span></motion.h1>

      <motion.div
        className={styles.cardContainer}
        style={{ rotateX, rotateY, z: 100 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.businessCard}>
          <div className={styles.cardAccent}></div>

          <div className={styles.cardHeader}>
            <div className={styles.chip}></div>
            <div className={styles.baseLogo}>
              <Image src="/base-logo.svg" alt="Base" width={28} height={28} />
              Base
            </div>
          </div>

          <div className={styles.cardBody}>
            {profile.profilePicUrl ? (
              <Image src={profile.profilePicUrl} alt="Profile" width={70} height={70} className={styles.cardProfilePic} />
            ) : (
              <div className={styles.cardProfilePlaceholder}>{profile.name.charAt(0)}</div>
            )}
            <div className={styles.cardInfo}>
              <h2 className={styles.cardName}>{profile.name || "YOUR NAME"}</h2>
              <p className={styles.cardBio}>{profile.bio || "Digital Identity on Base"}</p>
            </div>
          </div>

          <div className={styles.cardFooter}>
            {profile.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                {link.title || "Link"} ↗
              </a>
            ))}
          </div>
        </div>
      </motion.div>

      <Gallery />

      <div className={styles.actionButtons}>
        <button className={styles.button} onClick={() => setIsEditing(true)}>
          EDIT IDENTITY
        </button>

        <button className={styles.secondaryButton} onClick={() => setShowShare(true)}>
          SHARE CARD
        </button>
      </div>
    </motion.div>
  );
}
