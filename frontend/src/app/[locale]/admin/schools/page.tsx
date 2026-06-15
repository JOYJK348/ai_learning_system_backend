'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  CreditCard,
  Download,
  Edit3,
  Eye,
  GraduationCap,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Crown,
  Gift,
  DollarSign,
  BarChart3,
  FileText,
  Send,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  Activity,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Settings,
  Lock,
  Unlock,
  Upload,
  FileUp,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

type School = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  plan_type: 'free' | 'trial' | 'paid';
  plan_name: string;
  plan_price: number;
  setup_fee: number;
  discount_percent: number;
  trial_days: number;
  status: 'active' | 'inactive' | 'trial_expired' | 'payment_pending';
  admin_id?: string;
  admin_name?: string;
  admin_email?: string;
  admin_phone?: string;
  student_count: number;
  student_limit: number;
  revenue_this_month: number;
  revenue_total: number;
  last_payment_date?: string;
  last_payment_amount?: number;
  plan_start_date?: string;
  plan_end_date?: string;
  days_until_expiry: number;
  features: {
    videos: boolean;
    quizzes: boolean;
    activities: boolean;
    reports: boolean;
    ai_tutor: boolean;
    bulk_import: boolean;
  };
  created_at: string;
  updated_at: string;
};

type SchoolStats = {
  total_schools: number;
  active_schools: number;
  inactive_schools: number;
  trial_schools: number;
  paid_schools: number;
  total_revenue: number;
  revenue_this_month: number;
  total_students: number;
  total_admins: number;
  expiring_soon: number;
  trial_expiring: number;
};

type SchoolDirectoryData = {
  schools: School[];
  stats: SchoolStats | null;
};

type PlanType = {
  id: string;
  name: string;
  price: number;
  features: string[];
};

const planOptions: PlanType[] = [
  { id: 'free', name: 'Free', price: 0, features: ['Basic videos', 'Limited quizzes'] },
  { id: 'trial', name: 'Trial', price: 0, features: ['Full access 14 days'] },
  { id: 'paid_basic', name: 'Paid Basic', price: 2999, features: ['Full videos', 'All quizzes', 'Reports'] },
  { id: 'paid_premium', name: 'Paid Premium', price: 4999, features: ['Everything + AI Tutor', 'Bulk import', 'Priority support'] },
  { id: 'paid_enterprise', name: 'Enterprise', price: 9999, features: ['Custom features', 'Dedicated support', 'White-label'] },
];

const statusConfig = {
  active: { label: 'Active', color: 'success', icon: CheckCircle2 },
  inactive: { label: 'Inactive', color: 'danger', icon: Ban },
  trial_expired: { label: 'Trial Expired', color: 'warning', icon: AlertTriangle },
  payment_pending: { label: 'Payment Pending', color: 'warning', icon: Clock },
};

const planConfig = {
  free: { label: 'Free', color: 'gray', icon: Gift },
  trial: { label: 'Trial', color: 'purple', icon: Clock },
  paid: { label: 'Paid', color: 'gold', icon: Crown },
};

export default function SchoolsAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();

  const queryClient = useQueryClient();

  const { data: schoolsData, isLoading } = useQuery<SchoolDirectoryData>({
    queryKey: [...adminKeys.schoolDirectory, user?.id],
    queryFn: () => adminApi.schoolDirectory() as Promise<SchoolDirectoryData>,
    enabled: !loading && Boolean(user),
    staleTime: 60_000,
  });

  const schools = Array.isArray(schoolsData?.schools) ? schoolsData.schools : [];
  const stats = schoolsData?.stats ?? null;

  
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set());
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [detailSchool, setDetailSchool] = useState<School | null>(null);
  const [drawerStudents, setDrawerStudents] = useState<any[] | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentsList, setShowStudentsList] = useState(false);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    plan_type: 'trial' as 'free' | 'trial' | 'paid',
    plan_price: '',
    setup_fee: '',
    discount_percent: '',
    trial_days: '14',
    student_limit: '100',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    features: {
      videos: true,
      quizzes: true,
      activities: true,
      reports: true,
      ai_tutor: false,
      bulk_import: false,
    },
  });

  const [feedback, setFeedback] = useState<string | null>(null);

  // Add Student Modal State
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [gradesList, setGradesList] = useState<any[]>([]);
  const [parentSearchResults, setParentSearchResults] = useState<any[]>([]);
  const [isSearchingParent, setIsSearchingParent] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    full_name: '',
    date_of_birth: '',
    grade_id: '',
    section: '',
    roll_number: '',
    parent_id: '',
    parent_search: '',
    parent_selected: null as any
  });
  const [isSaving, setIsSaving] = useState(false);


  // Bulk Upload State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  const filteredSchools = useMemo(() => {
    let filtered = [...schools];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.admin_name?.toLowerCase().includes(q)
      );
    }
    
    if (planFilter) {
      filtered = filtered.filter(s => s.plan_type === planFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    filtered.sort((a, b) => {
      const aVal = a[sortField as keyof School];
      const bVal = b[sortField as keyof School];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    
    return filtered;
  }, [schools, searchQuery, planFilter, statusFilter, sortField, sortOrder]);

  const loadDrawerStudents = async (schoolId: string) => {
    if (showStudentsList) {
      setShowStudentsList(false);
      return;
    }
    setLoadingStudents(true);
    setShowStudentsList(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/schools/${schoolId}/students`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setDrawerStudents(data.data || []);
      } else {
        showFeedback(data.error || 'Failed to load students');
      }
    } catch (e) {
      showFeedback('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const downloadCSVTemplate = () => {
    const template = 'full_name,date_of_birth,grade_name,section,roll_number\nRahul Kumar,2010-05-12,Grade 5,A,R001\nPriya Sharma,2011-03-22,Grade 4,B,';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseBulkCSV = (file: File) => {
    setBulkParseError(null);
    setBulkRows([]);
    setBulkResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          setBulkParseError('File is empty or has only headers.');
          return;
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const required = ['full_name', 'grade_name'];
        const missing = required.filter(r => !headers.includes(r));
        if (missing.length) {
          setBulkParseError(`Missing required columns: ${missing.join(', ')}`);
          return;
        }
        const rows = lines.slice(1).map((line, idx) => {
          const vals = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((h, i) => { row[h] = vals[i] || ''; });
          row._rowNum = idx + 2;
          return row;
        }).filter(r => r.full_name);
        if (rows.length === 0) {
          setBulkParseError('No valid student rows found.');
          return;
        }
        if (rows.length > 500) {
          setBulkParseError('Maximum 500 rows allowed per upload.');
          return;
        }
        setBulkRows(rows);
      } catch {
        setBulkParseError('Failed to parse CSV. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const submitBulkUpload = async () => {
    if (!detailSchool || bulkRows.length === 0) return;
    setIsBulkUploading(true);
    setBulkResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/schools/${detailSchool.id}/students/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ students: bulkRows }),
      });
      const data = await res.json();
      if (res.ok || data.data) {
        setBulkResult(data.data);
        showFeedback(data.message || 'Bulk upload complete!');
        if (showStudentsList) {
          setShowStudentsList(false);
          loadDrawerStudents(detailSchool.id);
        }
      } else {
        showFeedback(data.error || 'Bulk upload failed');
        setBulkParseError(data.error || 'Server rejected the upload.');
      }
    } catch {
      showFeedback('Network error during bulk upload');
    } finally {
      setIsBulkUploading(false);
    }
  };

  const openAddStudentModal = async () => {
    if (!detailSchool) return;
    setAddStudentModalOpen(true);
    setAddStudentForm({
      full_name: '',
      date_of_birth: '',
      grade_id: '',
      section: '',
      roll_number: '',
      parent_id: '',
      parent_search: '',
      parent_selected: null
    });
    setParentSearchResults([]);
    
    // Fetch grades
    try {
      const res = await fetch(`${API_BASE}/api/admin/schools/${detailSchool.id}/grades`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setGradesList(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load grades', e);
    }
  };

  const handleParentSearch = async (query: string) => {
    setAddStudentForm(prev => ({ ...prev, parent_search: query }));
    if (query.length < 2) {
      setParentSearchResults([]);
      return;
    }
    setIsSearchingParent(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/parents/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setParentSearchResults(data.data || []);
    } catch (e) {
      console.error('Failed to search parents', e);
    } finally {
      setIsSearchingParent(false);
    }
  };

  const submitAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailSchool) return;
    setIsAddingStudent(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/schools/${detailSchool.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addStudentForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('Student added successfully!');
        setAddStudentModalOpen(false);
        // Refresh students list if it's currently showing
        if (showStudentsList) {
          setShowStudentsList(false);
          loadDrawerStudents(detailSchool.id);
        }
      } else {
        showFeedback(data.error || 'Failed to add student');
      }
    } catch (e) {
      showFeedback('Failed to add student');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const openForm = (school?: School) => {
    setEditingSchool(school ?? null);
    setFormOpen(true);
    if (school) {
      setFormValues({
        name: school.name,
        address: school.address,
        city: school.city,
        state: school.state,
        pincode: school.pincode,
        phone: school.phone,
        email: school.email,
        website: school.website || '',
        plan_type: school.plan_type,
        plan_price: String(school.plan_price),
        setup_fee: String(school.setup_fee),
        discount_percent: String(school.discount_percent),
        trial_days: String(school.trial_days),
        student_limit: String(school.student_limit),
        admin_name: school.admin_name || '',
        admin_email: school.admin_email || '',
        admin_phone: school.admin_phone || '',
        features: school.features,
      });
    } else {
      setFormValues({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        website: '',
        plan_type: 'trial',
        plan_price: '',
        setup_fee: '',
        discount_percent: '',
        trial_days: '14',
        student_limit: '100',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        features: {
          videos: true,
          quizzes: true,
          activities: true,
          reports: true,
          ai_tutor: false,
          bulk_import: false,
        },
      });
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingSchool(null);
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const saveSchool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValues.name || !formValues.email || !formValues.phone) {
      showFeedback('Name, email, and phone are required');
      return;
    }

    setIsSaving(true);
    const method = editingSchool ? 'PUT' : 'POST';
    const endpoint = editingSchool 
      ? `${API_BASE}/api/admin/schools/${editingSchool.id}` 
      : `${API_BASE}/api/admin/schools`;

    const payload = {
      ...formValues,
      plan_price: Number(formValues.plan_price) || 0,
      setup_fee: Number(formValues.setup_fee) || 0,
      discount_percent: Number(formValues.discount_percent) || 0,
      trial_days: Number(formValues.trial_days) || 14,
      student_limit: Number(formValues.student_limit) || 100,
    };

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        showFeedback(data?.error ?? 'Could not save school');
      } else {
        showFeedback(`School ${editingSchool ? 'updated' : 'created'} successfully`);
        closeForm();
        queryClient.invalidateQueries({ queryKey: adminKeys.schoolDirectory });
      }
    } catch (error) {
      showFeedback('Save failed, try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSchool = async (school: School) => {
    const confirm = window.confirm(`Delete school "${school.name}"?\n\nThis will remove all associated students and data.`);
    if (!confirm) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/schools/${school.id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      if (response.ok) {
        showFeedback('School deleted');
        queryClient.invalidateQueries({ queryKey: adminKeys.schoolDirectory });
      } else {
        const data = await response.json();
        showFeedback(data?.error ?? 'Delete failed');
      }
    } catch (error) {
      showFeedback('Delete failed, try again.');
    }
  };

  const toggleSchoolStatus = async (school: School) => {
    const newStatus = school.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`${API_BASE}/api/admin/schools/${school.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });
      if (response.ok) {
        showFeedback(`School ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        queryClient.invalidateQueries({ queryKey: adminKeys.schoolDirectory });
      }
    } catch (e) {
      showFeedback('Status update failed');
    }
  };

  const renewPlan = async (school: School) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/schools/${school.id}/renew`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        showFeedback('Plan renewed successfully');
        queryClient.invalidateQueries({ queryKey: adminKeys.schoolDirectory });
      }
    } catch (e) {
      showFeedback('Renewal failed');
    }
  };

  const sendReminder = async (school: School) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/schools/${school.id}/remind`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        showFeedback('Reminder sent');
      }
    } catch (e) {
      showFeedback('Failed to send reminder');
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'City', 'Plan', 'Status', 'Students', 'Revenue', 'Expiry'];
    const rows = filteredSchools.map(s => [
      s.name, s.email, s.phone, s.city, s.plan_name, s.status,
      s.student_count, s.revenue_total, s.plan_end_date || 'N/A'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schools-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showFeedback('CSV exported');
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedSchools);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSchools(newSet);
  };

  const selectAll = () => {
    if (selectedSchools.size === filteredSchools.length) {
      setSelectedSchools(new Set());
    } else {
      setSelectedSchools(new Set(filteredSchools.map(s => s.id)));
    }
  };

  const bulkAction = async (action: string) => {
    const ids = Array.from(selectedSchools);
    if (ids.length === 0) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/schools/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
        credentials: 'include',
      });
      if (response.ok) {
        showFeedback(`${ids.length} schools ${action}d`);
        setSelectedSchools(new Set());
        queryClient.invalidateQueries({ queryKey: adminKeys.schoolDirectory });
      }
    } catch (e) {
      showFeedback('Bulk action failed');
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return styles.planFree;
      case 'trial': return styles.planTrial;
      case 'paid': return styles.planPaid;
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'inactive': return styles.statusInactive;
      case 'trial_expired': return styles.statusExpired;
      case 'payment_pending': return styles.statusPending;
      default: return '';
    }
  };

  const getExpiryColor = (days: number) => {
    if (days <= 0) return styles.expiryExpired;
    if (days <= 7) return styles.expirySoon;
    return styles.expiryGood;
  };

  if (loading || !user) return null;

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>School directory</p>
          <h1 className={styles.title}>School management</h1>
          <p className={styles.subtitle}>
            Manage all schools, their plans, admins, and revenue. Track performance and handle renewals.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/${locale}/admin`} className={styles.secondaryButton}>
            <ChevronRight size={16} /> Back to dashboard
          </Link>
          <button className={styles.secondaryButton} onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className={styles.primaryButton} onClick={() => openForm()}>
            <Plus size={18} /> Add school
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <section className={styles.kpiGrid}>
          <article className={styles.kpiCard}>
            <div className={styles.kpiIcon}><Building2 size={20} /></div>
            <div className={styles.kpiContent}>
              <p className={styles.kpiLabel}>Total Schools</p>
              <h2>{stats.total_schools}</h2>
              <span className={styles.kpiMeta}>
                {stats.active_schools} active • {stats.inactive_schools} inactive
              </span>
            </div>
          </article>
          <article className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiPurple}`}><Clock size={20} /></div>
            <div className={styles.kpiContent}>
              <p className={styles.kpiLabel}>Trial Schools</p>
              <h2>{stats.trial_schools}</h2>
              <span className={styles.kpiMeta}>{stats.trial_expiring} expiring soon</span>
            </div>
          </article>
          <article className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiGold}`}><Crown size={20} /></div>
            <div className={styles.kpiContent}>
              <p className={styles.kpiLabel}>Paid Schools</p>
              <h2>{stats.paid_schools}</h2>
              <span className={styles.kpiMeta}>Revenue generating</span>
            </div>
          </article>
          <article className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiGreen}`}><DollarSign size={20} /></div>
            <div className={styles.kpiContent}>
              <p className={styles.kpiLabel}>This Month</p>
              <h2>₹{stats.revenue_this_month.toLocaleString()}</h2>
              <span className={styles.kpiMeta}>Total: ₹{stats.total_revenue.toLocaleString()}</span>
            </div>
          </article>
          <article className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiTeal}`}><GraduationCap size={20} /></div>
            <div className={styles.kpiContent}>
              <p className={styles.kpiLabel}>Total Students</p>
              <h2>{stats.total_students.toLocaleString()}</h2>
              <span className={styles.kpiMeta}>{stats.total_admins} admins</span>
            </div>
          </article>
          <article className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiRed}`}><AlertTriangle size={20} /></div>
            <div className={styles.kpiContent}>
              <p className={styles.kpiLabel}>Expiring Soon</p>
              <h2>{stats.expiring_soon}</h2>
              <span className={styles.kpiMeta}>Within 7 days</span>
            </div>
          </article>
        </section>
      )}

      {/* Filters */}
      <section className={styles.filterSection}>
        <div className={styles.filterRow}>
          <div className={styles.searchGroup}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, email, city, or admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="trial">Trial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <Shield size={16} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="trial_expired">Trial Expired</option>
              <option value="payment_pending">Payment Pending</option>
            </select>
          </div>
          <div className={styles.sortGroup}>
            <span>Sort by:</span>
            <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
              <option value="created_at">Date</option>
              <option value="name">Name</option>
              <option value="student_count">Students</option>
              <option value="revenue_total">Revenue</option>
              <option value="plan_end_date">Expiry</option>
            </select>
            <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSchools.size > 0 && (
          <div className={styles.bulkBar}>
            <span>{selectedSchools.size} selected</span>
            <button onClick={() => bulkAction('activate')}><CheckCircle2 size={14} /> Activate</button>
            <button onClick={() => bulkAction('deactivate')}><Ban size={14} /> Deactivate</button>
            <button onClick={() => bulkAction('renew')}><RefreshCw size={14} /> Renew</button>
            <button onClick={() => bulkAction('remind')}><Send size={14} /> Remind</button>
            <button onClick={() => setSelectedSchools(new Set())}><X size={14} /> Clear</button>
          </div>
        )}
      </section>

      {/* Table */}
      <section className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>
            <h2>All Schools</h2>
            <span>{filteredSchools.length} schools</span>
          </div>
          <button className={styles.secondaryButton} onClick={() => openForm()}>
            <Plus size={16} /> New School
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCol}>
                  <input 
                    type="checkbox" 
                    checked={selectedSchools.size === filteredSchools.length && filteredSchools.length > 0}
                    onChange={selectAll}
                  />
                </th>
                <th>School</th>
                <th>Plan & Revenue</th>
                <th>Admin</th>
                <th>Students</th>
                <th>Status & Expiry</th>
                <th className={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.length > 0 ? (
                filteredSchools.map((school) => (
                  <React.Fragment key={school.id}>
                    <tr 
                      className={`${styles.tableRow} ${expandedSchool === school.id ? styles.expanded : ''}`}
                    >
                      <td className={styles.checkboxCol}>
                        <input 
                          type="checkbox" 
                          checked={selectedSchools.has(school.id)}
                          onChange={() => toggleSelection(school.id)}
                        />
                      </td>
                      <td>
                        <div className={styles.schoolCell}>
                          <div className={styles.schoolLogo}>
                            {school.logo_url ? (
                              <img src={school.logo_url} alt={school.name} />
                            ) : (
                              <Building2 size={24} />
                            )}
                          </div>
                          <div className={styles.schoolInfo}>
                            <span className={styles.schoolName}>{school.name}</span>
                            <span className={styles.schoolMeta}>
                              <MapPin size={12} /> {school.city}, {school.state}
                            </span>
                            <span className={styles.schoolMeta}>
                              <Phone size={12} /> {school.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.planCell}>
                          <span className={`${styles.planBadge} ${getPlanColor(school.plan_type)}`}>
                            {(() => { const PlanIcon = planConfig[school.plan_type]?.icon; return PlanIcon ? <PlanIcon size={12} /> : null; })()}
                            {school.plan_name}
                          </span>
                          <span className={styles.revenueText}>
                            ₹{school.revenue_this_month.toLocaleString()}/mo
                          </span>
                          <span className={styles.revenueTotal}>
                            Total: ₹{school.revenue_total.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.adminCell}>
                          <span className={styles.adminName}>{school.admin_name || '—'}</span>
                          <span className={styles.adminEmail}>{school.admin_email || ''}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.studentCell}>
                          <span className={styles.studentCount}>
                            <Users size={14} /> {school.student_count}
                          </span>
                          <span className={styles.studentLimit}>
                            / {school.student_limit} limit
                          </span>
                          <div className={styles.studentBar}>
                            <div 
                              className={styles.studentFill} 
                              style={{ width: `${Math.min((school.student_count / school.student_limit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.statusCell}>
                          <button 
                            className={`${styles.statusBadge} ${getStatusColor(school.status)}`}
                            onClick={() => toggleSchoolStatus(school)}
                          >
                            {(() => { const StatusIcon = statusConfig[school.status]?.icon; return StatusIcon ? <StatusIcon size={12} /> : null; })()}
                            {statusConfig[school.status]?.label || school.status}
                          </button>
                          <span className={`${styles.expiryText} ${getExpiryColor(school.days_until_expiry)}`}>
                            <Calendar size={12} />
                            {school.days_until_expiry <= 0 
                              ? 'Expired' 
                              : `${school.days_until_expiry} days left`
                            }
                          </span>
                        </div>
                      </td>
                      <td className={styles.actionsCol}>
                        <div className={styles.actionMenu}>
                          <button 
                            className={styles.iconButton} 
                            onClick={() => setDetailSchool(school)}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className={styles.iconButton} 
                            onClick={() => openForm(school)}
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            className={styles.iconButton} 
                            onClick={() => sendReminder(school)}
                            title="Send reminder"
                          >
                            <Mail size={16} />
                          </button>
                          <button 
                            className={styles.iconButton} 
                            onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
                            title="Quick view"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          <button 
                            className={styles.iconButtonDanger} 
                            onClick={() => deleteSchool(school)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {expandedSchool === school.id && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={7}>
                          <div className={styles.expandedContent}>
                            <div className={styles.expandedGrid}>
                              <div className={styles.expandedSection}>
                                <h4>Contact Info</h4>
                                <p><Mail size={14} /> {school.email}</p>
                                <p><Phone size={14} /> {school.phone}</p>
                                <p><MapPin size={14} /> {school.address}, {school.city}, {school.state} - {school.pincode}</p>
                                {school.website && (
                                  <p><ExternalLink size={14} /> {school.website}</p>
                                )}
                              </div>
                              <div className={styles.expandedSection}>
                                <h4>Plan Details</h4>
                                <p>Plan: {school.plan_name} (₹{school.plan_price})</p>
                                <p>Setup Fee: ₹{school.setup_fee}</p>
                                <p>Discount: {school.discount_percent}%</p>
                                <p>Trial: {school.trial_days} days</p>
                              </div>
                              <div className={styles.expandedSection}>
                                <h4>Features</h4>
                                <div className={styles.featuresList}>
                                  {Object.entries(school.features).map(([key, enabled]) => (
                                    <span key={key} className={enabled ? styles.featureOn : styles.featureOff}>
                                      {enabled ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                                      {key.replace('_', ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className={styles.expandedSection}>
                                <h4>Quick Actions</h4>
                                <div className={styles.quickActions}>
                                  <button onClick={() => renewPlan(school)}>
                                    <RefreshCw size={14} /> Renew Plan
                                  </button>
                                  <button onClick={() => sendReminder(school)}>
                                    <Send size={14} /> Send Reminder
                                  </button>
                                  <button onClick={() => router.push(`/${locale}/admin/students?school=${school.id}`)}>
                                    <Users size={14} /> View Students
                                  </button>
                                  <button onClick={() => setDetailSchool(school)}>
                                    <BarChart3 size={14} /> View Analytics
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    {isLoading ? 'Loading schools...' : 'No schools found. Add your first school!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* School Detail Drawer */}
      {detailSchool && (
        <div className={styles.drawerOverlay} onClick={() => { setDetailSchool(null); setShowStudentsList(false); setDrawerStudents(null); }}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                <div className={styles.drawerLogo}>
                  {detailSchool.logo_url ? (
                    <img src={detailSchool.logo_url} alt={detailSchool.name} />
                  ) : (
                    <Building2 size={32} />
                  )}
                </div>
                <div>
                  <h2>{detailSchool.name}</h2>
                  <span className={`${styles.planBadge} ${getPlanColor(detailSchool.plan_type)}`}>
                    {detailSchool.plan_name}
                  </span>
                </div>
              </div>
              <button className={styles.closeButton} onClick={() => setDetailSchool(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Contact */}
              <section className={styles.drawerSection}>
                <h3><MapPin size={16} /> Contact Information</h3>
                <div className={styles.drawerGrid}>
                  <div><label>Address</label><p>{detailSchool.address}</p></div>
                  <div><label>City</label><p>{detailSchool.city}</p></div>
                  <div><label>State</label><p>{detailSchool.state}</p></div>
                  <div><label>Pincode</label><p>{detailSchool.pincode}</p></div>
                  <div><label>Phone</label><p>{detailSchool.phone}</p></div>
                  <div><label>Email</label><p>{detailSchool.email}</p></div>
                </div>
              </section>

              {/* Plan & Revenue */}
              <section className={styles.drawerSection}>
                <h3><CreditCard size={16} /> Plan & Revenue</h3>
                <div className={styles.revenueCards}>
                  <div className={styles.revenueCard}>
                    <span>Monthly Price</span>
                    <strong>₹{detailSchool.plan_price.toLocaleString()}</strong>
                  </div>
                  <div className={styles.revenueCard}>
                    <span>This Month</span>
                    <strong>₹{detailSchool.revenue_this_month.toLocaleString()}</strong>
                  </div>
                  <div className={styles.revenueCard}>
                    <span>Total Revenue</span>
                    <strong>₹{detailSchool.revenue_total.toLocaleString()}</strong>
                  </div>
                  <div className={styles.revenueCard}>
                    <span>Last Payment</span>
                    <strong>{detailSchool.last_payment_date || 'N/A'}</strong>
                  </div>
                </div>
                <div className={styles.planTimeline}>
                  <div className={styles.timelineItem}>
                    <span>Start</span>
                    <strong>{detailSchool.plan_start_date || 'N/A'}</strong>
                  </div>
                  <div className={styles.timelineBar}>
                    <div 
                      className={styles.timelineProgress} 
                      style={{ 
                        width: `${Math.max(0, Math.min(100, (detailSchool.days_until_expiry / 30) * 100))}%`,
                        background: detailSchool.days_until_expiry <= 7 ? '#ef4444' : '#16a085'
                      }}
                    />
                  </div>
                  <div className={styles.timelineItem}>
                    <span>Expiry</span>
                    <strong className={detailSchool.days_until_expiry <= 7 ? styles.expiryUrgent : ''}>
                      {detailSchool.plan_end_date || 'N/A'} ({detailSchool.days_until_expiry} days)
                    </strong>
                  </div>
                </div>
              </section>

              {/* Admin */}
              <section className={styles.drawerSection}>
                <h3><Shield size={16} /> School Admin</h3>
                <div className={styles.adminCard}>
                  <div className={styles.adminAvatar}>
                    <Users size={24} />
                  </div>
                  <div className={styles.adminInfo}>
                    <strong>{detailSchool.admin_name || 'No admin assigned'}</strong>
                    <p>{detailSchool.admin_email || ''}</p>
                    <p>{detailSchool.admin_phone || ''}</p>
                  </div>
                  <button className={styles.secondaryButton}>
                    <Edit3 size={14} /> Change Admin
                  </button>
                </div>
              </section>

              {/* Students */}
              <section className={styles.drawerSection}>
                <h3><GraduationCap size={16} /> Students</h3>
                <div className={styles.studentStats}>
                  <div className={styles.studentStat}>
                    <span>Total</span>
                    <strong>{detailSchool.student_count}</strong>
                  </div>
                  <div className={styles.studentStat}>
                    <span>Limit</span>
                    <strong>{detailSchool.student_limit}</strong>
                  </div>
                  <div className={styles.studentStat}>
                    <span>Available</span>
                    <strong>{detailSchool.student_limit - detailSchool.student_count}</strong>
                  </div>
                  <div className={styles.studentStat}>
                    <span>Usage</span>
                    <strong>{Math.round((detailSchool.student_count / detailSchool.student_limit) * 100)}%</strong>
                  </div>
                </div>
                <div className={styles.studentActionBar}>
                  <button 
                    className={styles.primaryButton}
                    onClick={() => loadDrawerStudents(detailSchool.id)}
                  >
                    <Users size={16} /> {showStudentsList ? 'Hide Students' : 'View All Students'}
                  </button>
                  <button 
                    className={styles.secondaryButton}
                    onClick={openAddStudentModal}
                  >
                    <Plus size={16} /> Add Student
                  </button>
                  <button 
                    className={styles.bulkUploadButton}
                    onClick={() => { setBulkModalOpen(true); setBulkFile(null); setBulkRows([]); setBulkParseError(null); setBulkResult(null); }}
                    title="Bulk upload students via CSV"
                  >
                    <FileUp size={16} /> Bulk Upload
                  </button>
                </div>
                {showStudentsList && (
                  <div className={styles.inlineStudentsList} style={{ marginTop: '1rem', overflowX: 'auto' }}>
                    {loadingStudents ? (
                      <div className={styles.emptyState} style={{ padding: '1rem' }}>Loading students...</div>
                    ) : drawerStudents && drawerStudents.length > 0 ? (
                      <table className={styles.table} style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Class/Sec</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drawerStudents.map(student => (
                            <tr key={student.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{student.full_name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{student.email !== 'N/A' ? student.email : student.roll_number}</div>
                              </td>
                              <td>{student.grade !== 'N/A' ? student.grade : ''} {student.section !== 'N/A' ? student.section : ''}</td>
                              <td><span className={`${styles.statusBadge} ${getStatusColor(student.status.toLowerCase())}`}>{student.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className={styles.emptyState} style={{ padding: '1rem' }}>No students found for this school.</div>
                    )}
                  </div>
                )}
              </section>

              {/* Features */}
              <section className={styles.drawerSection}>
                <h3><Star size={16} /> Enabled Features</h3>
                <div className={styles.featuresGrid}>
                  {Object.entries(detailSchool.features).map(([key, enabled]) => (
                    <div key={key} className={`${styles.featureCard} ${enabled ? styles.featureEnabled : styles.featureDisabled}`}>
                      {enabled ? <Unlock size={16} /> : <Lock size={16} />}
                      <span>{key.replace('_', ' ')}</span>
                      <strong>{enabled ? 'Enabled' : 'Disabled'}</strong>
                    </div>
                  ))}
                </div>
              </section>

              {/* Actions */}
              <div className={styles.drawerActions}>
                <button className={styles.primaryButton} onClick={() => renewPlan(detailSchool)}>
                  <RefreshCw size={16} /> Renew Plan
                </button>
                <button className={styles.secondaryButton} onClick={() => sendReminder(detailSchool)}>
                  <Send size={16} /> Send Reminder
                </button>
                <button className={styles.secondaryButton} onClick={() => openForm(detailSchool)}>
                  <Edit3 size={16} /> Edit School
                </button>
                <button 
                  className={`${styles.secondaryButton} ${styles.dangerButton}`} 
                  onClick={() => {
                    deleteSchool(detailSchool);
                    setDetailSchool(null);
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {formOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} ${styles.modalWide}`}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.panelEyebrow}>School configuration</p>
                <h2 className={styles.modalTitle}>
                  {editingSchool ? 'Edit School' : 'Create New School'}
                </h2>
              </div>
              <button className={styles.closeButton} onClick={closeForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveSchool} className={styles.formGrid}>
              {/* Basic Info */}
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}><Building2 size={16} /> Basic Information</h3>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>School Name *</label>
                    <input
                      value={formValues.name}
                      onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                      placeholder="ABC Matriculation School"
                      required
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formValues.email}
                      onChange={(e) => setFormValues({...formValues, email: e.target.value})}
                      placeholder="school@example.com"
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Phone *</label>
                    <input
                      value={formValues.phone}
                      onChange={(e) => setFormValues({...formValues, phone: e.target.value})}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Website</label>
                    <input
                      value={formValues.website}
                      onChange={(e) => setFormValues({...formValues, website: e.target.value})}
                      placeholder="https://school.com"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}><MapPin size={16} /> Address</h3>
                <div className={styles.formFieldWide}>
                  <label>Address</label>
                  <input
                    value={formValues.address}
                    onChange={(e) => setFormValues({...formValues, address: e.target.value})}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>City</label>
                    <input
                      value={formValues.city}
                      onChange={(e) => setFormValues({...formValues, city: e.target.value})}
                      placeholder="Chennai"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>State</label>
                    <input
                      value={formValues.state}
                      onChange={(e) => setFormValues({...formValues, state: e.target.value})}
                      placeholder="Tamil Nadu"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Pincode</label>
                    <input
                      value={formValues.pincode}
                      onChange={(e) => setFormValues({...formValues, pincode: e.target.value})}
                      placeholder="600001"
                    />
                  </div>
                </div>
              </div>

              {/* Plan */}
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}><Crown size={16} /> Plan Configuration</h3>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Plan Type</label>
                    <select
                      value={formValues.plan_type}
                      onChange={(e) => {
                        const plan = planOptions.find(p => p.id === e.target.value);
                        setFormValues({
                          ...formValues,
                          plan_type: e.target.value as 'free' | 'trial' | 'paid',
                          plan_price: plan ? String(plan.price) : formValues.plan_price,
                        });
                      }}
                    >
                      {planOptions.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Monthly Price (₹)</label>
                    <input
                      type="number"
                      value={formValues.plan_price}
                      onChange={(e) => setFormValues({...formValues, plan_price: e.target.value})}
                      placeholder="2999"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Setup Fee (₹)</label>
                    <input
                      type="number"
                      value={formValues.setup_fee}
                      onChange={(e) => setFormValues({...formValues, setup_fee: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Discount %</label>
                    <input
                      type="number"
                      value={formValues.discount_percent}
                      onChange={(e) => setFormValues({...formValues, discount_percent: e.target.value})}
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Trial Days</label>
                    <input
                      type="number"
                      value={formValues.trial_days}
                      onChange={(e) => setFormValues({...formValues, trial_days: e.target.value})}
                      placeholder="14"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Student Limit</label>
                    <input
                      type="number"
                      value={formValues.student_limit}
                      onChange={(e) => setFormValues({...formValues, student_limit: e.target.value})}
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              {/* Admin */}
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}><Shield size={16} /> School Admin</h3>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Admin Name</label>
                    <input
                      value={formValues.admin_name}
                      onChange={(e) => setFormValues({...formValues, admin_name: e.target.value})}
                      placeholder="Kumar Sir"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Admin Email</label>
                    <input
                      type="email"
                      value={formValues.admin_email}
                      onChange={(e) => setFormValues({...formValues, admin_email: e.target.value})}
                      placeholder="admin@school.com"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Admin Phone</label>
                    <input
                      value={formValues.admin_phone}
                      onChange={(e) => setFormValues({...formValues, admin_phone: e.target.value})}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}><Star size={16} /> Features</h3>
                <div className={styles.featuresToggle}>
                  {Object.entries(formValues.features).map(([key, enabled]) => (
                    <label key={key} className={styles.toggleLabel}>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => setFormValues({
                          ...formValues,
                          features: {
                            ...formValues.features,
                            [key]: !enabled,
                          },
                        })}
                      />
                      <span className={styles.toggleSwitch}></span>
                      <span className={styles.toggleText}>{key.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.secondaryButton} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingSchool ? 'Save Changes' : 'Create School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className={styles.toast}>
          {feedback}
        </div>
      )}

      {/* Add Student Modal */}
      {addStudentModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setAddStudentModalOpen(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.panelEyebrow}>Student Administration</p>
                <h2 className={styles.modalTitle}>Add Student</h2>
              </div>
              <button className={styles.closeButton} onClick={() => setAddStudentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitAddStudent} className={styles.formGrid}>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>Full Name *</label>
                  <input 
                    type="text" required
                    value={addStudentForm.full_name}
                    onChange={e => setAddStudentForm(prev => ({...prev, full_name: e.target.value}))}
                    placeholder="e.g. Rahul Kumar"
                  />
                </div>

                <div className={styles.formField}>
                  <label>Date of Birth</label>
                  <input 
                    type="date"
                    value={addStudentForm.date_of_birth}
                    onChange={e => setAddStudentForm(prev => ({...prev, date_of_birth: e.target.value}))}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>Grade *</label>
                  <select 
                    required
                    value={addStudentForm.grade_id}
                    onChange={e => setAddStudentForm(prev => ({...prev, grade_id: e.target.value}))}
                  >
                    <option value="">-- Select Grade --</option>
                    {gradesList.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Section</label>
                  <input 
                    type="text"
                    value={addStudentForm.section}
                    onChange={e => setAddStudentForm(prev => ({...prev, section: e.target.value}))}
                    placeholder="e.g. A or Lotus"
                  />
                </div>

                <div className={styles.formField}>
                  <label>Roll Number (optional)</label>
                  <input 
                    type="text"
                    value={addStudentForm.roll_number}
                    onChange={e => setAddStudentForm(prev => ({...prev, roll_number: e.target.value}))}
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              <div className={styles.formFieldWide}>
                <label>Parent Search (optional)</label>
                <div className={styles.parentSearchContainer}>
                  {!addStudentForm.parent_selected ? (
                    <div className={styles.parentSearchInputWrapper}>
                      <input 
                        type="text"
                        value={addStudentForm.parent_search}
                        onChange={e => handleParentSearch(e.target.value)}
                        placeholder="Search by name, email, or phone..."
                      />
                      {isSearchingParent ? (
                        <RefreshCw size={16} className={styles.searchLoader} />
                      ) : (
                        <Search size={16} className={styles.parentSearchIcon} />
                      )}
                    </div>
                  ) : (
                    <div className={styles.parentSelectedBadge}>
                      <div className={styles.parentSelectedBadgeText}>
                        <strong>{addStudentForm.parent_selected.name}</strong>
                        <span>{addStudentForm.parent_selected.email || addStudentForm.parent_selected.phone || 'Linked parent'}</span>
                      </div>
                      <button 
                        type="button" 
                        className={styles.parentSelectedBadgeClear} 
                        onClick={() => setAddStudentForm(prev => ({...prev, parent_selected: null, parent_id: '', parent_search: ''}))}
                        title="Unlink Parent"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {!addStudentForm.parent_selected && parentSearchResults.length > 0 && (
                    <div className={styles.parentSearchResultsDropdown}>
                      {parentSearchResults.map(p => (
                        <div 
                          key={p.id} 
                          className={styles.parentSearchItem}
                          onClick={() => {
                            setAddStudentForm(prev => ({...prev, parent_selected: p, parent_id: p.id, parent_search: p.name}));
                            setParentSearchResults([]);
                          }}
                        >
                          <strong>{p.name}</strong>
                          <span>{p.email || p.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setAddStudentModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isAddingStudent}>
                  {isAddingStudent ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Upload Modal */}
      {bulkModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setBulkModalOpen(false)}>
          <div className={`${styles.modalCard} ${styles.modalWide}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.panelEyebrow}>Student Administration</p>
                <h2 className={styles.modalTitle}>Bulk Upload Students</h2>
              </div>
              <button className={styles.closeButton} onClick={() => setBulkModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.bulkModalBody}>

              {/* Step 1 — Download Template */}
              <div className={styles.bulkStep}>
                <div className={styles.bulkStepNumber}>1</div>
                <div className={styles.bulkStepContent}>
                  <h3>Download the Template</h3>
                  <p>Fill in student details using our CSV template. Columns: <code>full_name</code>, <code>date_of_birth</code>, <code>grade_name</code>, <code>section</code>, <code>roll_number</code>.</p>
                  <button className={styles.secondaryButton} onClick={downloadCSVTemplate}>
                    <Download size={16} /> Download CSV Template
                  </button>
                </div>
              </div>

              {/* Step 2 — Upload CSV */}
              <div className={styles.bulkStep}>
                <div className={styles.bulkStepNumber}>2</div>
                <div className={styles.bulkStepContent}>
                  <h3>Upload Your CSV</h3>
                  <label
                    className={`${styles.bulkDropZone} ${bulkFile ? styles.bulkDropZoneActive : ''}`}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={e => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.name.endsWith('.csv')) {
                        setBulkFile(file);
                        parseBulkCSV(file);
                      } else {
                        setBulkParseError('Please upload a .csv file');
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { setBulkFile(file); parseBulkCSV(file); }
                      }}
                    />
                    {bulkFile ? (
                      <div className={styles.bulkDropZoneFile}>
                        <FileText size={32} />
                        <span>{bulkFile.name}</span>
                        <small>{bulkRows.length > 0 ? `${bulkRows.length} rows ready` : 'Parsing...'}</small>
                      </div>
                    ) : (
                      <div className={styles.bulkDropZoneEmpty}>
                        <FileUp size={36} />
                        <span>Drag & drop your CSV here</span>
                        <small>or click to browse</small>
                      </div>
                    )}
                  </label>

                  {bulkParseError && (
                    <div className={styles.bulkError}>
                      <AlertCircle size={16} />
                      {bulkParseError}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 — Preview */}
              {bulkRows.length > 0 && !bulkResult && (
                <div className={styles.bulkStep}>
                  <div className={styles.bulkStepNumber}>3</div>
                  <div className={styles.bulkStepContent}>
                    <h3>Preview <span>({bulkRows.length} students)</span></h3>
                    <div className={styles.bulkPreviewWrapper}>
                      <table className={styles.bulkPreviewTable}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Full Name</th>
                            <th>Grade</th>
                            <th>Section</th>
                            <th>DOB</th>
                            <th>Roll No.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkRows.slice(0, 10).map((row, i) => (
                            <tr key={i}>
                              <td>{row._rowNum}</td>
                              <td><strong>{row.full_name}</strong></td>
                              <td>{row.grade_name}</td>
                              <td>{row.section || '—'}</td>
                              <td>{row.date_of_birth || '—'}</td>
                              <td>{row.roll_number || 'Auto'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {bulkRows.length > 10 && (
                        <p className={styles.bulkPreviewMore}>... and {bulkRows.length - 10} more rows</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Result Summary */}
              {bulkResult && (
                <div className={styles.bulkResultSummary}>
                  <div className={`${styles.bulkResultStat} ${styles.bulkSuccess}`}>
                    <CheckCircle2 size={20} />
                    <div>
                      <strong>{bulkResult.success}</strong>
                      <span>Added</span>
                    </div>
                  </div>
                  <div className={`${styles.bulkResultStat} ${styles.bulkFailed}`}>
                    <AlertCircle size={20} />
                    <div>
                      <strong>{bulkResult.failed}</strong>
                      <span>Failed</span>
                    </div>
                  </div>
                  {bulkResult.errors.length > 0 && (
                    <div className={styles.bulkErrorList}>
                      <p><strong>Errors:</strong></p>
                      <ul>
                        {bulkResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className={styles.formActions}>
                <button className={styles.secondaryButton} onClick={() => setBulkModalOpen(false)}>
                  Close
                </button>
                {bulkRows.length > 0 && !bulkResult && (
                  <button
                    className={styles.primaryButton}
                    onClick={submitBulkUpload}
                    disabled={isBulkUploading}
                  >
                    {isBulkUploading
                      ? <><RefreshCw size={16} className={styles.searchLoader} /> Uploading...</>
                      : <><Upload size={16} /> Upload {bulkRows.length} Students</>
                    }
                  </button>
                )}
                {bulkResult && (
                  <button className={styles.secondaryButton} onClick={() => { setBulkFile(null); setBulkRows([]); setBulkResult(null); setBulkParseError(null); }}>
                    <RefreshCw size={16} /> Upload Another
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
