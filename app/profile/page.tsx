'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
    role: "creator",
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

  const addLink = () => {
    const newLinks = [...profile.links, { label: "", url: "" }];
    updateProfile("links", newLinks);
  };

  const updateLink = (index: number, field: "label" | "url", value: string) => {
    const newLinks = [...profile.links];
    newLinks[index][field] = value;
    updateProfile("links", newLinks);
  };

  const removeLink = (index: number) => {
    const newLinks = profile.links.filter((_, i) => i !== index);
    updateProfile("links", newLinks);
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
      // Construct Dynamic URL
      const params = new URLSearchParams();
      if (profile.name) params.set('name', profile.name);
      if (profile.role) params.set('role', profile.role);

      const appUrl = `${baseUrl}?${params.toString()}`;
      const text = encodeURIComponent(`Verifying my onchain identity on @base.\n\n${appUrl}`);
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
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

      {showScore && address && <ScoreView address={address} onClose={() => setShowScore(false)} />}

      {!showScore && (
        <div className={styles.topActions}>
          <button
            onClick={() => setShowScore(true)}
            className={styles.scoreButton}
          >
            <div className={styles.scoreDot} />
            CHECK SCORE
          </button>
          <button
            className={styles.helpButton}
            onClick={() => address ? captureAndShare('twitter') : alert("Connect Wallet")}
          >
            SHARE
          </button>
        </div>
      )}

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

      {/* CARD */}
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

      {/* FORM */}
      {isEditing ? (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className={styles.proFormContainer}>
          <div className={styles.formSection}>
            <div className={styles.sectionTitle}>CORE IDENTITY</div>
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
            <div className={styles.sectionTitle}>SOCIAL SIGNAL</div>
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

          <button onClick={() => fileInputRef.current?.click()} className={styles.uploadBtn}>Tap to Change Photo</button>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className={styles.cancelButton} onClick={handleCancelEdit}>CANCEL</button>
            {cardTokenId ? (
              <EditButton profile={profile} onUpdateSuccess={handleSaveSuccess} />
            ) : (
              <MintButton profile={profile} onMintSuccess={handleSaveSuccess} />
            )}
          </div>
        </motion.div>
      ) : (
        <div className={styles.actionsContainer}>
          <button onClick={() => setIsEditing(true)} className={styles.editButton}>EDIT PROFILE</button>
          <button onClick={() => captureAndShare('twitter')} className={styles.shareButton}>POST ON X</button>
        </div>
      )
      }
    </div>
  );
}
