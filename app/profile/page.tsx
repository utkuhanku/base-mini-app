'use client';

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useReadContract } from "wagmi";
import { parseAbi } from "viem";
import imageCompression from 'browser-image-compression';

import { useSearchParams } from "next/navigation";

import MintButton from "./MintButton";
import EditButton from "./EditButton";
import ScoreView from "./ScoreView";
import styles from "./profile.module.css";
import { getRandomManifest } from "../../utils/manifests";

const CARD_SBT_ADDRESS = process.env.NEXT_PUBLIC_CARD_SBT_ADDRESS || "0x4003055676749a0433EA698A8B70E45d398FC87f";



interface Profile {
  name: string;
  bio: string;
  role: string;
  profilePicUrl: string;
  roleTitle?: string;
  twitter?: string;
  website?: string;
  links: { label: string; url: string }[];
}

export default function ProfilePage() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const shouldCreate = searchParams.get('create');

  // Initial State
  const initialProfileState: Profile = {
    name: "",
    bio: "",
    role: "creator", // Default role
    profilePicUrl: "",
    roleTitle: "",
    twitter: "",
    website: "",
    links: [],
  };

  const [profile, setProfile] = useState<Profile>(initialProfileState);
  const [initialProfile, setInitialProfile] = useState<Profile>(initialProfileState);

  const [manifest, setManifest] = useState("BUILD ON BASE");
  const [isEditing, setIsEditing] = useState(false);

  // Auto-open Edit Mode if create param is present
  useEffect(() => {
    if (shouldCreate === 'true') {
      setIsEditing(true);
    }
  }, [shouldCreate]);

  const [showScore, setShowScore] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contract Read
  // Contract Read: Card ID
  const { data: cardTokenId } = useReadContract({
    address: CARD_SBT_ADDRESS as `0x${string}`,
    abi: parseAbi(["function cardOf(address owner) view returns (uint256)"]),
    functionName: "cardOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });

  // Contract Read: Card Data (Auto-Populate)
  const { data: cardData, refetch: refetchCardData } = useReadContract({
    address: CARD_SBT_ADDRESS as `0x${string}`,
    abi: parseAbi([
      "struct Profile { string displayName; string avatarUrl; string bio; string socials; string websites; }",
      "function getCard(uint256 tokenId) view returns (Profile memory)"
    ]),
    functionName: "getCard",
    args: cardTokenId ? [cardTokenId] : undefined,
    query: {
      enabled: !!cardTokenId && Number(cardTokenId) > 0
    }
  });

  // Explicit loading state for card check
  const isCheckingCard = address && cardTokenId === undefined;

  // Load / Init (Prioritize Chain Data, then LocalStorage)
  useEffect(() => {
    if (cardData) {
      // If we have chain data, USE IT. This kills "Anon".
      const chainProfile = {
        ...initialProfileState,
        name: cardData.displayName || "",
        bio: cardData.bio || "",
        profilePicUrl: cardData.avatarUrl || "",
        // Parse other fields if needed, simplified for now
      };
      // Only merge if local state is empty/default to avoid overwriting unsaved work?
      // No, if the user loads the page, chain data is truth.
      setProfile(prev => ({
        ...prev,
        name: cardData.displayName || prev.name,
        bio: cardData.bio || prev.bio,
        profilePicUrl: cardData.avatarUrl || prev.profilePicUrl
      }));
      setInitialProfile(prev => ({
        ...prev,
        name: cardData.displayName || prev.name,
        bio: cardData.bio || prev.bio,
        profilePicUrl: cardData.avatarUrl || prev.profilePicUrl
      }));
    } else {
      // Fallback to local storage if no chain data yet
      const saved = localStorage.getItem("userProfile");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          setInitialProfile(parsed);
        } catch (e) {
          console.error("Failed to parse profile", e);
        }
      }
    }
    setManifest(getRandomManifest());
  }, [cardData]); // Dependency on cardData ensures it updates when fetch completes

  // Update Logic (State Only)
  const updateProfile = (field: keyof Profile, value: any) => {
    // STRICT EDIT: We do NOT save to localStorage here. 
    // We only update the component state.
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);
  };

  // Image Upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        updateProfile('profilePicUrl', reader.result as string);
      };
    } catch (error) {
      console.error("Image error:", error);
      alert("Failed to process image.");
    }
  };

  // Sharing
  const captureAndShare = async () => {
    // Check if user has a card
    if (!cardTokenId || cardTokenId === BigInt(0)) {
      setShowPublishModal(true);
      return;
    }

    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    // We can pass current profile state to ensure the OG is fresh even if not fully indexed yet (though dynamic route mostly relies on onchain data, passing params helps the OG route if used directly)
    // However, for the public profile route /profile/[address], it fetches from chain.
    // Let's rely on the public profile link which is cleaner: /profile/0x...

    // Actually, dynamic OG generation usually takes query params. 
    // Let's use the main route with params for now as implemented before to ensure visual consistency with local state if needed, 
    // OR pointer to /profile/[address] if that's preferred.
    // The previous implementation used baseUrl + params. Let's stick to that for reliability or switch to /profile/[address] if we want to rely on the new page.
    // Given the new public profile page exists, linking to THAT is better for "Base App" feel.
    // But the OG image generation currently lives on the main page structure or API? 
    // The previous code constructed `appUrl` with query params. I will maintain that pattern for safety, but point to the public profile if possible.

    // Let's stick to the previous robust pattern but separate the URL construction.
    if (profile.name) params.set('name', profile.name);
    if (profile.role) params.set('role', profile.role);

    // We want the embed to be the USER'S PROFILE.
    // If we have a public profile route, let's use it.
    const publicProfileUrl = address ? `${baseUrl}/profile/${address}` : baseUrl;

    const text = encodeURIComponent(`Verifying my onchain identity on @base`);
    const embedUrl = encodeURIComponent(publicProfileUrl);

    // Warpcast Intent
    window.open(`https://warpcast.com/~/compose?text=${text}&embeds[]=${embedUrl}`, '_blank');
  };

  // Strict Edit Guard
  const handleCancelEdit = () => {
    const isDirty = JSON.stringify(profile) !== JSON.stringify(initialProfile);
    if (isDirty) {
      if (confirm("You have unsaved changes. Discard them?")) {
        // Revert to initial state (last saved state)
        setProfile(initialProfile);
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleSaveSuccess = (hash: string) => {
    // STRICT EDIT: Only NOW do we persist to localStorage
    localStorage.setItem("userProfile", JSON.stringify(profile));
    setInitialProfile(profile);

    setIsEditing(false);
    if (!cardTokenId) setShowPublishModal(true);
    else alert("Profile Updated Successfully on-chain!");
  };

  return (
    <div className={styles.container}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Entry Animation Container */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* --- HEADER ACTIONS (Minimal) --- */}
        {/* Moved generic actions to flow naturally. Top should be identity focus. */}

        {/* TOGGLE: Creator vs Business (Only visible if Editing) */}
        {isEditing && (
          <div className={styles.cardToggleContainer}>
            <button
              className={profile.role === 'creator' ? styles.cardToggleBtnActive : styles.cardToggleBtn}
              onClick={() => updateProfile('role', 'creator')}
            >
              CREATOR
            </button>
            <button
              className={profile.role === 'business' ? styles.cardToggleBtnActive : styles.cardToggleBtn}
              onClick={() => updateProfile('role', 'business')}
            >
              BUSINESS
            </button>
          </div>
        )}

        {/* --- BLUE IDENTITY CARD (V2) or GHOST --- */}
        {!cardTokenId && !isCheckingCard ? (
          <motion.div
            className={styles.identityCardGhost}
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
            variants={{
              hidden: { y: 20, opacity: 0, rotateX: -10 },
              visible: { y: 0, opacity: 1, rotateX: 0, transition: { type: 'spring', stiffness: 50 } }
            }}
            whileHover={{ scale: 1.02, rotateX: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={styles.manifestOverlay}><div className={styles.manifestText}>{manifest}</div></div>
            <div className={styles.ghostContent}>
              <div className={styles.ghostIcon}>
                {/* BASE LOGO SVG */}
                <svg width="48" height="48" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="55" cy="55" r="55" fill="#0052FF" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M53.1502 20.3061C53.6442 19.3496 55.0213 19.3496 55.5152 20.3061L67.5029 43.518C67.7337 43.965 68.1979 44.233 68.7001 44.2095L94.7797 42.9897C95.8542 42.9395 96.5428 44.0041 96.0046 44.8931L82.9416 66.4716C82.6899 66.8872 82.6899 67.4093 82.9416 67.8249L96.0046 89.4034C96.5428 90.2924 95.8542 91.357 94.7797 91.3067L68.7001 90.087C68.1979 90.0634 67.7337 90.3314 67.5029 90.7784L55.5152 113.99C55.0213 114.947 53.6442 114.947 53.1502 113.99L41.1625 90.7784C40.9317 90.3314 40.4675 90.0634 39.9654 90.087L13.8858 91.3067C12.8113 91.357 12.1227 90.2924 12.6609 89.4034L25.7238 67.8249C25.9755 67.4093 25.9755 66.8872 25.7238 66.4716L12.6609 44.8931C12.1227 44.0041 12.8113 42.9395 13.8858 42.9897L39.9654 44.2095C40.4675 44.233 40.9317 43.965 41.1625 43.518L53.1502 20.3061Z" fill="white" fillOpacity="0.01" />
                  <path d="M55 22L66 43.2H44L55 22Z" fill="white" />
                  <circle cx="55" cy="55" r="14" fill="white" />
                </svg>
              </div>
              <div className={styles.ghostTitle}>Identity Unclaimed</div>
              <div className={styles.ghostSubtitle}>Mint your on-chain identity to start building your reputation on Base.</div>
              <div className={styles.ghostAction}>TAP TO CREATE</div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            id="base-card-capture"
            className={profile.role === 'business' ? styles.identityCardBusiness : styles.identityCard}
            variants={{
              hidden: { y: 20, opacity: 0, rotateX: -10 },
              visible: { y: 0, opacity: 1, rotateX: 0, transition: { type: 'spring', stiffness: 50 } }
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={styles.manifestOverlay}><div className={styles.manifestText}>{manifest}</div></div>

            <div className={styles.cardHeader}>
              <div className={styles.cardChip} />
              <div className={styles.verifiedBadge}><div className={styles.verifiedDot} />Verified ↗</div>
              <div className={styles.pointsPill}><span>💎</span> 854</div>
            </div>

            <div className={styles.cardBody}>
              <div
                className={styles.cardAvatarContainer}
                onClick={() => isEditing && fileInputRef.current?.click()}
                style={{ cursor: isEditing ? 'pointer' : 'default', position: 'relative' }}
              >
                {profile.profilePicUrl ? (
                  <img src={profile.profilePicUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#ccc' }} />
                )}
                {isEditing && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>📷</div>
                )}
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardName}>{profile.name || "Anon"}</div>
                <div className={styles.cardBio}>{profile.roleTitle || profile.role || "Builder"}</div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              {profile.twitter && <a href={profile.twitter} target="_blank" className={styles.socialPill}>TWITTER / X ↗</a>}
              {profile.website && <a href={profile.website} target="_blank" className={styles.socialPill}>WEBSITE ↗</a>}
              {!profile.twitter && !profile.website && <span style={{ fontSize: 9, opacity: 0.5, fontStyle: 'italic' }}>@base.eth</span>}
            </div>

            <div className={styles.qrCodeMini}>
              <QRCodeSVG value={`https://base.org?user=${address}`} size={32} bgColor="white" fgColor="black" />
            </div>
          </motion.div>
        )}
        {/* --- ACTION AREA (Edit / Share) --- */}
        {isEditing ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className={styles.proFormContainer}>
            <div className={styles.formSection}>
              <div className={styles.formSectionTitle}>CORE IDENTITY</div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>DISPLAY NAME</span>
                <input className={styles.input} placeholder="e.g. Satoshi" value={profile.name} onChange={(e) => updateProfile("name", e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>BIO</span>
                <textarea className={styles.textarea} placeholder="Manifesto..." value={profile.bio} onChange={(e) => updateProfile("bio", e.target.value)} />
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formSectionTitle}>SOCIAL SIGNAL</div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>ROLE TITLE</span>
                <input className={styles.input} placeholder="e.g. Designer" value={profile.roleTitle || ''} onChange={(e) => updateProfile("roleTitle", e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>X (TWITTER)</span>
                <input className={styles.input} placeholder="https://x.com/..." value={profile.twitter || ''} onChange={(e) => updateProfile("twitter", e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>WEBSITE</span>
                <input className={styles.input} placeholder="https://..." value={profile.website || ''} onChange={(e) => updateProfile("website", e.target.value)} />
              </div>
            </div>

            <button onClick={() => fileInputRef.current?.click()} className={styles.uploadBtn} style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px dashed #444', color: '#888', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Tap to Change Photo
            </button>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button className={styles.cancelButton} onClick={handleCancelEdit} style={{ flex: 1, padding: '16px', background: 'rgba(255,59,48,0.15)', border: 'none', borderRadius: '16px', color: '#ff3b30', fontWeight: 700 }}>
                CANCEL
              </button>
              {isCheckingCard ? (
                <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                  CHECKING STATUS...
                </div>
              ) : cardTokenId ? (
                <EditButton profile={profile} onUpdateSuccess={handleSaveSuccess} />
              ) : (
                <MintButton profile={profile} onMintSuccess={handleSaveSuccess} />
              )}
            </div>
          </motion.div>
        ) : (
          <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsEditing(true)}
                style={{ flex: 1, padding: '16px', background: 'white', border: 'none', borderRadius: '16px', color: 'black', fontWeight: 800, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}
              >
                {cardTokenId ? "EDIT PROFILE" : "CREATE IDENTITY"}
              </button>
              <button
                onClick={() => captureAndShare()}
                style={{ flex: 1, padding: '16px', background: 'rgba(0, 82, 255, 0.2)', borderRadius: '16px', border: '1px solid rgba(0, 82, 255, 0.2)', color: '#0052FF', fontWeight: 800, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}
              >
                CAST ON BASE APP
              </button>
            </div>
          </div>
        )
        }

        {/* --- MEMORIES & EVENTS --- */}
        <div className={styles.sectionContainer}>
          {/* Memories */}
          <div>
            <div className={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Minted Memories</span>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '10px',
                    padding: '4px 8px',
                    zIndex: 50,
                    position: 'relative'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHelp('memories');
                  }}
                >
                  ?
                </button>
              </div>
              <span style={{ opacity: 0.5, fontSize: '12px' }}>0</span>
            </div>
            <div className={styles.memoriesScroll}>
              <div className={styles.memoryCard} style={{ width: '100%', maxWidth: 'none', flexDirection: 'row', gap: '16px', alignItems: 'center', justifyContent: 'flex-start', padding: '0 16px', height: '80px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Memory NFT's</div>
                  <div style={{ fontSize: '10px', opacity: 0.5 }}>Connect with friends</div>
                </div>
              </div>
            </div>
          </div>

          {/* Events */}
          <div>
            <div className={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Events</span>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '10px',
                    padding: '4px 8px',
                    zIndex: 50,
                    position: 'relative'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHelp('events');
                  }}
                >
                  ?
                </button>
              </div>
              <span style={{ opacity: 0.5, fontSize: '12px' }}>0</span>
            </div>
            <div className={styles.eventsList}>
              <div className={styles.eventItem} style={{ borderStyle: 'dashed', opacity: 0.6 }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#888', fontWeight: 700, marginBottom: '4px' }}>UPCOMING</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>POAP Integration</div>
                </div>
                <div style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>SOON</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- ANALYTICS (CHECK SCORE) --- */}
        <div className={styles.basePostSection} style={{ borderTop: 'none', marginTop: '40px', paddingTop: '0' }}>
          <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', marginBottom: '32px' }} />

          {showScore && address ? (
            <ScoreView address={address} onClose={() => setShowScore(false)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#666' }}>
                Onchain Analytics
              </div>
              <button
                onClick={() => setShowScore(true)}
                style={{
                  background: 'linear-gradient(145deg, #111 0%, #000 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '24px',
                  width: '100%',
                  maxWidth: '420px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0052FF 0%, #001040 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    📊
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: '14px', letterSpacing: '0.5px' }}>CHECK SCORE</div>
                    <div style={{ color: '#666', fontSize: '11px' }}>Analyze wallet activity & reputation</div>
                  </div>
                </div>
                <div style={{ color: '#444' }}>→</div>
              </button>
              {/* --- MODALS --- */}
              <AnimatePresence>
                {/* Help Modal */}
                {activeHelp && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'fixed', inset: 0, zIndex: 9999,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(5px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
                    }}
                    onClick={() => setActiveHelp(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      style={{
                        background: '#111', border: '1px solid #333', borderRadius: '16px', padding: '24px', maxWidth: '320px', width: '100%', textAlign: 'center'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '16px' }}>
                        {activeHelp === 'memories' ? '🧩' : '🎫'}
                      </div>
                      <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>
                        {activeHelp === 'memories' ? 'Minted Memories' : 'Events'}
                      </h3>
                      <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5' }}>
                        {activeHelp === 'memories'
                          ? "Collect on-chain memories with people you meet in real life. Scan their code to mint a 'Handshake' NFT."
                          : "Your history of attendance at Base events, hackathons, and gatherings. Proof of showing up."}
                      </p>
                      <button
                        onClick={() => setActiveHelp(null)}
                        style={{ marginTop: '20px', padding: '12px 24px', background: '#333', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Got it
                      </button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Mint Required Prompt (showPublishModal) */}
                {showPublishModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'fixed', inset: 0, zIndex: 10000,
                      background: 'rgba(0,0,0,0.9)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
                    }}
                  >
                    <div style={{
                      background: '#0F1115', border: '1px solid #333', borderRadius: '24px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px'
                    }}>
                      <div style={{ fontSize: '40px' }}>🔐</div>
                      <h2 style={{ color: 'white', margin: 0 }}>Mint Required</h2>
                      <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5' }}>
                        You must mint your Identity Card to share it on X.
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button
                          onClick={() => setShowPublishModal(false)}
                          style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #333', borderRadius: '12px', color: '#888', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setShowPublishModal(false);
                            setIsEditing(true); // Open edit/mint mode
                            // Scroll to top if needed, or simply let them click Mint
                          }}
                          style={{ flex: 1, padding: '14px', background: '#0052FF', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                        >
                          MINT NOW
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}
        </div>



      </motion.div>
    </div>
  );
}
