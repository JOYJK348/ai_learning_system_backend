'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Loader2 } from 'lucide-react';
import { useUpdateParent } from '@/hooks/useSchoolParents';
import styles from './AddStudentModal.module.css';

type Props = {
  parent: { id: string; name: string; email: string; phone: string | null };
  open: boolean;
  onClose: () => void;
};

export default function EditParentModal({ parent, open, onClose }: Props) {
  const [name, setName] = useState(parent?.name ?? '');
  const [phone, setPhone] = useState(parent?.phone ?? '');
  const updateParent = useUpdateParent();

  useEffect(() => {
    if (open) {
      setName(parent.name);
      setPhone(parent.phone ?? '');
    }
  }, [open, parent]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await updateParent.mutateAsync({ id: parent.id, name: name.trim(), phone: phone.trim() || undefined });
      onClose();
    } catch { /* handled */ }
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
            className={styles.modal}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className={styles.header}>
              <h2 className={styles.heading}>Edit Parent</h2>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form className={styles.body} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    className={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {parent?.email && (
                <div className={styles.field}>
                  <label className={styles.label}>Email <span className={styles.hint}>(cannot be changed)</span></label>
                  <div className={styles.inputWrap}>
                    <User size={16} className={styles.inputIcon} />
                    <input className={styles.input} value={parent.email} disabled />
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label}>Phone</label>
                <div className={styles.inputWrap}>
                  <Phone size={16} className={styles.inputIcon} />
                  <input
                    className={styles.input}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {updateParent.error && (
                <div className={styles.error}>{updateParent.error.message}</div>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={updateParent.isPending || !name.trim()}
              >
                {updateParent.isPending ? (
                  <><Loader2 size={18} className={styles.spin} /> Saving...</>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
