"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useAccount } from "wagmi";
import styles from "./profile.module.css";

// const CONTRACT_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
// const ABI = ...

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
}

export default function ProfilePage() {
  const { context } = useMiniKit();
  const { address } = useAccount(); // Get connected wallet address
  const [profile, setProfile] = useState<Profile>({
    name: "",
    bio: "",
    role: "creator", // Default
    profilePicUrl: "",
    links: [],
    isPublished: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false); // New Modal state
  const [shareUrl, setShareUrl] = useState("");

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
      if (profile.links && profile.links.length > 0) {
        params.set("links", JSON.stringify(profile.links));
      }

      setShareUrl(`${baseUrl}?${params.toString()}`);
    }
  }, [address, profile.name, profile.bio, profile.links]);

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

        {/* PUBLISH MODAL */}
        {showPublishModal && (
          <div className={styles.shareOverlay}>
            <div className={styles.shareModal}>
              <h2 className={styles.shareTitle}>PUBLISH IDENTITY</h2>
              <p className={styles.shareText} style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                How would you like to save your identity?
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  className={styles.button}
                  style={{ background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)', color: 'black' }}
                  onClick={() => {
                    // Simulate Onchain Mint
                    const updatedProfile = { ...profile, isPublished: true };
                    setProfile(updatedProfile);
                    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
                    setIsEditing(false);
                    setShowPublishModal(false);
                    alert("Success! Identity Minted & Published to Global Feed (Simulated).");
                  }}
                >
                  <span style={{ display: 'block', fontWeight: 800 }}>MINT ONCHAIN (0.0002 ETH)</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Visible to everyone • Global Feed • Verified</span>
                </button>

                <button
                  className={styles.secondaryButton}
                  onClick={() => {
                    // Local Save
                    localStorage.setItem("userProfile", JSON.stringify(profile));
                    setIsEditing(false);
                    setShowPublishModal(false);
                    alert("Saved locally. Only visible to you.");
                  }}
                >
                  SAVE PRIVATELY (FREE)
                </button>
              </div>
              <button style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: '#666' }} onClick={() => setShowPublishModal(false)}>Cancel</button>

            </div>
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
              <div className={styles.baseLogo}>
                <Image src="/base-logo.svg" alt="Base" width={24} height={24} />
                Base
              </div>
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
        {/* New: Share Post on Warpcast */}
        <button
          className={styles.button}
          style={{ background: '#4c2a9c', border: 'none' }} // Warpcast Purple
          onClick={() => {
            const text = encodeURIComponent(`Check out my Onchain Identity! 🟦 I am a ${profile.role.toUpperCase()} on Base.`);
            const url = encodeURIComponent(shareUrl || window.location.href);
            const warpcastUrl = `https://warpcast.com/~/compose?text=${text}&embeds[]=${url}`;
            window.open(warpcastUrl, '_blank');
          }}
        >
          POST IDENTITY
        </button>

        <button className={styles.button} onClick={() => setIsEditing(true)}>
          EDIT IDENTITY
        </button>

        <button className={styles.secondaryButton} onClick={() => setShowShare(true)}>
          SHARE CARD
        </button>

        <button
          className={styles.nearbyButton}
          onClick={() => alert("Coming Soon!")}
        >
          NEARBY EVENTS (Coming Soon)
        </button>
      </div>

      {/* 3. Minted SBTs (Gallery) */}
      <div className={styles.sectionDivider} />
      <div className={styles.galleryContainer}>
        <h3 className={styles.galleryTitle}>MINTED CONNECTIONS</h3>
        <div className={styles.emptyState}>
          Minting is currently paused. Check back soon.
        </div>
      </div>

      {/* 4. Attended Events */}
      <div className={styles.sectionDivider} />
      <div className={styles.galleryContainer}>
        <h3 className={styles.galleryTitle}>ATTENDED EVENTS</h3>
        <div className={styles.emptyState}>
          No events attended yet.
        </div>
      </div>

      {/* PUBLISH MODAL */}
      {showPublishModal && (
        <div className={styles.shareOverlay}>
          <div className={styles.shareModal}>
            <h2 className={styles.shareTitle}>PUBLISH IDENTITY</h2>
            <p className={styles.shareText} style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
              How would you like to save your identity?
            </p>

            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                className={styles.button}
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)', color: 'black' }}
                onClick={() => {
                  // Simulate Onchain Mint
                  const updatedProfile = { ...profile, isPublished: true };
                  setProfile(updatedProfile);
                  localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
                  setIsEditing(false);
                  setShowPublishModal(false);
                  alert("Success! Identity Minted & Published to Global Feed (Simulated).");
                }}
              >
                <span style={{ display: 'block', fontWeight: 800 }}>MINT ONCHAIN (0.0002 ETH)</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Visible to everyone • Global Feed • Verified</span>
              </button>

              <button
                className={styles.secondaryButton}
                onClick={() => {
                  // Local Save
                  localStorage.setItem("userProfile", JSON.stringify(profile));
                  setIsEditing(false);
                  setShowPublishModal(false);
                  alert("Saved locally. Only visible to you.");
                }}
              >
                SAVE PRIVATELY (FREE)
              </button>
            </div>
            <button style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: '#666' }} onClick={() => setShowPublishModal(false)}>Cancel</button>

          </div>
        </div>
      )}

    </motion.div>
  );
}
