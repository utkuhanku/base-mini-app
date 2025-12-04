"use client";
import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import styles from "./profile.module.css";

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
      setProfile(JSON.parse(savedProfile));
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  } as const;

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
              <div className={styles.baseCircle}></div>
              Base
            </div>
          </div>

          <div className={styles.cardBody}>
            {profile.profilePicUrl ? (
              <img src={profile.profilePicUrl} alt="Profile" className={styles.cardProfilePic} />
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
