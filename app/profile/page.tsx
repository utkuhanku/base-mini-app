'use client';

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useReadContract } from "wagmi";
import { parseAbi } from "viem";
import imageCompression from 'browser-image-compression';

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
  const [showScore, setShowScore] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contract Read
  const { data: cardTokenId } = useReadContract({
    address: CARD_SBT_ADDRESS as `0x${string}`,
    abi: parseAbi(["function cardOf(address owner) view returns (uint256)"]),
    functionName: "cardOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address }
  });

  // Load / Init
  useEffect(() => {
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
    setManifest(getRandomManifest());
  }, []);

  // Update Logic
  const updateProfile = (field: keyof Profile, value: any) => {
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
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
  const captureAndShare = async (platform: 'native' | 'twitter') => {
    if (platform === 'twitter') {
      const baseUrl = window.location.origin;
      const params = new URLSearchParams();
      if (profile.name) params.set('name', profile.name);
      if (profile.role) params.set('role', profile.role);

      const appUrl = `${baseUrl}?${params.toString()}`;
      const text = encodeURIComponent(`Verifying my onchain identity on @base\n\n${appUrl}`);
      // Using x.com ensures better handling on mobile devices and avoids lagacy redirects
      window.open(`https://x.com/intent/tweet?text=${text}`, '_blank');
    }
  };

  // Strict Edit Guard
  const handleCancelEdit = () => {
    const isDirty = JSON.stringify(profile) !== JSON.stringify(initialProfile);
    if (isDirty) {
      if (confirm("You have unsaved changes. Discard them?")) {
        setProfile(initialProfile);
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleSaveSuccess = (hash: string) => {
    setInitialProfile(profile);
    setIsEditing(false);
    if (!cardTokenId) setShowPublishModal(true);
    else alert("Profile Updated Successfully!");
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

      {/* --- HEADER ACTIONS (Minimal) --- */}
      {/* Moved generic actions to flow naturally. Top should be identity focus. */}

      {/* TOGGLE: Creator vs Business */}
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

      {/* --- BLUE IDENTITY CARD (V2) --- */}
      <div id="base-card-capture" className={profile.role === 'business' ? styles.identityCardBusiness : styles.identityCard}>
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
      </div>

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
            {cardTokenId ? (
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
              Edit Profile
            </button>
            <button
              onClick={() => captureAndShare('twitter')}
              style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}
            >
              Post on X
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
              <div style={{ fontSize: '24px' }}>⚙️</div>
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
          </div>
        )}
      </div>

    </div>
  );
}
