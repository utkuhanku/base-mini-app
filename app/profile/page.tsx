"use client";
import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import styles from "./profile.module.css";

interface Link {
  title: string;
  url: string;
}

interface Profile {
  name: string;
  bio: string;
  links: Link[];
}

export default function ProfilePage() {
  const { context } = useMiniKit();
  const [profile, setProfile] = useState<Profile>({
    name: "",
    bio: "",
    links: [],
  });
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    // Load profile from localStorage
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setIsEditing(false);
    } else if (context?.user?.displayName) {
        setProfile(prev => ({ ...prev, name: context.user.displayName || "" }));
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

  if (!isEditing) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>My Identity</h1>
        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Name</label>
            <div className={styles.input}>{profile.name}</div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Bio</label>
            <div className={styles.textarea}>{profile.bio}</div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Links</label>
            <div className={styles.linkList}>
              {profile.links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.input} style={{textDecoration: 'none', color: '#0052ff'}}>
                  {link.title || link.url}
                </a>
              ))}
            </div>
          </div>
          <button className={styles.button} onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Profile</h1>
      <div className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Your Name"
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Bio</label>
          <textarea
            className={styles.textarea}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell us about yourself"
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Portfolio Links</label>
          <div className={styles.linkList}>
            {profile.links.map((link, i) => (
              <div key={i} className={styles.linkItem}>
                <input
                  className={styles.input}
                  placeholder="Title (e.g. Twitter)"
                  value={link.title}
                  onChange={(e) => updateLink(i, "title", e.target.value)}
                />
                <input
                  className={styles.input}
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateLink(i, "url", e.target.value)}
                />
                <button className={styles.removeButton} onClick={() => removeLink(i)}>
                  ✕
                </button>
              </div>
            ))}
            <button className={styles.addButton} onClick={addLink}>
              + Add Link
            </button>
          </div>
        </div>
        <button className={styles.button} onClick={handleSave}>
          Save Profile
        </button>
      </div>
    </div>
  );
}
