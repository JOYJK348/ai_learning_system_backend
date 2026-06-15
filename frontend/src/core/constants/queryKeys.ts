export const adminKeys = {
  all:       ['admin'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  schools:   ['admin', 'schools'] as const,
  schoolDirectory: ['admin', 'schools', 'directory'] as const,
  students:  ['admin', 'students'] as const,
  parents:   ['admin', 'parents'] as const,
  parentDirectory: ['admin', 'parents', 'directory'] as const,
  parentDetail: (id: string) => ['admin', 'parents', 'detail', id] as const,
  payments:  ['admin', 'payments'] as const,
  paymentsStats: ['admin', 'payments', 'stats'] as const,
  paymentsTab: (tab: string) => ['admin', 'payments', 'tab', tab] as const,
  reports:   (range: string) => ['admin', 'reports', range] as const,
  curriculum: ['admin', 'curriculum'] as const,
  boards:     ['admin', 'boards'] as const,
  grades:     ['admin', 'grades'] as const,
  subjects:   ['admin', 'subjects'] as const,
  chapters:   ['admin', 'chapters'] as const,
  lessons:    ['admin', 'lessons'] as const,
  quizzes:   ['admin', 'quizzes'] as const,
  videos:    ['admin', 'videos'] as const,
  activities: ['admin', 'activities'] as const,
};

export const parentKeys = {
  all:        ['parent'] as const,
  me:         ['parent', 'me'] as const,
  children:   ['parent', 'children'] as const,
  dashboard:  ['parent', 'dashboard'] as const,
  plans:      ['parent', 'plans'] as const,
  subscription: ['parent', 'subscription'] as const,
  payments:   ['parent', 'payments'] as const,
  childProgress: (id: string) => ['parent', 'child', id, 'progress'] as const,
  childQuizzes: (id: string) => ['parent', 'child', id, 'quizzes'] as const,
  childBadges: (id: string) => ['parent', 'child', id, 'badges'] as const,
  childTerms: (id: string) => ['parent', 'child', id, 'terms'] as const,
  childChapterProgress: (id: string) => ['parent', 'child', id, 'chapters'] as const,
};

export const schoolAdminKeys = {
  me: (schoolId?: string | null) => ['school-admin', 'me', schoolId] as const,
  curriculumGrades: (schoolId?: string | null) => ['school-admin', 'curriculum-grades', schoolId] as const,
  curriculum: (schoolId?: string | null, gradeId?: string | null) =>
    ['school-admin', 'curriculum', schoolId, gradeId] as const,
  payments: (schoolId?: string | null) => ['school-admin', 'payments', schoolId] as const,
  plans: (schoolId?: string | null) => ['school-admin', 'plans', schoolId] as const,
};
