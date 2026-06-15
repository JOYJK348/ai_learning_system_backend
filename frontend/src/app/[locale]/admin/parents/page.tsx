'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Square, Download, Search, Users, User,
  Star, GraduationCap, Pencil, Trash2, Eye, X,
  XCircle, TrendingUp, IndianRupee, Send, Plus, CreditCard,
  ChevronRight, ShieldCheck, AlertTriangle, Clock, CheckCircle2,
  School, Mail, Calendar, ChevronDown, Users2,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const adminFont = Manrope({ subsets: ['latin'], variable: '--admin-font', display: 'swap' });
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

/* ─────────────────────────── TYPES ─────────────────────────── */
type Parent = {
  id: string; name: string; email: string; phone?: string; profile_photo_url?: string;
  plan_type_id?: number; plan_name?: string; plan_code?: string;
  plan_status_id?: number; plan_status_name?: string; plan_status_color?: string; plan_status_code?: string;
  approval_status_id?: number; approval_status_name?: string; approval_status_color?: string; approval_status_code?: string;
  status_id: number; plan_expires_at?: string; plan_started_at?: string;
  children_count: number; children_names: string[];
  latest_payment_amount?: number; latest_payment_status_id?: number; latest_payment_paid_at?: string;
  days_until_expiry?: number; registered_at?: string; created_at: string;
};

type DetailedParent = Parent & {
  payments: PaymentRecord[];
  children: ChildRecord[];
  total_paid: number;
};

type PaymentRecord = {
  id: string; amount: number; currency: string; plan: string;
  gateway: string; notes?: string; status: string; status_color: string;
  paid_at?: string; created_at: string;
};

type ChildRecord = {
  id: string; name: string; grade_name: string; photo_url?: string;
  total_stars: number; lessons_completed: number; avg_score: number; status_id: number;
};

/* ─────────────────────────── HELPERS ─────────────────────────── */
const planLookup = [{ id: 1, name: 'Free' }, { id: 2, name: 'Paid' }, { id: 3, name: 'School' }];
const planStatusLookup = [{ id: 1, name: 'Active' }, { id: 2, name: 'Expired' }, { id: 3, name: 'Pending' }];
const approvalLookup = [{ id: 1, name: 'Pending' }, { id: 2, name: 'Approved' }, { id: 3, name: 'Rejected' }];
const entityStatusLookup = [{ id: 1, name: 'Active' }, { id: 2, name: 'Inactive' }];

const AVATAR_GRADIENTS = [
  ['#12312f', '#1a4a47'],
  ['#1e293b', '#334155'],
  ['#3b1f4e', '#5b2d75'],
  ['#1e3a5f', '#2d5a8e'],
  ['#5c1f1f', '#8e2d2d'],
  ['#1f4e3a', '#2d755a'],
];

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

function getAvatarGradient(name: string) {
  const g = AVATAR_GRADIENTS[hashName(name) % AVATAR_GRADIENTS.length];
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '—';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─────────── Motion variants ─────────── */
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.025 } },
};

const ROW_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const STAT_ITEM = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.05, duration: 0.35 } }),
};

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function ParentsAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: parentsData, isLoading: parentsLoading } = useQuery({
    queryKey: [...adminKeys.parentDirectory, user?.id],
    queryFn: () => adminApi.parentDirectory() as Promise<{ parents: Parent[]; monthlyRevenue: number }>,
    enabled: !loading && Boolean(user),
    staleTime: 60_000,
  });

  const parents = parentsData?.parents ?? [];
  const monthlyRevenue = parentsData?.monthlyRevenue ?? 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterApproval, setFilterApproval] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* detail modal */
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'children' | 'payments'>('profile');

  const { data: detailParent, isFetching: detailLoading } = useQuery({
    queryKey: [...adminKeys.parentDetail(selectedParentId || ''), user?.id],
    queryFn: () => adminApi.parentDetail(selectedParentId!) as Promise<DetailedParent>,
    enabled: !!selectedParentId && !loading && !!user,
    staleTime: 5 * 60_000,
  });

  const prefetchDetail = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: [...adminKeys.parentDetail(id), user?.id],
      queryFn: () => adminApi.parentDetail(id) as Promise<DetailedParent>,
      staleTime: 5 * 60_000,
    });
  };

  /* edit modal */
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Parent | null>(null);
  const [editValues, setEditValues] = useState({ name: '', phone: '', plan_type_id: 1, plan_status_id: 1, approval_status_id: 2, status_id: 1, plan_expires_at: '' });

  /* payment modal */
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentParent, setPaymentParent] = useState<Parent | null>(null);
  const [paymentValues, setPaymentValues] = useState({ amount: '', plan_name: 'Paid Plan', notes: '', plan_type_id: 2, plan_expires_at: '' });

  /* email modal */
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<Parent | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (!loading && !user) router.push(`/${locale}/login`); }, [loading, user]);

  /* hydrate for client-side rendering */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const filteredParents = useMemo(() => {
    let f = [...parents];

    if (filterPlan) f = f.filter(p => (p.plan_code || 'free') === filterPlan);
    if (filterApproval) f = f.filter(p => (p.approval_status_code || 'approved') === filterApproval);
    if (filterStatus) f = f.filter(p => p.status_id === Number(filterStatus));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone || '').includes(q) ||
        (p.children_names || []).some((c: string) => c.toLowerCase().includes(q))
      );
    }
    return f;
  }, [parents, filterPlan, filterApproval, filterStatus, searchQuery]);

  const openDetail = (id: string) => {
    setSelectedParentId(id);
    setActiveTab('profile');
  };

  const closeDetail = () => { setSelectedParentId(null); };

  const showFeedback = (msg: string) => { setFeedback(msg); window.setTimeout(() => setFeedback(null), 3500); };

  /* ── EDIT ── */
  const openEdit = (item: Parent) => {
    setEditItem(item);
    setEditValues({
      name: item.name, phone: item.phone || '',
      plan_type_id: item.plan_type_id || 1,
      plan_status_id: item.plan_status_id || 1,
      approval_status_id: item.approval_status_id || 2,
      status_id: item.status_id,
      plan_expires_at: item.plan_expires_at ? item.plan_expires_at.split('T')[0] : '',
    });
    setEditOpen(true);
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setIsSaving(true);
    try {
      const payload = { ...editValues, plan_expires_at: editValues.plan_expires_at ? new Date(editValues.plan_expires_at).toISOString() : null };
      const res = await fetch(`${API_BASE}/api/admin/parents/${editItem.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), credentials: 'include',
      });
      if (res.ok) { showFeedback('Parent updated'); setEditOpen(false); queryClient.invalidateQueries({ queryKey: adminKeys.parentDirectory }); }
      else showFeedback('Update failed');
    } finally { setIsSaving(false); }
  };

  /* ── DELETE ── */
  const deleteParent = async (item: Parent) => {
    if (!window.confirm(`Delete parent ${item.name}? This cannot be undone.`)) return;
    const res = await fetch(`${API_BASE}/api/admin/parents/${item.id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { showFeedback('Parent deleted'); queryClient.invalidateQueries({ queryKey: adminKeys.parentDirectory }); }
    else showFeedback('Delete failed');
  };

  /* ── MANUAL PAYMENT ── */
  const openPayment = (item: Parent) => { setPaymentParent(item); setPaymentOpen(true); };

  const savePayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentParent) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/parents/${paymentParent.id}/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentValues.amount),
          plan_name: paymentValues.plan_name,
          plan_type_id: paymentValues.plan_type_id,
          notes: paymentValues.notes,
          plan_expires_at: paymentValues.plan_expires_at ? new Date(paymentValues.plan_expires_at).toISOString() : null,
          plan_status_id: 1,
        }),
        credentials: 'include',
      });
      if (res.ok) {
        showFeedback('Payment recorded successfully');
        setPaymentOpen(false);
        setPaymentValues({ amount: '', plan_name: 'Paid Plan', notes: '', plan_type_id: 2, plan_expires_at: '' });
        queryClient.invalidateQueries({ queryKey: adminKeys.parentDirectory });
        if (detailParent && detailParent.id === paymentParent.id) openDetail(paymentParent.id);
      } else showFeedback('Failed to record payment');
    } finally { setIsSaving(false); }
  };

  /* ── EMAIL (mock) ── */
  const openEmail = (item: Parent) => {
    setEmailTarget(item);
    setEmailSubject(`Regarding your account — ${item.name}`);
    setEmailBody(`Dear ${item.name},\n\n`);
    setEmailOpen(true);
  };

  const sendEmail = () => {
    showFeedback(`✉️ Email queued for ${emailTarget?.name}. (Delivery via SMTP coming soon)`);
    setEmailOpen(false);
  };

  /* ── BULK ── */
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filteredParents.length && filteredParents.length > 0
      ? new Set() : new Set(filteredParents.map(p => p.id)));
  };
  const toggleSelect = (id: string) => {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  };

  const bulkAction = async (action: string, extra?: any) => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Apply "${action}" to ${selectedIds.size} parents?`)) return;
    const res = await fetch(`${API_BASE}/api/admin/parents/bulk`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, parentIds: Array.from(selectedIds), data: extra }),
      credentials: 'include',
    });
    if (res.ok) { showFeedback('Bulk action completed'); setSelectedIds(new Set()); queryClient.invalidateQueries({ queryKey: adminKeys.parentDirectory }); }
    else showFeedback('Bulk action failed');
  };

  /* ── CSV EXPORT ── */
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Plan', 'Payment Status', 'Approval', 'Children', 'Expiry', 'Joined'];
    const rows = filteredParents.map(p => [
      `"${p.name}"`, `"${p.email}"`, `"${p.phone || ''}"`,
      `"${p.plan_name || 'Free'}"`, `"${p.plan_status_name || ''}"`,
      `"${p.approval_status_name || ''}"`, p.children_count,
      `"${p.plan_expires_at ? new Date(p.plan_expires_at).toLocaleDateString() : ''}"`,
      `"${p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `parents_${new Date().toISOString().split('T')[0]}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ── STATS ── */
  const stats = useMemo(() => {
    const now = Date.now();
    const week = now + 7 * 86400000;
    const pool = parents;
    return {
      total: pool.length,
      active: pool.filter(p => p.status_id === 1).length,
      pending: pool.filter(p => (p.approval_status_code || 'approved') === 'pending').length,
      free: pool.filter(p => (p.plan_code || 'free') === 'free').length,
      paid: pool.filter(p => (p.plan_code || 'free') === 'paid').length,
      expiringSoon: pool.filter(p => { const e = p.plan_expires_at ? new Date(p.plan_expires_at).getTime() : 0; return e > now && e <= week; }).length,
    };
  }, [parents]);

  const statCards = useMemo(() => [
    { label: 'Total Parents', value: stats.total, sub: `${stats.active} active`, icon: <Users size={18} />, color: '#2563eb', iconClass: styles.statIconAccent1 },
    { label: 'Pending Approval', value: stats.pending, sub: 'Need review', icon: <Clock size={18} />, color: stats.pending > 0 ? '#d97706' : '#64748b', iconClass: styles.statIconAccent2, link: `/${locale}/admin/pending-registrations` },
    { label: 'Plan Type', value: `${stats.free} Free / ${stats.paid} Paid`, sub: 'All parents', icon: <GraduationCap size={18} />, color: '#64748b', iconClass: styles.statIconAccent3 },
    { label: 'Monthly Revenue', value: `₹${monthlyRevenue.toLocaleString()}`, sub: 'This month (INR)', icon: <IndianRupee size={18} />, color: '#059669', iconClass: styles.statIconAccent4 },
    { label: 'Expiring Soon', value: stats.expiringSoon, sub: 'Within 7 days', icon: <AlertTriangle size={18} />, color: stats.expiringSoon > 0 ? '#dc2626' : '#64748b', iconClass: styles.statIconAccent5 },
  ], [stats, monthlyRevenue]);

  if (loading || !user) return null;

  /* ════════════════════════════ RENDER ════════════════════════════ */
  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>

      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Parent Management</h1>
          <p className={styles.subtitle}>Manage subscriptions, approvals, and payment history</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={exportCSV}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </header>

      {/* ── STATS ROW ── */}
      <div className={styles.statsRow}>
        {statCards.map((card, i) => (
          card.link ? (
            <Link key={card.label} href={card.link} className={styles.statCardLink}>
              <motion.div className={styles.statCard} custom={i} variants={STAT_ITEM} initial="hidden" animate="show">
                <div className={`${styles.statIcon} ${card.iconClass}`}>{card.icon}</div>
                <div>
                  <p className={styles.statValue}>{card.value}</p>
                  <p className={styles.statLabel}>{card.sub}</p>
                </div>
              </motion.div>
            </Link>
          ) : (
            <motion.div key={card.label} className={styles.statCard} custom={i} variants={STAT_ITEM} initial="hidden" animate="show">
              <div className={`${styles.statIcon} ${card.iconClass}`}>{card.icon}</div>
              <div>
                <p className={styles.statValue}>{card.value}</p>
                <p className={styles.statLabel}>{card.sub}</p>
              </div>
            </motion.div>
          )
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div className={styles.toolbar}>
        <div className={styles.filterRow}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input className={styles.searchInput} type="search" placeholder="Search name, email, phone, or child..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button type="button" className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                <span aria-hidden>&times;</span>
              </button>
            )}
          </div>
          <div className={styles.filterGroup}>
            <div className={styles.selectWrap}>
              <select className={styles.selectBox} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="school">School</option>
              </select>
              <ChevronDown size={12} className={styles.selectChevron} />
            </div>
            <div className={styles.selectWrap}>
              <select className={styles.selectBox} value={filterApproval} onChange={e => setFilterApproval(e.target.value)}>
                <option value="">All Approvals</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown size={12} className={styles.selectChevron} />
            </div>
            <div className={styles.selectWrap}>
              <select className={styles.selectBox} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="2">Inactive</option>
              </select>
              <ChevronDown size={12} className={styles.selectChevron} />
            </div>
          </div>
        </div>
      </div>

      {/* ── BULK BAR ── */}
      {selectedIds.size > 0 && (
        <motion.div className={styles.bulkBar} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <span className={styles.bulkCount}>{selectedIds.size} selected</span>
          <button type="button" className={styles.bulkBtn} onClick={() => bulkAction('approve')}>
            <CheckCircle2 size={13} /> Approve
          </button>
          <button type="button" className={styles.bulkBtn} onClick={() => { const d = window.prompt('Extend plan by how many days?'); if (d && !isNaN(+d)) bulkAction('extend', { days: +d }); }}>
            <Clock size={13} /> Extend
          </button>
          <button type="button" className={styles.bulkBtn} onClick={() => bulkAction('remind')}>
            <Send size={13} /> Remind
          </button>
          <button type="button" className={styles.bulkDeselectBtn} onClick={() => setSelectedIds(new Set())}>
            Deselect
          </button>
        </motion.div>
      )}

      {/* ── TABLE / LIST ── */}
      {parentsLoading && hydrated ? (
        <div className={styles.emptyState}>
          <div className={styles.loader} />
          <p className={styles.emptyText}>Loading parents...</p>
        </div>
      ) : filteredParents.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Users2 size={40} /></div>
          <h3 className={styles.emptyTitle}>No parents found</h3>
          <p className={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search' : 'No parents registered yet'}
          </p>
        </div>
      ) : (
        <section className={styles.tableWrap}>
          {/* Table Header (desktop) */}
          <div className={styles.tableHeader}>
            <button type="button" className={styles.sortBtn} onClick={toggleSelectAll} aria-label="Select all" style={{ display: 'flex', justifyContent: 'center' }}>
              {selectedIds.size === filteredParents.length ? <CheckSquare size={15} /> : <Square size={15} />}
            </button>
            <span>Parent</span>
            <span>Children</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Expiry</span>
            <span />
          </div>

          <motion.div variants={CONTAINER} initial="hidden" animate="show">
            {filteredParents.map(item => {
              const expiring = item.days_until_expiry !== null && item.days_until_expiry !== undefined && item.days_until_expiry >= 0 && item.days_until_expiry <= 7;
              const expired = item.days_until_expiry !== null && item.days_until_expiry !== undefined && item.days_until_expiry < 0;
              const isSelected = selectedIds.has(item.id);

              return (
                <motion.div
                  key={item.id}
                  variants={ROW_ITEM}
                  className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
                >
                  {/* Checkbox */}
                  <div className={styles.cellCheck}>
                    <button type="button" className={styles.checkBtn} onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} aria-label={isSelected ? 'Deselect' : 'Select'}>
                      {isSelected ? <CheckSquare size={15} color="#12312f" /> : <Square size={15} />}
                    </button>
                  </div>

                  {/* Parent */}
                  <div className={styles.cellParent}>
                    <div className={styles.avatar} style={{ background: getAvatarGradient(item.name) }}>
                      {item.profile_photo_url ? <img src={item.profile_photo_url} alt={item.name} /> : item.name.charAt(0)}
                    </div>
                    <div className={styles.nameGroup}>
                      <p className={styles.name}>{item.name}</p>
                      <p className={styles.meta}>{item.email}</p>
                    </div>
                  </div>

                  {/* Children (mobile card row 2) */}
                  <div className={styles.cellChildren}>
                    {item.children_count > 0 ? (
                      <>
                        <div className={styles.childrenInfo}>
                          <Users2 size={13} />
                          <span>{item.children_count} {item.children_count === 1 ? 'Child' : 'Children'}</span>
                        </div>
                        <span className={styles.childrenNames}>
                          {item.children_names.slice(0, 2).join(', ')}{item.children_names.length > 2 ? '...' : ''}
                        </span>
                      </>
                    ) : (
                      <div className={styles.childrenInfo}>
                        <Users2 size={13} />
                        <span style={{ color: '#94a3b8' }}>No children</span>
                      </div>
                    )}
                  </div>

                  {/* Plan (mobile card row 3 left) */}
                  <div className={styles.cellPlan}>
                    <span className={`${styles.planBadge} ${(item.plan_name || '').toLowerCase() === 'paid' ? styles.planBadgePaid : styles.planBadgeFree}`}>
                      {(item.plan_name || '').toLowerCase() === 'paid' ? <><CreditCard size={10} /> Paid</> : (item.plan_name || 'Free')}
                    </span>
                  </div>

                  {/* Status (mobile card row 3 right) */}
                  <div className={styles.cellStatus}>
                    <span className={`${styles.statusPill} ${item.status_id !== 1 ? styles.statusPillInactive : ''}`}>
                      {item.status_id === 1 ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`${styles.approvalBadge} ${(item.approval_status_code || 'approved') === 'pending' ? styles.approvalPending : (item.approval_status_code || 'approved') === 'rejected' ? styles.approvalRejected : styles.approvalApproved}`}>
                      <Clock size={10} />
                      {item.approval_status_name || 'Approved'}
                    </span>
                  </div>

                  {/* Expiry (desktop only) */}
                  <div className={styles.cellExpiry}>
                    {item.plan_expires_at ? (
                      <span className={expired ? styles.cellExpiryExpired : expiring ? styles.cellExpiryExpiring : ''}>
                        {new Date(item.plan_expires_at).toLocaleDateString('en-IN')}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={styles.cellActions}>
                    <button type="button" className={styles.actionBtn} onClick={() => openDetail(item.id)} onMouseEnter={() => prefetchDetail(item.id)} title="View Details"><Eye size={14} /></button>
                    <button type="button" className={styles.actionBtn} onClick={() => openEdit(item)} title="Edit"><Pencil size={14} /></button>
                    <button type="button" className={styles.actionBtn} onClick={() => openPayment(item)} title="Add Payment" style={{ color: '#059669' }}><CreditCard size={14} /></button>
                    <button type="button" className={styles.actionBtn} onClick={() => openEmail(item)} title="Send Email"><Send size={14} /></button>
                    <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => deleteParent(item)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      <div className={styles.bottomPad} />

      {/* ══════════════════════════ DETAIL MODAL ══════════════════════════ */}
        {(selectedParentId) && (
        <div className={styles.drawerOverlay} onClick={closeDetail}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                <div className={styles.drawerLogo}>
                  {detailParent ? detailParent.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h2>{detailParent?.name || 'Loading...'}</h2>
                  {detailParent && <span className={styles.planBadge} style={{background:'rgba(22,163,74,0.1)',color:'#166534'}}>{detailParent.plan_name || 'Free'}</span>}
                </div>
              </div>
              <button className={styles.closeButton} onClick={closeDetail}><X size={20} /></button>
            </div>
            <div className={styles.drawerBody}>
              {detailLoading ? (
                <div style={{padding:'3rem',textAlign:'center',color:'#64748b'}}>Loading...</div>
              ) : detailParent && (
                <>
                  <section className={styles.drawerSection}>
                    <h3><User size={16} /> Parent Details</h3>
                    <div className={styles.drawerGrid}>
                      <div><label>Email</label><p>{detailParent.email}</p></div>
                      <div><label>Phone</label><p>{detailParent.phone || '—'}</p></div>
                      <div><label>Plan</label><p>{detailParent.plan_name || 'Free'}</p></div>
                      <div><label>Status</label><p>{detailParent.status_id === 1 ? 'Active' : 'Inactive'}</p></div>
                      <div><label>Approval</label><p>{detailParent.approval_status_name || 'Approved'}</p></div>
                      <div><label>Expires</label><p>{detailParent.plan_expires_at ? new Date(detailParent.plan_expires_at).toLocaleDateString('en-IN') : 'No expiry'}</p></div>
                      <div><label>Total Paid</label><p>₹{(detailParent.total_paid || 0).toLocaleString('en-IN')}</p></div>
                      <div><label>Joined</label><p>{detailParent.created_at ? new Date(detailParent.created_at).toLocaleDateString('en-IN') : '—'}</p></div>
                    </div>
                  </section>

                  <section className={styles.drawerSection}>
                    <h3><GraduationCap size={16} /> Children ({detailParent.children.length})</h3>
                    {detailParent.children.length === 0 ? (
                      <p style={{color:'#64748b',fontSize:'0.85rem'}}>No children linked.</p>
                    ) : detailParent.children.map(child => (
                      <div key={child.id} className={styles.childRow}>
                        <div className={styles.childAvatar} style={{background: getAvatarGradient(child.name)}}>{child.name.charAt(0)}</div>
                        <div style={{flex:1}}>
                          <p style={{margin:0,fontWeight:950,fontSize:'0.88rem',color:'#0f172a'}}>{child.name}</p>
                          <p style={{margin:0,fontSize:'0.75rem',fontWeight:700,color:'#64748b'}}>{child.grade_name} &middot; Avg: {child.avg_score}% &middot; Stars: {child.total_stars}</p>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section className={styles.drawerSection}>
                    <h3><CreditCard size={16} /> Payments ({(detailParent.payments||[]).length})</h3>
                    {(detailParent.payments||[]).length === 0 ? (
                      <p style={{color:'#64748b',fontSize:'0.85rem'}}>No payments recorded.</p>
                    ) : (detailParent.payments||[]).map(pay => (
                      <div key={pay.id} className={styles.payRow}>
                        <div>
                          <p className={styles.payPlan}>{pay.plan} &middot; {pay.gateway}</p>
                          <p className={styles.payDate}>{pay.paid_at ? new Date(pay.paid_at).toLocaleDateString('en-IN') : new Date(pay.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <p className={styles.payAmount}>₹{parseFloat(String(pay.amount)).toLocaleString('en-IN')}</p>
                          <p className={styles.payStatus} style={{color: pay.status_color||'#64748b'}}>{pay.status}</p>
                        </div>
                      </div>
                    ))}
                    <div className={styles.payTotal}>Total: ₹{(detailParent.total_paid || 0).toLocaleString('en-IN')}</div>
                  </section>

                  <div className={styles.drawerActions}>
                    <button className={styles.primaryButton} onClick={() => { closeDetail(); openEdit(detailParent); }}><Pencil size={16} /> Edit Parent</button>
                    <button className={styles.secondaryButton} onClick={() => { closeDetail(); openPayment(detailParent); }}><CreditCard size={16} /> Record Payment</button>
                    <button className={styles.secondaryButton} onClick={() => { closeDetail(); openEmail(detailParent); }}><Send size={16} /> Send Email</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      <AnimatePresence>
        {feedback && (
          <motion.div className={styles.toast} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
