"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import MintButton from "./MintButton";
import EditButton from "./EditButton";
import styles from "./profile.module.css";
import { parseAbi } from "viem";

const CARD_SBT_ADDRESS = process.env.NEXT_PUBLIC_CARD_SBT_ADDRESS || "0x4003055676749a0433EA698A8B70E45d398FC87f";

interface Link {
  title: string;
  url: string;
}

interface Profile {
  name: string;
  bio: string;
  role: 'creator' | 'business';
  profilePicUrl: string;
  links: Link[];
  isPublished?: boolean; // Track if onchain
  txHash?: string; // Transaction Hash of the Mint
}

export default function ProfilePage() {

  const { address } = useAccount(); // Get connected wallet address
  const [profile, setProfile] = useState<Profile>({
    name: "",
    bio: "",
    role: "creator", // Default
    profilePicUrl: "",
    links: [],
    isPublished: false,
    txHash: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false); // New Modal state
  const [shareUrl, setShareUrl] = useState("");

  // CHECK IF USER HAS A CARD
  const { data: cardTokenId, isLoading: isCardLoading } = useReadContract({
    address: CARD_SBT_ADDRESS as `0x${string}`,
    abi: parseAbi(["function cardOf(address owner) view returns (uint256)"]),
    functionName: 'cardOf',
    args: [address!],
    query: {
      enabled: !!address,
    }
  });

  const hasCard = cardTokenId && Number(cardTokenId) > 0;

  // READ CARD PROFILE IF EXISTS
  const { data: cardData, isLoading: isProfileLoading } = useReadContract({
    address: CARD_SBT_ADDRESS as `0x${string}`,
    abi: parseAbi([
      "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
      "function profiles(uint256) view returns (Profile)"
    ]),
    functionName: 'profiles',
    args: [cardTokenId!],
    query: {
      enabled: !!hasCard,
    }
  });

  // Load from chain if available, else local
  useEffect(() => {
    // Wait for contract read to finish
    if (isCardLoading) return;

    if (hasCard && cardData && !isProfileLoading) {
      // PROVEN ONCHAIN DATA -> USE IT
      const p = cardData as any; // typed as Profile struct
      setProfile(prev => ({
        ...prev,
        name: p.displayName,
        bio: p.bio,
        profilePicUrl: p.avatarUrl,
        isPublished: true,
        // Links parsing omitted for brevity in this step
      }));
    } else if (!hasCard) {
      // NO ONCHAIN CARD -> CHECK LOCAL
      const savedProfile = localStorage.getItem("userProfile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);

          // CRITICAL FIX: If local data claims to be "Published" but chain says NO,
          // it is a legacy/fake card. The user wants to DESTROY it.
          if (parsed.isPublished) {
            console.log("Detected distinct legacy fake-minted card. Destroying...");
            localStorage.removeItem("userProfile");
            // Reset to empty
            setProfile({
              name: "",
              bio: "",
              role: "creator",
              profilePicUrl: "",
              links: [],
              isPublished: false,
              txHash: ""
            });
            return;
          }

          // Otherwise, it's just a draft (never clicked mint). Keep it.
          setProfile(parsed);

        } catch (e) {
          console.error("Failed to parse profile from local storage", e);
          localStorage.removeItem("userProfile");
        }
      }
    }
  }, [hasCard, cardData, isCardLoading, isProfileLoading]);


  // Construct dynamic share URL with embedded data (since we have no backend)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const identifier = address || "profile";
      const baseUrl = `${window.location.origin}/${identifier}`;

      // Embed simple data in URL to survive browser transitions
      const params = new URLSearchParams();
      if (profile.name) params.set("name", profile.name);
      if (profile.bio) params.set("bio", profile.bio);
      if (profile.role) params.set("role", profile.role);
      if (profile.txHash) params.set("txHash", profile.txHash); // Persist Hash
      if (profile.links && profile.links.length > 0) {
        params.set("links", JSON.stringify(profile.links));
      }

      setShareUrl(`${baseUrl}?${params.toString()}`);
    }
  }, [address, profile.name, profile.bio, profile.links, profile.role, profile.txHash]);

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);


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

  // Deep Link for Mobile/QR (Forces open in Wallet App)
  const deepLink = shareUrl
    ? `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(shareUrl)}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(deepLink || window.location.href);
    alert("Deep link copied! Share this to open directly in the App.");
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
              value={deepLink || (typeof window !== "undefined" ? window.location.href : "https://base.org")}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="H"
            />
          </div>
          <p className={styles.shareText}>Scan to open in Base App</p>

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
          {/* Role Switcher */}
          <div className={styles.roleSwitcher}>
            <button
              className={`${styles.roleOption} ${profile.role === 'creator' ? styles.roleActive : ''}`}
              onClick={() => setProfile({ ...profile, role: 'creator' })}
            >
              CREATOR
            </button>
            <button
              className={`${styles.roleOption} ${profile.role === 'business' ? styles.roleActiveGold : ''}`}
              onClick={() => setProfile({ ...profile, role: 'business' })}
            >
              BUSINESS
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>PROFILE PICTURE</label>
            {/* File Upload Logic */}
            <input
              type="file"
              accept="image/*"
              className={styles.input}
              style={{ paddingTop: '0.8rem' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    // Automatic Image Compression
                    const compressImage = (file: File): Promise<string> => {
                      return new Promise((resolve, reject) => {
                        const img = document.createElement('img');
                        const reader = new FileReader();
                        reader.onload = (e) => { img.src = e.target?.result as string; };
                        reader.onerror = reject;

                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          let width = img.width;
                          let height = img.height;
                          const MAX_SIZE = 800; // Resize to max 800px to save space

                          if (width > height) {
                            if (width > MAX_SIZE) {
                              height *= MAX_SIZE / width;
                              width = MAX_SIZE;
                            }
                          } else {
                            if (height > MAX_SIZE) {
                              width *= MAX_SIZE / height;
                              height = MAX_SIZE;
                            }
                          }

                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            // Compress to JPEG at 70% quality
                            resolve(canvas.toDataURL('image/jpeg', 0.7));
                          } else {
                            reject(new Error("Canvas context failed"));
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    };

                    const compressedBase64 = await compressImage(file);
                    setProfile({ ...profile, profilePicUrl: compressedBase64 });

                  } catch (error) {
                    console.error("Image compression failed", error);
                    alert("Failed to process image. Please try another one.");
                  }
                }
              }}
            />
            {profile.profilePicUrl && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#0052FF', cursor: 'pointer' }} onClick={() => setProfile({ ...profile, profilePicUrl: '' })}>
                Remove Image
              </div>
            )}
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

          <button className={styles.button} onClick={() => setShowPublishModal(true)}>
            REVIEW & SAVE
          </button>
        </div>

        {/* PULISHING / VERIFICATION MODAL */}
        {showPublishModal && (
          <div className={styles.shareOverlay}>
            <motion.div
              className={styles.shareModal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {/* Header Icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '60px', height: '60px',
                  background: '#0052FF',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(0, 82, 255, 0.4)'
                }}>
                  <Image src="/base-logo.svg" alt="Base" width={32} height={32} />
                </div>
              </div>

              <h2 className={styles.shareTitle} style={{ fontSize: '1.8rem', letterSpacing: '-1px' }}>
                {(hasCard) ? "UPDATE IDENTITY" : "VERIFY IDENTITY"}
              </h2>

              <p className={styles.shareText} style={{ marginBottom: '2rem', lineHeight: '1.5', opacity: 0.8 }}>
                {(hasCard)
                  ? "Your identity is minted onchain. Save updates for a small fee."
                  : "Mint your profile to the Base Network. This is a one-time fee for lifetime proof and global visibility."
                }
              </p>

              <div style={{ display: 'grid', gap: '16px' }}>

                {/* 1. MINT / UPDATE BUTTON */}
                {(hasCard) ? (
                  // UPDATE FLOW
                  <EditButton
                    profile={profile}
                    onUpdateSuccess={(txHash) => {
                      const updatedProfile = {
                        ...profile,
                        txHash: txHash
                      };
                      setProfile(updatedProfile);
                      // Optimistic update
                      localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
                      setIsEditing(false);
                      setShowPublishModal(false);
                      alert("Success! Your identity update is onchain.");
                    }}
                  />
                ) : (
                  <div style={{ position: 'relative' }}>
                    {/* One Time Badge */}
                    <div style={{
                      position: 'absolute', top: '-10px', right: '-5px',
                      background: '#FFD700', color: 'black',
                      fontSize: '0.6rem', fontWeight: 800,
                      padding: '2px 6px', borderRadius: '4px',
                      zIndex: 10, transform: 'rotate(5deg)'
                    }}>
                      ONE-TIME FEE
                    </div>
                    <MintButton
                      profile={profile}
                      onMintSuccess={(txHash) => {
                        const updatedProfile = {
                          ...profile,
                          isPublished: true,
                          txHash: txHash
                        };
                        setProfile(updatedProfile);
                        // Optimistic update logic
                        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

                        setIsEditing(false);
                        setShowPublishModal(false);
                        alert("Success! You are now Verified on Base.");
                      }}
                    />
                  </div>
                )}

                {/* 2. SECONDARY ACTION */}
                {!(profile.isPublished || profile.txHash) && (
                  <button
                    className={styles.secondaryButton}
                    style={{ border: 'none', fontSize: '0.9rem', opacity: 0.6 }}
                    onClick={() => {
                      localStorage.setItem("userProfile", JSON.stringify(profile));
                      setIsEditing(false);
                      setShowPublishModal(false);
                      alert("Saved locally. Only visible to you.");
                    }}
                  >
                    Save as Draft (Private)
                  </button>
                )}
              </div>

              <button style={{ marginTop: '1.5rem', background: 'transparent', border: 'none', color: '#666', fontSize: '0.9rem' }} onClick={() => setShowPublishModal(false)}>
                Cancel
              </button>

            </motion.div>
          </div>
        )}

      </motion.div>
    );
  }

  // Deterministic Variant Logic
  const getCardVariant = (addr: string | undefined) => {
    if (!addr) return "variantClassic";
    // Simple hash: sum of char codes
    const sum = addr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variants = ["variantClassic", "variantAurora", "variantMidnight", "variantDot", "variantBlue"];
    return variants[sum % variants.length];
  };

  // Determine Variant: Gold for Business, else deterministic
  const baseVariant = getCardVariant(address);
  const finalVariant = profile.role === 'business' ? 'variantGold' : baseVariant;

  // Calculate Score (Deterministic based on address length/hash for now)
  const score = address ? (address.length * 12) + 350 : 100;

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h1 className={styles.title}>MY IDENTITY<span className={styles.dot}>.</span></motion.h1>

      {/* 1. Identity Card */}
      <motion.div
        className={styles.cardContainer}
        style={{ rotateX, rotateY, z: 100 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`${styles.businessCard} ${styles[finalVariant]}`}>
          {/* Points Badge */}
          <div className={styles.pointsBadge}>
            <span style={{ color: profile.role === 'business' ? '#FFD700' : '#0052FF' }}>💎</span>
            {score}
          </div>

          <div className={styles.cardAccent}></div>

          <div className={styles.cardHeader}>
            {/* Back Button */}
            <button
              className={styles.backButton}
              onClick={() => window.history.back()}
              aria-label="Go Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className={styles.chip}></div>

              {/* Base Logo (Clickable if Minted) */}
              {(hasCard || profile.txHash) ? (
                <a
                  href={`https://sepolia.basescan.org/tx/${profile.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.baseLogo}
                  style={{ textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="View Transaction on Basescan"
                >
                  <Image src="/base-logo.svg" alt="Base" width={24} height={24} />
                  Verified <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>↗</span>
                </a>
              ) : (
                <div className={styles.baseLogo}>
                  <Image src="/base-logo.svg" alt="Base" width={24} height={24} />
                  Base
                </div>
              )}

              {/* Role Badge */}
              <div className={`${styles.roleBadge} ${profile.role === 'business' ? styles.badgeHiring : styles.badgeTalent}`}>
                {profile.role}
              </div>
            </div>
          </div>

          <div className={styles.cardBody}>
            {profile.profilePicUrl ? (
              <Image src={profile.profilePicUrl} alt="Profile" width={70} height={70} className={styles.cardProfilePic} />
            ) : (
              <div className={styles.cardProfilePlaceholder}>{profile.name ? profile.name.charAt(0).toUpperCase() : (address ? address.slice(0, 2) : "U")}</div>
            )}
            <div className={styles.cardInfo}>
              <h2 className={styles.cardName}>{profile.name || "Identity"}</h2>
              <p className={styles.cardBio}>{profile.bio || "Building on Base"}</p>
            </div>
          </div>

          <div className={styles.cardFooter}>
            <div className={styles.cardQr}>
              <QRCodeSVG
                value={deepLink || (typeof window !== "undefined" ? window.location.href : "https://base.org")}
                size={40}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
              />
            </div>
            {profile.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                {link.title || "Link"} ↗
              </a>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 2. Share / Edit Actions / Nearby Events */}
      <div className={styles.actionButtons}>

        {/* PRIMARY ACTION */}
        {!hasCard ? (
          <button
            className={styles.button}
            style={{
              background: 'linear-gradient(90deg, #0052FF 0%, #4c2a9c 100%)',
              fontWeight: 'bold',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
            onClick={() => setIsEditing(true)}
          >
            MINT ONCHAIN ID ➝
          </button>
        ) : (
          <button className={styles.button} onClick={() => setIsEditing(true)}>
            EDIT ONCHAIN CARD
          </button>
        )}

        {/* Share Post on Warpcast */}
        <button
          className={styles.secondaryButton}
          onClick={() => {
            const text = encodeURIComponent(`Check out my Onchain Identity! 🟦 I am a ${profile.role.toUpperCase()} on Base.`);
            const url = encodeURIComponent(shareUrl || window.location.href);
            const warpcastUrl = `https://warpcast.com/~/compose?text=${text}&embeds[]=${url}`;
            window.open(warpcastUrl, '_blank');
          }}
        >
          SHARE / POST
        </button>

      </div>

    </motion.div>
  );
}
