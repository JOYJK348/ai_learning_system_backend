const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', ...init });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `Failed to load ${path}`);
  return payload.data ?? payload;
}

type ReportsAggregate = {
  revenue: unknown;
  userStats: unknown;
  schoolStats: unknown;
  studentStats: unknown;
  engagement: unknown;
  subjectStats: unknown;
};

type SchoolDirectory = {
  schools: unknown[];
  stats: unknown;
};

type ParentDirectory = {
  parents: unknown[];
  monthlyRevenue: number;
};

export const adminApi = {
  dashboard: () =>
    fetchJson<unknown>('/api/admin/dashboard'),

  schools: () =>
    fetchJson<unknown>('/api/admin/schools'),

  schoolsStats: () =>
    fetchJson<unknown>('/api/admin/schools/stats'),

  schoolDirectory: async (): Promise<SchoolDirectory> => {
    const [schools, stats] = await Promise.all([
      fetchJson<unknown[]>('/api/admin/schools'),
      fetchJson<unknown>('/api/admin/schools/stats'),
    ]);
    return { schools: Array.isArray(schools) ? schools : [], stats };
  },

  students: () =>
    fetchJson<unknown>('/api/admin/students'),

  parents: () =>
    fetchJson<unknown>('/api/admin/parents'),

  parentDirectory: async (): Promise<ParentDirectory> => {
    const res = await fetch(`${BASE}/api/admin/parents`, { credentials: 'include' });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || 'Failed to load parents');
    const items = Array.isArray(payload.data) ? payload.data : [];
    const revenue = (payload as any)?.meta?.monthly_revenue ?? 0;
    return { parents: items, monthlyRevenue: revenue };
  },

  parentDetail: async (id: string): Promise<unknown> =>
    fetchJson(`/api/admin/parents/${id}`),

  payments: (params?: string) =>
    fetchJson<unknown>(`/api/admin/payments${params ? `?${params}` : ''}`),

  paymentsStats: () =>
    fetchJson<unknown>('/api/admin/payments/stats'),

  paymentsApprovals: () =>
    fetchJson<unknown>('/api/admin/approvals'),

  paymentsParentsPlans: (params: string) =>
    fetchJson<unknown>(`/api/admin/parents/plans?${params}`),

  paymentsSchoolPayments: () =>
    fetchJson<unknown>('/api/admin/payments/school-payments'),

  paymentsPlans: () =>
    fetchJson<unknown>('/api/admin/plans'),

  reports: (range: string): Promise<ReportsAggregate> =>
    Promise.all([
      fetchJson(`/api/admin/reports/revenue?period=${range}`),
      fetchJson('/api/admin/reports/users'),
      fetchJson('/api/admin/reports/schools'),
      fetchJson('/api/admin/reports/students'),
      fetchJson('/api/admin/reports/engagement'),
      fetchJson('/api/admin/reports/subjects'),
    ]).then(([revenue, userStats, schoolStats, studentStats, engagement, subjectStats]) => ({
      revenue, userStats, schoolStats, studentStats, engagement, subjectStats,
    })),

  boards: () =>
    fetchJson<unknown[]>('/api/admin/boards'),

  grades: (boardId: string) =>
    fetchJson<unknown[]>(`/api/admin/grades?board_id=${boardId}`),

  subjects: (gradeId: string) =>
    fetchJson<unknown[]>(`/api/admin/subjects?grade_id=${gradeId}`),

  chapters: (subjectId: string) =>
    fetchJson<unknown[]>(`/api/admin/chapters?subject_id=${subjectId}`),

  lessons: (chapterId: string) =>
    fetchJson<unknown[]>(`/api/admin/lessons?chapter_id=${chapterId}`),

  quizzes: () =>
    fetchJson<unknown>('/api/admin/quizzes'),

  videos: () =>
    fetchJson<unknown>('/api/admin/lessons'),

  activities: () =>
    fetchJson<unknown>('/api/admin/activities'),
};
