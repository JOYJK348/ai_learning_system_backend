'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  Gift,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap,
  ArrowDown,
  ArrowUp,
  Calendar,
  FileText,
  Phone,
  User,
  Wallet,
  Bell,
  CheckSquare,
  XSquare,
  Printer,
  RotateCcw,
  Award,
  Crown,
  Timer,
  Activity,
  BarChart3,
  PieChart,
  Receipt,
  Banknote,
  Smartphone,
  Globe,
  Landmark,
  QrCode,
  BadgeCheck,
  AlertCircle,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { Building2 } from 'lucide-react';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

// Types
type Payment = {
  id: string;
  parent_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  amount: number;
  method: string;
  status: 'pending' | 'success' | 'failed' | 'refunded' | 'verified';
  transaction_id: string;
  plan_type: string;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
};

type ParentPlan = {
  id: string;
  parent_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  registration_type: 'individual' | 'school';
  school_id: string | null;
  plan_type: string;
  plan_name: string;
  plan_price: number;
  status: 'active' | 'inactive' | 'expired' | 'grace_period';
  plan_start_date: string;
  plan_end_date: string;
  days_until_expiry: number;
  total_paid: number;
  last_payment_date?: string;
  children_count: number;
  last_login?: string;
  churn_risk: 'low' | 'medium' | 'high';
};

type Transaction = {
  id: string;
  parent_name: string;
  amount: number;
  method: string;
  status: string;
  transaction_id: string;
  created_at: string;
  invoice_url?: string;
};

type PaymentStats = {
  today_revenue: number;
  this_month_revenue: number;
  total_revenue: number;
  pending_verification: number;
  pending_amount: number;
  total_transactions: number;
  success_rate: number;
  active_paid_users: number;
  free_users: number;
  expired_users: number;
  expiring_soon: number;
  total_schools?: number;
  paid_schools?: number;
  expired_schools?: number;
  schools_expiring_soon?: number;
};

type SchoolPayment = {
  id: string; type: 'school'; school_id: string; school_name: string;
  school_code: string; school_email: string; school_phone: string;
  school_city: string; school_state: string;
  plan_type: string; plan_name: string; plan_type_id: number;
  plan_status: string; plan_status_name: string; plan_status_color: string;
  plan_price: number; plan_start_date: string; plan_end_date: string;
  days_until_expiry: number; student_count: number; max_students: number;
  revenue_this_month: number; revenue_total: number;
  last_paid_amount: number; last_paid_at: string | null; last_payment_method: string | null;
};

type TabType = 'active' | 'expired' | 'free' | 'transactions' | 'schools';

export default function PaymentsAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();

  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [regTypeFilter, setRegTypeFilter] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals
  const [viewPayment, setViewPayment] = useState<any | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<ParentPlan | null>(null);
  const [remindModal, setRemindModal] = useState<ParentPlan | null>(null);
  const [detailParentId, setDetailParentId] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  const tabFetchFn = (tab: TabType) => {
    const regParam = regTypeFilter ? `&registration_type=${regTypeFilter}` : '';
    switch (tab) {
      case 'active': return () => adminApi.paymentsParentsPlans(`status=active${regParam}`);
      case 'expired': return () => adminApi.paymentsParentsPlans(`status=expired${regParam}`);
      case 'free': return () => adminApi.paymentsParentsPlans(`plan=free${regParam}`);
      case 'transactions': return () => adminApi.payments();
      case 'schools': return adminApi.paymentsSchoolPayments;
    }
  };

  // Stats query (prefetched by admin layout)
  const { data: statsData } = useQuery({
    queryKey: adminKeys.paymentsStats,
    queryFn: adminApi.paymentsStats,
    staleTime: 60_000,
    enabled: !!user,
  });

  // Persistent individual-only free users count (not dependent on activeTab)
  const { data: individualFreeData } = useQuery({
    queryKey: ['admin', 'payments', 'free', 'individual'],
    queryFn: () => adminApi.paymentsParentsPlans('plan=free&registration_type=individual'),
    staleTime: 60_000,
    enabled: !!user,
  });

  // Tab data query (separate per tab + registration_type for independent caching)
  const { data: rawTabData, isLoading } = useQuery({
    queryKey: [...adminKeys.paymentsTab(activeTab), regTypeFilter || 'all'],
    queryFn: tabFetchFn(activeTab),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: !!user,
  });

  // Parent detail query (instant via prefetch on hover)
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: adminKeys.parentDetail(detailParentId || ''),
    queryFn: () => adminApi.parentDetail(detailParentId!),
    staleTime: 120_000,
    enabled: !!detailParentId,
  });

  // Prefetch parent detail on hover for instant open
  const prefetchParent = useCallback((parentId: string) => {
    if (parentId && !queryClient.getQueryData(adminKeys.parentDetail(parentId))) {
      queryClient.prefetchQuery({
        queryKey: adminKeys.parentDetail(parentId),
        queryFn: () => adminApi.parentDetail(parentId),
        staleTime: 120_000,
      });
    }
  }, [queryClient]);

  const stats: PaymentStats | null = (statsData as any) ?? null;
  const activeParents: ParentPlan[] = activeTab === 'active' ? (Array.isArray(rawTabData) ? rawTabData : []) : [];
  const expiredParents: ParentPlan[] = activeTab === 'expired' ? (Array.isArray(rawTabData) ? rawTabData : []) : [];
  const freeParents: ParentPlan[] = activeTab === 'free' ? (Array.isArray(rawTabData) ? rawTabData : []) : [];
  const transactions: Transaction[] = activeTab === 'transactions' ? (Array.isArray(rawTabData) ? rawTabData : []) : [];
  const schoolPayments: any[] = activeTab === 'schools' ? (Array.isArray(rawTabData) ? rawTabData : []) : [];

  // Individual-only count for the card (persistent query, not dependent on activeTab)
  const individualFreeCount = useMemo(() => {
    return Array.isArray(individualFreeData) ? individualFreeData.filter((p: any) => p.registration_type === 'individual').length : 0;
  }, [individualFreeData]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId }),
        credentials: 'include',
      });
      if (res.ok) {
        showFeedback('Payment verified');
        queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      }
    } catch (e) {
      showFeedback('Verification failed');
    }
  };

  const handleRemind = async (parentId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/parents/${parentId}/remind`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        showFeedback('Reminder sent');
        setRemindModal(null);
      }
    } catch (e) {
      showFeedback('Failed to send reminder');
    }
  };

  const handleUpgrade = async (parentId: string, planTypeId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/parents/plans`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId, plan_type_id: planTypeId }),
        credentials: 'include',
      });
      if (res.ok) {
        showFeedback('Plan upgraded');
        setUpgradeModal(null);
        queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      }
    } catch (e) {
      showFeedback('Upgrade failed');
    }
  };

  const handleRefund = async (paymentId: string) => {
    const confirm = window.confirm('Process refund? This cannot be undone.');
    if (!confirm) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId }),
        credentials: 'include',
      });
      if (res.ok) {
        showFeedback('Refund processed');
        queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      }
    } catch (e) {
      showFeedback('Refund failed');
    }
  };

  const exportCSV = () => {
    let data: any[] = [];
    switch (activeTab) {
      case 'active': data = activeParents; break;
      case 'expired': data = expiredParents; break;
      case 'free': data = freeParents; break;
      case 'transactions': data = transactions; break;
    }
    
    const headers = Object.keys(data[0] || {});
    const rows = data.map(row => headers.map(h => row[h]).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showFeedback('CSV exported');
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 7) return styles.urgencyHigh;
    if (score >= 4) return styles.urgencyMedium;
    return styles.urgencyLow;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
      case 'success':
      case 'verified':
        return styles.statusSuccess;
      case 'pending':
      case 'pending_verification':
        return styles.statusPending;
      case 'rejected':
      case 'failed':
        return styles.statusFailed;
      case 'expired':
      case 'inactive':
        return styles.statusExpired;
      case 'refunded':
        return styles.statusRefunded;
      case 'free':
        return styles.statusFree;
      default:
        return '';
    }
  };

  const getChurnColor = (risk: string) => {
    switch (risk) {
      case 'high': return styles.churnHigh;
      case 'medium': return styles.churnMedium;
      case 'low': return styles.churnLow;
      default: return '';
    }
  };

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'active':
        return activeParents.filter(p => 
          (p.parent_name || '').toLowerCase().includes(query) ||
          (p.parent_email || '').toLowerCase().includes(query)
        );
      case 'expired':
        return expiredParents.filter(p => 
          (p.parent_name || '').toLowerCase().includes(query) ||
          (p.parent_email || '').toLowerCase().includes(query)
        );
      case 'free':
        return freeParents.filter(p => 
          p.registration_type === 'individual' &&
          ((p.parent_name || '').toLowerCase().includes(query) ||
          (p.parent_email || '').toLowerCase().includes(query))
        );
      case 'transactions':
        return transactions.filter(t => 
          (t.parent_name || '').toLowerCase().includes(query) ||
          (t.transaction_id || '').toLowerCase().includes(query)
        );
      case 'schools':
        return (Array.isArray(schoolPayments) ? schoolPayments : []).filter((s: any) =>
          (s.school_name || '').toLowerCase().includes(query) ||
          (s.school_code || '').toLowerCase().includes(query)
        );
      default:
        return [];
    }
  }, [activeTab, activeParents, expiredParents, freeParents, transactions, schoolPayments, searchQuery]);

  const tabs: { id: TabType; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'active', label: 'Active Paid', icon: Crown, count: stats?.active_paid_users },
    { id: 'expired', label: 'Expired', icon: Timer, count: stats?.expired_users },
    { id: 'free', label: 'Individual Users', icon: User, count: individualFreeCount },
    { id: 'schools', label: 'Schools', icon: Users, count: stats?.total_schools ?? 0 },
    { id: 'transactions', label: 'Transactions', icon: Receipt, count: stats?.total_transactions },
  ];

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.bgGlow} />
      <div className={styles.content}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Revenue center</p>
          <h1 className={styles.title}>Payments</h1>
          <p className={styles.subtitle}>
            Manage parent approvals, track payments, handle renewals, and monitor revenue in real-time.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/${locale}/admin`} className={styles.secondaryButton}>
            <ChevronRight size={16} /> Back to dashboard
          </Link>
          <button className={styles.secondaryButton} onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>



      {/* Tab KPI Cards */}
      <section className={styles.kpiGrid}>
        {tabs.map((tab, idx) => (
          <article
            key={tab.id}
            className={`${styles.kpiCard} ${styles.tabKpiCard} ${activeTab === tab.id ? styles.kpiCardActive : ''}`}
            onClick={() => { setActiveTab(tab.id); if (!['active', 'expired', 'free'].includes(tab.id)) setRegTypeFilter(''); }}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.kpiTop}>
              <div className={styles.kpiIcon}><tab.icon size={16} /></div>
            </div>
            <p className={styles.kpiValue}>{tab.count ?? 0}</p>
            <p className={styles.kpiLabel}>{tab.label}</p>
          </article>
        ))}
      </section>

      {/* Search & Filters */}
      <section className={styles.filterSection}>
        <div className={styles.filterRow}>
          <div className={styles.searchGroup}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, email, phone, or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>
          <div className={styles.filterGroup}>
            <Filter size={14} color="#94a3b8" />
            <select className={styles.filterSelect}>
              <option>All Methods</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Netbanking</option>
              <option>Cash</option>
            </select>
            <ChevronDown size={14} className={styles.filterChevron} />
          </div>
          <div className={styles.filterGroup}>
            <Calendar size={14} color="#94a3b8" />
            <select className={styles.filterSelect}>
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
            </select>
            <ChevronDown size={14} className={styles.filterChevron} />
          </div>
        </div>
      </section>

      {/* Table Content */}
      <section className={styles.tableSection}>
        {(!hydrated || isLoading) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '4rem 1rem', color: '#94a3b8' }}>
            <div style={{ width: 32, height: 32 }} />
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Loading data...</p>
          </div>
        ) : (
          <>
            {/* Active Paid Tab */}
            {activeTab === 'active' && (
              <div className={styles.tabContent}>
                <div className={styles.tableHeader}>
                  <h2>Active Paid Users</h2>
                  <span>{filteredData.length} active</span>
                </div>
                <div className={styles.regTypeBar}>
                  <button className={`${styles.regTypeBtn} ${!regTypeFilter ? styles.regTypeActive : ''}`} onClick={() => setRegTypeFilter('')}>All</button>
                  <button className={`${styles.regTypeBtn} ${regTypeFilter === 'individual' ? styles.regTypeActive : ''}`} onClick={() => setRegTypeFilter('individual')}>
                    <User size={13} /> Individual
                  </button>
                  <button className={`${styles.regTypeBtn} ${regTypeFilter === 'school' ? styles.regTypeActive : ''}`} onClick={() => setRegTypeFilter('school')}>
                    <Building2 size={13} /> School
                  </button>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Parent</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Expiry</th>
                        <th>Churn Risk</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length > 0 ? (
                        (filteredData as ParentPlan[]).map(item => (
                          <tr key={item.id} className={`${styles.tableRow} ${styles.tableRowClick}`}
                            onClick={() => setDetailParentId(item.parent_id)}
                            onMouseEnter={() => prefetchParent(item.parent_id)}>
                            <td>
                              <div className={styles.parentCell}>
                                <div className={styles.parentAvatar}>
                                  <User size={20} />
                                </div>
                                <div className={styles.parentInfo}>
                                  <span className={styles.parentName}>{item.parent_name}</span>
                                  {item.registration_type === 'school' && <span className={styles.regTypeBadge}><Building2 size={10} /> School</span>}
                                  {(!item.registration_type || item.registration_type === 'individual') && <span className={styles.regTypeBadgeInd}><User size={10} /> Individual</span>}
                                  <span className={styles.parentMeta}>{item.parent_email}</span>
                                  <span className={styles.parentMeta}>{item.children_count} children</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.planBadge} ${styles.planPaid}`}>
                                <Crown size={12} /> {item.plan_name}
                              </span>
                              <span className={styles.priceText}>₹{item.plan_price}/mo</span>
                            </td>
                            <td>
                              <span className={styles.amountText}>₹{(item.total_paid || 0).toLocaleString()}</span>
                              <span className={styles.parentMeta}>Last: {item.last_payment_date || 'N/A'}</span>
                            </td>
                            <td>
                              <div className={styles.expiryCell}>
                                <span className={`${styles.expiryText} ${item.days_until_expiry <= 7 ? styles.expiryUrgent : ''}`}>
                                  <Timer size={12} />
                                  {item.days_until_expiry} days left
                                </span>
                                <div className={styles.expiryBar}>
                                  <div 
                                    className={styles.expiryFill} 
                                    style={{ width: `${Math.min(100, (item.days_until_expiry / 30) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.churnBadge} ${getChurnColor(item.churn_risk)}`}>
                                <TrendingUp size={12} />
                                {item.churn_risk}
                              </span>
                            </td>
                            <td>
                              <div className={styles.actionMenu}>
                                <button 
                                  className={styles.actionButton}
                                  onClick={(e) => { e.stopPropagation(); setUpgradeModal(item); }}
                                >
                                  <ArrowUpRight size={14} /> Upgrade
                                </button>
                                <button 
                                  className={styles.iconButton}
                                  onClick={(e) => { e.stopPropagation(); setRemindModal(item); }}
                                >
                                  <Send size={14} /> Remind
                                </button>
                                <button 
                                  className={styles.iconButton}
                                  onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/admin/payments/${item.id}`); }}
                                >
                                  <FileText size={14} /> Invoice
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className={styles.emptyState}>
                            <Crown size={32} />
                            <p>No active paid users</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expired Tab */}
            {activeTab === 'expired' && (
              <div className={styles.tabContent}>
                <div className={styles.tableHeader}>
                  <h2>Expired Plans</h2>
                  <span>{filteredData.length} expired</span>
                </div>
                <div className={styles.regTypeBar}>
                  <button className={`${styles.regTypeBtn} ${!regTypeFilter ? styles.regTypeActive : ''}`} onClick={() => setRegTypeFilter('')}>All</button>
                  <button className={`${styles.regTypeBtn} ${regTypeFilter === 'individual' ? styles.regTypeActive : ''}`} onClick={() => setRegTypeFilter('individual')}>
                    <User size={13} /> Individual
                  </button>
                  <button className={`${styles.regTypeBtn} ${regTypeFilter === 'school' ? styles.regTypeActive : ''}`} onClick={() => setRegTypeFilter('school')}>
                    <Building2 size={13} /> School
                  </button>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Parent</th>
                        <th>Expired On</th>
                        <th>Last Payment</th>
                        <th>Grace Period</th>
                        <th>Recovery</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length > 0 ? (
                        (filteredData as ParentPlan[]).map(item => (
                          <tr key={item.id} className={`${styles.tableRow} ${styles.tableRowClick}`}
                            onClick={() => setDetailParentId(item.parent_id)}
                            onMouseEnter={() => prefetchParent(item.parent_id)}>
                            <td>
                              <div className={styles.parentCell}>
                                <div className={styles.parentAvatar}>
                                  <User size={20} />
                                </div>
                                <div className={styles.parentInfo}>
                                  <span className={styles.parentName}>{item.parent_name}</span>
                                  {item.registration_type === 'school' && <span className={styles.regTypeBadge}><Building2 size={10} /> School</span>}
                                  {(!item.registration_type || item.registration_type === 'individual') && <span className={styles.regTypeBadgeInd}><User size={10} /> Individual</span>}
                                  <span className={styles.parentMeta}>{item.parent_email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={styles.expiredDate}>{item.plan_end_date}</span>
                            </td>
                            <td>
                              <span className={styles.amountText}>₹{(item.total_paid || 0).toLocaleString()}</span>
                            </td>
                            <td>
                              <span className={`${styles.graceBadge} ${item.days_until_expiry > -3 ? styles.graceActive : styles.graceExpired}`}>
                                {item.days_until_expiry > -3 ? 'Active' : 'Expired'}
                              </span>
                            </td>
                            <td>
                              <span className={styles.recoveryStatus}>
                                <Mail size={12} /> Email sent
                              </span>
                            </td>
                            <td>
                              <div className={styles.actionMenu}>
                                <button 
                                  className={`${styles.actionButton} ${styles.renewButton}`}
                                  onClick={(e) => { e.stopPropagation(); setUpgradeModal(item); }}
                                >
                                  <RefreshCw size={14} /> Renew
                                </button>
                                <button 
                                  className={`${styles.actionButton} ${styles.offerButton}`}
                                  onClick={(e) => { e.stopPropagation(); setRemindModal(item); }}
                                >
                                  <Gift size={14} /> Offer 50%
                                </button>
                                <button className={styles.iconButtonDanger}>
                                  <Ban size={14} /> Block
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className={styles.emptyState}>
                            <CheckCircle2 size={32} />
                            <p>No expired plans</p>
                            <span>All users active!</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Free Users Tab */}
            {activeTab === 'free' && (
              <div className={styles.tabContent}>
                <div className={styles.tableHeader}>
                  <h2>Individual Users</h2>
                  <span>{filteredData.length} users</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Parent</th>
                        <th>Joined</th>
                        <th>Children</th>
                        <th>Usage</th>
                        <th>Upgrade Intent</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length > 0 ? (
                        (filteredData as ParentPlan[]).map(item => (
                          <tr key={item.id} className={`${styles.tableRow} ${styles.tableRowClick}`}
                            onClick={() => setDetailParentId(item.parent_id)}
                            onMouseEnter={() => prefetchParent(item.parent_id)}>
                            <td>
                              <div className={styles.parentCell}>
                                <div className={styles.parentAvatar}>
                                  <User size={20} />
                                </div>
                                <div className={styles.parentInfo}>
                                  <span className={styles.parentName}>{item.parent_name}</span>
                                  {item.registration_type === 'school' && <span className={styles.regTypeBadge}><Building2 size={10} /> School</span>}
                                  {(!item.registration_type || item.registration_type === 'individual') && <span className={styles.regTypeBadgeInd}><User size={10} /> Individual</span>}
                                  <span className={styles.parentMeta}>{item.parent_email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={styles.dateText}>{item.plan_start_date}</span>
                            </td>
                            <td>
                              <span className={styles.childrenBadge}>
                                <Users size={12} /> {item.children_count}
                              </span>
                            </td>
                            <td>
                              <div className={styles.usageCell}>
                                <span className={styles.usageText}>3/5 lessons</span>
                                <div className={styles.usageBar}>
                                  <div className={styles.usageFill} style={{ width: '60%' }} />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={styles.intentBadge}>
                                <Zap size={12} /> Clicked upgrade
                              </span>
                            </td>
                            <td>
                              <div className={styles.actionMenu}>
                                <button 
                                  className={`${styles.actionButton} ${styles.upgradeButton}`}
                                  onClick={() => setUpgradeModal(item)}
                                >
                                  <ArrowUpRight size={14} /> Upgrade
                                </button>
                                <button 
                                  className={styles.iconButton}
                                  onClick={() => setRemindModal(item)}
                                >
                                  <Mail size={14} /> Nudge
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className={styles.emptyState}>
                            <Gift size={32} />
                            <p>No free users</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className={styles.tabContent}>
                <div className={styles.tableHeader}>
                  <h2>All Transactions</h2>
                  <span>{filteredData.length} transactions</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Parent</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length > 0 ? (
                        (filteredData as Transaction[]).map(item => (
                          <tr key={item.id} className={styles.tableRow}>
                            <td>
                              <span className={styles.transactionId}>#{item.transaction_id}</span>
                            </td>
                            <td>
                              <span className={styles.parentName}>{item.parent_name}</span>
                            </td>
                            <td>
                              <span className={styles.amountText}>₹{item.amount.toLocaleString()}</span>
                            </td>
                            <td>
                              <span className={styles.methodBadge}>
                                {item.method === 'upi' && <QrCode size={12} />}
                                {item.method === 'card' && <CreditCard size={12} />}
                                {item.method === 'netbanking' && <Landmark size={12} />}
                                {item.method === 'cash' && <Banknote size={12} />}
                                {item.method}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${getStatusColor(item.status)}`}>
                                {item.status === 'success' && <CheckCircle2 size={12} />}
                                {item.status === 'failed' && <XSquare size={12} />}
                                {item.status === 'refunded' && <RotateCcw size={12} />}
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <span className={styles.dateText}>{item.created_at}</span>
                            </td>
                            <td>
                              <div className={styles.actionMenu}>
                                <button 
                                  className={styles.iconButton}
                                  onClick={() => setViewPayment(item)}
                                >
                                  <Eye size={14} /> View
                                </button>
                                <button 
                                  className={styles.iconButton}
                                  onClick={() => window.open(item.invoice_url, '_blank')}
                                >
                                  <FileText size={14} /> Invoice
                                </button>
                                {item.status === 'success' && (
                                  <button 
                                    className={styles.iconButtonDanger}
                                    onClick={() => handleRefund(item.id)}
                                  >
                                    <RotateCcw size={14} /> Refund
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className={styles.emptyState}>
                            <Receipt size={32} />
                            <p>No transactions yet</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Schools Tab */}
            {activeTab === 'schools' && (
              <div className={styles.tabContent}>
                <div className={styles.tableHeader}>
                  <h2>Schools</h2>
                  <span>{(Array.isArray(schoolPayments) ? schoolPayments : []).length} schools</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>School</th>
                        <th>Plan</th>
                        <th>Students</th>
                        <th>Rev.</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(schoolPayments) ? schoolPayments : []).length > 0 ? (
                        (Array.isArray(schoolPayments) ? schoolPayments : []).map((item: any) => (
                          <tr key={item.id} className={styles.tableRow}>
                            <td>
                              <div className={styles.parentCell}>
                                <div className={styles.parentAvatar}><Building2 size={20} /></div>
                                <div className={styles.parentInfo}>
                                  <span className={styles.parentName}>{item.school_name}</span>
                                  <span className={styles.parentMeta}>{item.school_code}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.planBadge} ${item.plan_type === 'paid' || item.plan_type === 'school' ? styles.planPaid : styles.planFree}`}>
                                {item.plan_name}
                              </span>
                            </td>
                            <td><span className={styles.parentMeta}>{item.student_count ?? 0}</span></td>
                            <td><span className={styles.amountText}>₹{(item.revenue_total ?? 0).toLocaleString()}</span></td>
                            <td><button className={styles.iconButton} onClick={() => setViewPayment(item)}><Eye size={14} /> View</button></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className={styles.emptyState}><Building2 size={32} /><p>No schools</p></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </>
        )}
      </section>

      {/* {/* View Payment / Detail Modal */}
      {viewPayment && (
        <div className={styles.modalOverlay} onClick={() => setViewPayment(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseFloat} onClick={() => setViewPayment(null)}>
              <X size={16} />
            </button>
            <div className={styles.modalDragHandle} />
            <div className={styles.modalCardBody}>
              <div className={styles.parentPreview}>
                <div className={styles.parentAvatarLarge}>
                  <Building2 size={32} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3>{viewPayment.school_name || viewPayment.parent_name || 'Details'}</h3>
                  {viewPayment.school_code && <p>{viewPayment.school_code}</p>}
                  {viewPayment.plan_name && <p>Plan: {viewPayment.plan_name}</p>}
                </div>
              </div>
              <div className={styles.planSummary}>
                <span>Revenue: ₹{(viewPayment.revenue_total ?? viewPayment.amount ?? 0).toLocaleString()}</span>
                {viewPayment.invoice_url && (
                  <button className={styles.viewProofButton} onClick={() => window.open(viewPayment.invoice_url, '_blank')}>
                    <Eye size={14} /> View Invoice
                  </button>
                )}
              </div>
              <div className={styles.drawerSection}>
                <h4 className={styles.drawerSectionTitle}><Info size={14} /> Details</h4>
                <div className={styles.planDetailStats}>
                  {viewPayment.student_count != null && (
                    <div className={styles.planDetailStat}>
                      <p className={styles.planDetailStatLabel}>Students</p>
                      <p className={styles.planDetailStatValue}>{viewPayment.student_count}</p>
                    </div>
                  )}
                  {viewPayment.transaction_id && (
                    <div className={styles.planDetailStat}>
                      <p className={styles.planDetailStatLabel}>Txn ID</p>
                      <p className={styles.planDetailStatValue} style={{ fontSize: '0.7rem' }}>{viewPayment.transaction_id}</p>
                    </div>
                  )}
                  {viewPayment.method && (
                    <div className={styles.planDetailStat}>
                      <p className={styles.planDetailStatLabel}>Method</p>
                      <p className={styles.planDetailStatValue}>{viewPayment.method}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} onClick={() => setViewPayment(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Parent Detail Drawer */}
      {detailParentId && (
        <div className={styles.drawerOverlay} onClick={() => setDetailParentId(null)}>
          <div className={styles.drawerPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerDrag} />
            <button className={styles.drawerClose} onClick={() => setDetailParentId(null)}>
              <X size={18} />
            </button>
            <div className={styles.drawerBody}>
              {detailLoading ? (
                <div className={styles.drawerLoading}>
                  <div className={styles.drawerSpinner} />
                  <p>Loading details...</p>
                </div>
              ) : detailData ? (
                <>
                  {/* Header Card */}
                  <div className={styles.drawerHeader}>
                    <div className={styles.drawerHeaderRow}>
                      <div className={styles.drawerHeaderAvatar}>
                        {((detailData as any).name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.drawerHeaderInfo}>
                        <h3>{(detailData as any).name}</h3>
                        <p>{(detailData as any).email}</p>
                      </div>
                    </div>
                    <div className={styles.drawerBadgeRow}>
                      <span className={(detailData as any).registration_type === 'school' ? styles.regTypeBadge : styles.regTypeBadgeInd}>
                        {(detailData as any).registration_type === 'school' ? <Building2 size={11} /> : <User size={11} />}
                        {(detailData as any).registration_type === 'school' ? 'School' : 'Individual'}
                      </span>
                      <span className={styles.drawerPlanBadge}>
                        <Crown size={11} /> {(detailData as any).plan_name || 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Children */}
                  <div className={styles.drawerSection}>
                    <h4 className={styles.drawerSectionTitle}>
                      <Users size={14} /> Children ({((detailData as any).children || []).length})
                    </h4>
                    <div className={styles.drawerChildrenList}>
                      {((detailData as any).children || []).map((child: any) => (
                        <div key={child.id} className={styles.drawerChildCard}>
                          <div className={styles.drawerChildTop}>
                            <div className={styles.drawerChildAvatar}>
                              {child.photo_url ? (
                                <img src={child.photo_url} alt={child.name} className={styles.drawerChildImg} />
                              ) : (
                                (child.name || 'C').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className={styles.drawerChildInfo}>
                              <span className={styles.drawerChildName}>{child.name}</span>
                              {child.grade_name && <span className={styles.drawerChildGrade}>📚 {child.grade_name}</span>}
                            </div>
                          </div>
                          {child.school_name && (
                            <div className={styles.drawerChildSchool}>
                              <Building2 size={12} />
                              <span>{child.school_name}</span>
                              {child.section && <span> · Section {child.section}</span>}
                              {child.roll_number && <span> · Roll #{child.roll_number}</span>}
                            </div>
                          )}
                          <div className={styles.drawerChildStats}>
                            <span>⭐ {child.total_stars} stars</span>
                            <span>📖 {child.lessons_completed} lessons</span>
                            <span>📊 {child.avg_score}% avg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment History */}
                  <div className={styles.drawerSection}>
                    <h4 className={styles.drawerSectionTitle}>
                      <Receipt size={14} /> Payments ({((detailData as any).payments || []).length})
                    </h4>
                    <div className={styles.drawerPaymentList}>
                      {((detailData as any).payments || []).length > 0 ? (
                        ((detailData as any).payments || []).slice(0, 5).map((pay: any) => (
                          <div key={pay.id} className={styles.drawerPaymentRow}>
                            <div className={styles.drawerPaymentLeft}>
                              <span className={styles.drawerPaymentAmount}>₹{Number(pay.amount).toLocaleString()}</span>
                              <span className={styles.drawerPaymentMeta}>{pay.plan} · {pay.gateway}</span>
                            </div>
                            <div className={styles.drawerPaymentRight}>
                              <span className={styles.drawerPaymentDate}>{pay.paid_at ? new Date(pay.paid_at).toLocaleDateString() : pay.created_at ? new Date(pay.created_at).toLocaleDateString() : '—'}</span>
                              <span className={styles.drawerPaymentStatus} style={{ color: pay.status_color || '#6b7280' }}>{pay.status}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className={styles.drawerEmptyText}>No payments yet</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.drawerLoading}>
                  <p>Failed to load details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {feedback && <div className={styles.toast}>{feedback}</div>}
    </div>
    </main>
  );
}
