'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, Building2, Mail, Phone, MapPin, Loader2, Trash2, CheckCircle2, MapPinned,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { schoolAdminKeys } from '@/core/constants/queryKeys';
import styles from './StudentDetailModal.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

async function fetchSchoolMe() {
  const res = await fetch(`${API_BASE}/api/school-admin/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load settings');
  const json = await res.json();
  return json as { user: unknown; school: Record<string, unknown> | null };
}

export default function SchoolSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: meData, isLoading } = useQuery({
    queryKey: schoolAdminKeys.me(user?.schoolId),
    queryFn: fetchSchoolMe,
    enabled: open && !!user?.schoolId,
    staleTime: 300_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  useEffect(() => {
    if (open && meData?.school) {
      setName(String(meData.school.name || ''));
      setEmail(String(meData.school.email || ''));
      setPhone(String(meData.school.phone || ''));
      setAddress(String(meData.school.address || ''));
      setCity(String(meData.school.city || ''));
      setState(String(meData.school.state || ''));
      setLogoUrl((meData.school.logo_url as string) || null);
      setLogoPreview((meData.school.logo_url as string) || null);
    }
  }, [open, meData]);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setErrorMsg('');
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setUploading(true);
    setStatus('idle');
    try {
      const form = new FormData();
      form.append('logo', file);
      const res = await fetch(`${API_BASE}/api/school-admin/settings/logo`, {
        method: 'POST', credentials: 'include', body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.logo_url) setLogoUrl(json.logo_url);
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.me(user?.schoolId) });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoPreview(null);
    setLogoUrl(null);
    try {
      await fetch(`${API_BASE}/api/school-admin/settings/logo`, {
        method: 'DELETE', credentials: 'include',
      });
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.me(user?.schoolId) });
    } catch { /* ignore */ }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch(`${API_BASE}/api/school-admin/settings`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStatus('saved');
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.me(user?.schoolId) });
      window.dispatchEvent(new CustomEvent('school-branding-updated'));
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className={styles.header}>
              <h2 className={styles.heading}>School Settings</h2>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className={styles.body}>
              {isLoading ? (
                <div className={styles.settingsLoading}>
                  <div className={styles.loader} />
                  <p>Loading settings...</p>
                </div>
              ) : (
                <>
                  {/* Logo */}
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><Building2 size={16} color="#8b5cf6" /> School Logo</h4>
                    <div className={styles.logoRow}>
                      <div className={styles.logoBox}>
                        {logoPreview ? (
                          <Image src={logoPreview} alt="Logo" width={72} height={72} style={{ objectFit: 'contain' }} unoptimized />
                        ) : (
                          <Building2 size={28} color="#94a3b8" />
                        )}
                      </div>
                      <div className={styles.logoActions}>
                        <button type="button" className={styles.logoUploadBtn} onClick={() => fileRef.current?.click()}>
                          {uploading ? <Loader2 size={14} className={styles.spin} /> : <Upload size={14} />}
                          {uploading ? 'Uploading...' : 'Upload Logo'}
                        </button>
                        {logoPreview && (
                          <button type="button" className={styles.logoRemoveBtn} onClick={handleRemoveLogo}>
                            <Trash2 size={13} /> Remove
                          </button>
                        )}
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                    </div>
                  </div>

                  {/* School Name */}
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><Building2 size={16} color="#3b82f6" /> School Name</h4>
                    <div className={styles.inputWrap}>
                      <Building2 size={16} className={styles.inputIcon} />
                      <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="School name" />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><Mail size={16} color="#10b981" /> Contact</h4>
                    <div className={styles.inputGrid}>
                      <div className={styles.inputWrap}>
                        <Mail size={16} className={styles.inputIcon} />
                        <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
                      </div>
                      <div className={styles.inputWrap}>
                        <Phone size={16} className={styles.inputIcon} />
                        <input className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}><MapPin size={16} color="#f59e0b" /> Address</h4>
                    <div className={styles.inputGrid}>
                      <div className={styles.inputWrap}>
                        <MapPin size={16} className={styles.inputIcon} />
                        <input className={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
                      </div>
                      <div className={styles.inputRow}>
                        <div className={styles.inputWrap}>
                          <MapPinned size={16} className={styles.inputIcon} />
                          <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                        </div>
                        <div className={styles.inputWrap}>
                          <input className={styles.input} value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {status === 'saved' && (
                    <div className={styles.statusSaved}>
                      <CheckCircle2 size={16} /> Saved successfully
                    </div>
                  )}

                  {status === 'error' && (
                    <div className={styles.statusError}>
                      {errorMsg || 'Something went wrong'}
                    </div>
                  )}

                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                  >
                    {saving ? <><Loader2 size={18} className={styles.spin} /> Saving...</> : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
