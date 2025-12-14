
'use client';

import Image from "next/image";
import { useState, useEffect } from "react";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import MintButton from "./MintButton";
import EditButton from "./EditButton";
import styles from "./profile.module.css";
import { parseAbi } from "viem";
import ScoreView from "./ScoreView";

import { toBlob } from 'html-to-image';
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
  zoraProfile?: string;
  links: { label: string; url: string }[];
  isPublished?: boolean;
  txHash?: string;
}

export default function ProfilePage() {

  const { address } = useAccount(); // Get connected wallet address
  const [profile, setProfile] = useState<Profile>({
    name: "",
    bio: "",
    role: "creator",
    profilePicUrl: "",
    roleTitle: "",
    twitter: "",
    website: "",
    zoraProfile: "",
    links: [],
    isPublished: false,
    txHash: ""
  });
  // Share / Mint State
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showScore, setShowScore] = useState(false); // New ScoreView State
  const [manifest, setManifest] = useState("BUILD ON BASE");
  const [isEditing, setIsEditing] = useState(false);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  useEffect(() => {
    setManifest(getRandomManifest());
  }, []);

  const [isSharing, setIsSharing] = useState(false);

  // LOGIC: Capture Card & Share
  const captureAndShare = async (platform: 'native' | 'twitter') => {
    setIsSharing(true);
    try {
      const node = document.getElementById('base-card-capture');
      if (!node) throw new Error("Card not found");

      // Filter out elements we don't want in the snapshot if any
      const blob = await toBlob(node, { cacheBust: true, pixelRatio: 2 });
      if (!blob) throw new Error("Failed to generate image");

      const file = new File([blob], 'base-identity.png', { type: 'image/png' });

      if (platform === 'native') {
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Base Identity',
            text: `Verifying my Onchain Signal on @base. \n${shareUrl}`,
            files: [file]
          });
        } else {
          // Fallback: Download
          const link = document.createElement('a');
          link.download = 'base-identity.png';
          link.href = URL.createObjectURL(blob);
          link.click();
          alert("Image downloaded! Share it manually.");
        }
      } else if (platform === 'twitter') {

        // Construct Dynamic Share URL
        // We assume the page itself has meta tags that might be updated, OR we point to a specific share link.
        // Ideally, we want https://myapp.com/profile?name=Utku... so the OG image generator picks it up.
        // Since we are running on localhost or vercel, let's try to construct the URL based on current profile state.

        const baseUrl = window.location.origin; // e.g. https://base-mini-app.vercel.app
        const params = new URLSearchParams();
        if (profile.name) params.set('name', profile.name);
        if (profile.role) params.set('role', profile.role);
        // Note: For production, we need a dedicated /share/[id] page that serverside renders the meta tags.
        // For now, if we use the main page, we rely on the default OG unless we have dynamic routing set up.
        // BUT, since we added app/api/og, we can verify it directly or point the 'url' param to the main app 
        // and hope the main app uses the query params to set the OG image tag? 
        // Actually, Client components can't set server-side Head tags easily without a layout shift.
        // A common trick: Share the link to the APP, but use the OG Service as the 'url' preview? No twitter doesn't work like that.
        // Twitter cares about the meta tags of the page in the 'url' param.

        // TEMPORARY SOLUTION TO MEET USER REQUEST "DIRECT LINK":
        // We will just share the link to the app. 
        // User said: "ve twitter linkine iletelim direkt!"

        const text = encodeURIComponent(`Just minted my Onchain CV on Identity! 🔵\n\nVerifying my signal on @base.\n${shareUrl || window.location.href}\n\n#baseposting #onchain #builder`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');

        // Note: We removed the image download part. The "Card in the post" requirement 
        // implies the link preview (OG Image) will handle the visual.
      }

    } catch (e) {
      console.error("Share failed", e);
      alert("Could not share. Try again.");
    } finally {
      setIsSharing(false);
    }
  };

  // CHECK IF USER HAS A CARD
  const { data: cardTokenId, isLoading: isCardLoading } = useReadContract({
    address: CARD_SBT_ADDRESS as `0x${string}`,
    abi: parseAbi(["function cardOf(address owner) view returns (uint256)"]),
    functionName: "cardOf",
    args: [address as `0x${string}`],
  });

  const { data: cardURI } = useReadContract({
    address: CARD_SBT_ADDRESS as `0x${string}`,
    abi: parseAbi(["function tokenURI(uint256 tokenId) view returns (string)"]),
    functionName: "tokenURI",
    args: cardTokenId ? [cardTokenId] : undefined,
  });

  // Load from chain or local
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }

    if (cardURI) {
      try {
        const jsonBase64 = cardURI.split(",")[1];
        if (jsonBase64) {
          const jsonStr = atob(jsonBase64);
          const metadata = JSON.parse(jsonStr);
          // Parse attributes
          const nameAttr = metadata.attributes?.find((a: any) => a.trait_type === "Name")?.value || "";
          const bioAttr = metadata.attributes?.find((a: any) => a.trait_type === "Bio")?.value || "";
          const roleAttr = metadata.attributes?.find((a: any) => a.trait_type === "Role")?.value || "creator";

          // Extract Socials
          let roleTitle = "";
          let twitter = "";
          let website = "";
          let links = [];

          const socialsAttr = metadata.attributes?.find((a: any) => a.trait_type === "Socials")?.value || "{ }";
          try {
            const socials = JSON.parse(socialsAttr);
            roleTitle = socials.roleTitle || "";
            twitter = socials.twitter || "";
            website = socials.website || "";
            links = socials.links || [];
          } catch (e) { console.log("Socials parse error", e); }

          setProfile({
            name: nameAttr,
            bio: bioAttr,
            role: roleAttr,
            profilePicUrl: metadata.image || "",
            roleTitle,
            twitter,
            website,
            links,
            isPublished: true
          });
        }
      } catch (e) {
        console.error("Failed to parse tokenURI", e);
      }
    } else {
      // Load draft from localStorage
      const saved = localStorage.getItem("baseMiniAppProfile");
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    }
  }, [cardURI]);

  // Save draft
  useEffect(() => {
    localStorage.setItem("baseMiniAppProfile", JSON.stringify(profile));
  }, [profile]);


  // Update handlers
  const updateProfile = (field: keyof Profile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addLink = () => {
    setProfile(prev => ({ ...prev, links: [...prev.links, { label: "", url: "" }] }));
  };

  const updateLink = (index: number, key: "label" | "url", val: string) => {
    const newLinks = [...profile.links];
    newLinks[index] = { ...newLinks[index], [key]: val };
    setProfile(prev => ({ ...prev, links: newLinks }));
  };

  const removeLink = (index: number) => {
    setProfile(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* HEADER ACTIONS */}
      {/* Note: The main Header component handles the Back button and Wallet. 
          We can add profile-specific actions here if needed. */}

      {/* NEW INTRO BANNER (DevRel Style) */}
      <div className={styles.introBanner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ width: '8px', height: '8px', background: '#0052FF', borderRadius: '50%', display: 'inline-block' }}></span>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>BASE_MAINNET_V1</span>
        </div>
        <div className={styles.introTitle}>MY IDENTITY</div>
        <div className={styles.introSubtitleRow}>
          <div className={styles.introSubtitle}>THE ONCHAIN REPUTATION LAYER</div>
          <button
            className={styles.helpIconBtn}
            onClick={() => setActiveHelp('intro')}
          >
            ?
          </button>
        </div>
      </div>

      {/* GLOBAL HELP MODAL */}
      <AnimatePresence>
        {activeHelp && (
          <motion.div
            className={styles.helpModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveHelp(null)}
          >
            <motion.div
              className={styles.helpModalContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {activeHelp === 'intro' && (
                <>
                  <div className={styles.helpModalHeader}>BASE IDENTITY</div>
                  <div className={styles.helpModalText}>
                    Identity is the new currency. Signal is proof of work.
                    <br /><br />
                    Connect to forge your presence in the Superchain.
                    <br /><br />
                    <span style={{ color: '#0052FF' }}>IRL Events</span> + <span style={{ color: '#0052FF' }}>Onchain Actions</span> = <span style={{ color: '#fff' }}>Social Score</span>.
                  </div>
                </>
              )}
              {activeHelp === 'memories' && (
                <>
                  <div className={styles.helpModalHeader}>MINTED MEMORIES</div>
                  <div className={styles.helpModalText}>
                    Your onchain footprint. Every NFT, every verification, every interaction you mint becomes a permanent part of your history.
                    <br /><br />
                    <span style={{ color: '#0052FF' }}>The more you build, the richer your story.</span>
                  </div>
                </>
              )}
              {activeHelp === 'events' && (
                <>
                  <div className={styles.helpModalHeader}>ATTENDED EVENTS</div>
                  <div className={styles.helpModalText}>
                    Proof of Presence. Events you attend in real life (IRL) grant you POAPs and verifiable credentials.
                    <br /><br />
                    <span style={{ color: '#0052FF' }}>Network state is built on real connections.</span>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

        {/* MANIFEST (Background) */}
        <div className={styles.manifestOverlay}>
          <div className={styles.manifestText}>{manifest}</div>
        </div>

        {/* Card Header */}
        <div className={styles.cardHeader}>
          <div className={styles.cardChip} />
          <div className={styles.verifiedBadge}>
            <div className={styles.verifiedDot} />
            Verified <span style={{ fontSize: 10, opacity: 0.5 }}>↗</span>
          </div>
          <div className={styles.pointsPill}>
            <span>💎</span> 854
          </div>
        </div>

        {/* Card Body */}
        <div style={{ marginTop: 'auto', marginBottom: 'auto', zIndex: 10 }}>
          <div className={styles.cardBody}>
            <div className={styles.cardAvatarContainer}>
              {profile.profilePicUrl ? (
                <img src={profile.profilePicUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#ccc' }} />
              )}
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardName}>{profile.name || "Anon"}</div>
              <div className={styles.cardBio}>{profile.roleTitle || profile.role || "Builder"}</div>
            </div>
          </div>
        </div>


        {/* Card Footer (Socials) */}
        <div className={styles.cardFooter}>
          {profile.twitter && (
            <a href={profile.twitter} target="_blank" className={styles.socialPill}>
              TWITTER / X ↗
            </a>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" className={styles.socialPill}>
              WEBSITE ↗
            </a>
          )}
          {!profile.twitter && !profile.website && (
            <span style={{ fontSize: 9, opacity: 0.5, fontStyle: 'italic' }}>
              @base.eth
            </span>
          )}
        </div>

        {/* Mini QR */}
        <div className={styles.qrCodeMini}>
          <QRCodeSVG
            value={`https://base.org?user=${address}`}
            size={32}
            bgColor="white"
            fgColor="black"
          />
        </div>
      </div>


      {/* --- EDIT FORM (GLASS PANELS) --- */}
      {
        isEditing ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className={styles.proFormContainer}
          >
            {/* Identity Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>CORE IDENTITY</div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>DISPLAY NAME</span>
                <input
                  className={styles.input}
                  placeholder="e.g. Satoshi Nakamoto"
                  value={profile.name}
                  onChange={(e) => updateProfile("name", e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>BIO / MANIFESTO</span>
                <textarea
                  className={styles.textarea}
                  placeholder="What are you building?"
                  value={profile.bio}
                  onChange={(e) => updateProfile("bio", e.target.value)}
                />
              </div>
            </div>

            {/* Social Signal Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>SOCIAL SIGNAL</div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>ROLE TITLE</span>
                <input
                  className={styles.input}
                  placeholder="e.g. Lead Dev, NFT Artist"
                  value={profile.roleTitle}
                  onChange={(e) => updateProfile("roleTitle", e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>X (TWITTER) URL</span>
                <input
                  className={styles.input}
                  placeholder="https://x.com/..."
                  value={profile.twitter}
                  onChange={(e) => updateProfile("twitter", e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <span className={styles.label}>WEBSITE / PORTFOLIO</span>
                <input
                  className={styles.input}
                  placeholder="https://..."
                  value={profile.website}
                  onChange={(e) => updateProfile("website", e.target.value)}
                />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.label}>PROFILE PICTURE URL</span>
              <input
                className={styles.input}
                placeholder="https://..."
                value={profile.profilePicUrl}
                onChange={(e) => updateProfile("profilePicUrl", e.target.value)}
              />
            </div>

            {/* Extensions */}
            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>EXTENSIONS ({profile.links.length})</div>
              <div className={styles.linkList}>
                {profile.links.map((link, i) => (
                  <div key={i} className={styles.linkItem}>
                    <input
                      className={styles.input}
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => updateLink(i, "label", e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      className={styles.input}
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateLink(i, "url", e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <button className={styles.removeButton} onClick={() => removeLink(i)}>✕</button>
                  </div>
                ))}
                <button className={styles.addButton} onClick={addLink}>+ ADD EXTENSION</button>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className={styles.cancelButton}
                onClick={() => setIsEditing(false)}
                style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '16px', color: 'white' }}
              >
                CANCEL
              </button>

              {cardTokenId ? (
                <EditButton
                  profile={profile}
                  onUpdateSuccess={(hash) => {
                    console.log("Updated", hash);
                    setIsEditing(false);
                    alert("Profile Updated Successfully!");
                  }}
                />
              ) : (
                <MintButton
                  profile={profile}
                  onMintSuccess={(hash) => {
                    setShowPublishModal(true);
                    setIsEditing(false);
                  }}
                />
              )}
            </div>

          </motion.div>
        ) : (
          <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Primary Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsEditing(true)}
                style={{ flex: 1, padding: '16px', background: 'white', border: 'none', borderRadius: '16px', color: 'black', fontWeight: 800, fontSize: '14px', letterSpacing: '1px' }}
              >
                EDIT PROFILE
              </button>
              <button
                onClick={() => captureAndShare('native')}
                disabled={isSharing}
                style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700 }}
              >
                {isSharing ? '...' : 'SHARE'}
              </button>
            </div>
          </div>
        )
      }

      {/* --- MEMORIES & EVENTS (UPDATED TEXT) --- */}
      <div className={styles.sectionContainer}>
        {/* Memories */}
        <div>
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Minted Memories</span>
              <button className={styles.helpIconBtn} onClick={() => setActiveHelp('memories')}>?</button>
            </div>
            <span style={{ opacity: 0.5 }}>0</span>
          </div>
          <div className={styles.memoriesScroll}>
            <div className={styles.memoryCard} style={{ width: '100%', maxWidth: 'none', flexDirection: 'row', gap: '16px', alignItems: 'center', justifyContent: 'flex-start', padding: '0 16px', height: '80px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '24px' }}>⚙️</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Memory NFT's will appear here...</div>
                <div style={{ fontSize: '10px', opacity: 0.5 }}>Connect with friends to mint</div>
              </div>
            </div>
          </div>
        </div>

        {/* Events */}
        <div>
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Events</span>
              <button className={styles.helpIconBtn} onClick={() => setActiveHelp('events')}>?</button>
            </div>
            <span style={{ opacity: 0.5 }}>0</span>
          </div>
          <div className={styles.eventsList}>
            <div className={styles.eventItem} style={{ borderStyle: 'dashed', opacity: 0.6 }}>
              <div>
                <div className={styles.eventDate}>UPCOMING</div>
                <div className={styles.eventTitle} style={{ fontSize: '13px' }}>POAP integration in progress. Attended events will be shown here.</div>
              </div>
              <div className={styles.eventStatus}>SOON</div>
            </div>
          </div>
        </div>
      </div>

      {/* SPREAD THE SIGNAL (Base Post) & CHECK SCORE */}
      <div className={styles.basePostSection}>
        <div style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.5 }}>
          Spread the Signal
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className={styles.basePostButton}
            onClick={() => captureAndShare('twitter')}
            disabled={isSharing}
          >
            <span>{isSharing ? 'Generating...' : '🔵 Post on X'}</span>
          </button>

          <button
            className={styles.basePostButton}
            style={{ background: 'black', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={() => setShowScore(!showScore)}
          >
            <span>✨ Check Score</span>
          </button>
        </div>
      </div>

      {/* INLINE SCORE VIEW */}
      <AnimatePresence>
        {showScore && (
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <ScoreView address={address || "0xYourAddress"} onClose={() => setShowScore(false)} />
          </div>
        )}
      </AnimatePresence>

    </motion.div >
  );
}
