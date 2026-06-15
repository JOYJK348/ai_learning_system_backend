'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Mail, Phone, BookOpen, ChevronDown,
  Copy, CheckCircle2, Eye, EyeOff, Loader2, Search, Link,
} from 'lucide-react';
import { useCreateParent, useSchoolParents } from '@/hooks/useSchoolParents';
import type { CreateParentResult } from '@/hooks/useSchoolParents';
import styles from './AddStudentModal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AddParentModal({ open, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<'none' | 'username' | 'password'>('none');
  const [childSearch, setChildSearch] = useState('');
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);

  const { data: parentsRes } = useSchoolParents();
  const createParent = useCreateParent();

  const existingChildren = useMemo(() => {
    const map = new Map<string, string>();
    const parentsList = (Array.isArray(parentsRes?.data) ? parentsRes.data : (parentsRes?.data?.data as Array<{ children: { student_id: string; name: string }[] }> | undefined)) || [];
    parentsList.forEach((p: { children: { student_id: string; name: string }[] }) => {
      p.children?.forEach((c) => map.set(c.student_id, c.name));
    });
    return map;
  }, [parentsRes]);

  const [allStudents, setAllStudents] = useState<{ id: string; student_id: string; full_name: string; grade_name: string; section: string }[]>([]);

  useEffect(() => {
    // Fetch all students for linking
    if (open) {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
      fetch(`${base}/api/school-admin/students`, { credentials: 'include' })
        .then((r) => r.json())
        .then((res) => {
          if (res.data) setAllStudents(res.data);
        })
        .catch(() => {});
    }
  }, [open]);

  const filteredStudents = useMemo(() => {
    let list = allStudents;
    if (childSearch.trim()) {
      const q = childSearch.toLowerCase();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q));
    }
    return list;
  }, [allStudents, childSearch]);

  useEffect(() => {
    if (!open) {
      setStep('form');
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setCopied('none');
      setChildSearch('');
      setSelectedChildIds([]);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const generatedPassword = password || phone.slice(-6) || 'Parent@123';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    try {
      await createParent.mutateAsync({
        name,
        email,
        phone: phone || undefined,
        password: generatedPassword,
        child_ids: selectedChildIds.length > 0 ? selectedChildIds : undefined,
      });
      setStep('success');
    } catch {
      // handled by mutation
    }
  };

  const toggleChild = (id: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCopy = (field: 'username' | 'password') => {
    const text = field === 'username' ? email : generatedPassword;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied('none'), 2000);
    });
  };

  const resultData = createParent.data as CreateParentResult | undefined;

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
            className={styles.modal}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className={styles.header}>
              <h2 className={styles.heading}>
                {step === 'form' ? 'Add New Parent' : 'Parent Created'}
              </h2>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {step === 'form' ? (
              <form className={styles.body} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name</label>
                  <div className={styles.inputWrap}>
                    <User size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      placeholder="e.g. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Email <span className={styles.hint}>(login username)</span></label>
                  <div className={styles.inputWrap}>
                    <Mail size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="e.g. priya@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Phone <span className={styles.hint}>(optional)</span></label>
                  <div className={styles.inputWrap}>
                    <Phone size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    Password <span className={styles.hint}>(default: last 6 digits of phone)</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <Eye size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Custom password (optional)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.togglePw}
                      style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label="Toggle"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {!password && phone.length >= 6 && (
                    <div className={styles.passwordPreview}>
                      <span>Auto password: </span>
                      <code className={styles.passwordCode}>{phone.slice(-6)}</code>
                    </div>
                  )}
                </div>

                {/* Link Children */}
                <div className={styles.field}>
                  <label className={styles.label}>Link Children <span className={styles.hint}>(optional)</span></label>
                  <div className={styles.inputWrap} style={{ marginBottom: '0.35rem' }}>
                    <Search size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      placeholder="Search students..."
                      value={childSearch}
                      onChange={(e) => setChildSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ maxHeight: '10rem', overflowY: 'auto', border: '1px solid rgba(15,23,42,0.07)', borderRadius: '0.75rem', padding: '0.35rem' }}>
                    {allStudents.length === 0 ? (
                      <p style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', padding: '0.75rem' }}>
                        Loading students...
                      </p>
                    ) : filteredStudents.length === 0 ? (
                      <p style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', padding: '0.75rem' }}>
                        No matching students
                      </p>
                    ) : (
                      filteredStudents.map((s) => {
                        const alreadyLinked = existingChildren.has(s.student_id);
                          return (
                            <label
                              key={s.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.4rem 0.5rem',
                                borderRadius: '0.5rem',
                                cursor: alreadyLinked ? 'default' : 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                color: '#1e293b',
                                opacity: alreadyLinked ? 0.5 : 1,
                                background: selectedChildIds.includes(s.student_id) ? 'rgba(18,49,47,0.06)' : 'transparent',
                              }}
                            >
                              {alreadyLinked ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.58rem', fontWeight: 950, color: '#16a34a', background: '#f0fdf4', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>
                                  <CheckCircle2 size={10} /> Mapped
                                </span>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={selectedChildIds.includes(s.student_id)}
                                  onChange={() => toggleChild(s.student_id)}
                                  style={{ accentColor: '#12312f' }}
                                />
                              )}
                            <span style={{ flex: 1 }}>{s.full_name}</span>
                            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#94a3b8' }}>
                              {s.grade_name} {s.section ? `· ${s.section}` : ''}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {selectedChildIds.length > 0 && (
                    <p style={{ fontSize: '0.68rem', fontWeight: 900, color: '#64748b', marginTop: '0.25rem' }}>
                      {selectedChildIds.length} student{selectedChildIds.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {createParent.error && (
                  <div className={styles.error}>
                    {createParent.error instanceof Error ? createParent.error.message : 'Failed to create parent'}
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={createParent.isPending || !name || !email}
                >
                  {createParent.isPending ? (
                    <><Loader2 size={18} className={styles.spin} /> Creating...</>
                  ) : (
                    'Create Parent'
                  )}
                </button>
              </form>
            ) : (
              <div className={styles.body}>
                <div className={styles.successIcon}><CheckCircle2 size={40} color="#22c55e" /></div>
                <p className={styles.successText}>Parent account created!</p>
                <p className={styles.successSub}>Share these credentials:</p>
                <div className={styles.credBox}>
                  <div className={styles.credRow}>
                    <Mail size={16} />
                    <div className={styles.credContent}>
                      <p className={styles.credLabel}>Username (Email)</p>
                      <p className={styles.credValue}>{resultData?.username || email}</p>
                    </div>
                    <button type="button" className={styles.copyBtn} onClick={() => handleCopy('username')} aria-label="Copy">
                      {copied === 'username' ? <CheckCircle2 size={16} color="#22c55e" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className={styles.credRow}>
                    <Eye size={16} />
                    <div className={styles.credContent}>
                      <p className={styles.credLabel}>Password</p>
                      <p className={styles.credValue}>{generatedPassword}</p>
                    </div>
                    <button type="button" className={styles.copyBtn} onClick={() => handleCopy('password')} aria-label="Copy">
                      {copied === 'password' ? <CheckCircle2 size={16} color="#22c55e" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <button type="button" className={styles.submitBtn} onClick={onClose}>Done</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
