'use client';

import { useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import { useCallback } from 'react';

type PrefetchItem = {
  key: readonly string[];
  fn: () => Promise<unknown>;
  scoped?: boolean;
};

const groupA: PrefetchItem[] = [
  { key: adminKeys.dashboard, fn: adminApi.dashboard },
  { key: adminKeys.schoolDirectory, fn: adminApi.schoolDirectory, scoped: true },
  { key: adminKeys.students, fn: adminApi.students },
  { key: adminKeys.parentDirectory, fn: adminApi.parentDirectory, scoped: true },
  { key: adminKeys.paymentsStats, fn: adminApi.paymentsStats },
  { key: adminKeys.paymentsTab('approvals'), fn: adminApi.paymentsApprovals },
  { key: adminKeys.boards, fn: adminApi.boards },
];

const groupB: PrefetchItem[] = [
  { key: adminKeys.reports('30d'), fn: () => adminApi.reports('30d') },
  { key: adminKeys.quizzes, fn: adminApi.quizzes },
  { key: adminKeys.videos, fn: adminApi.videos },
  { key: adminKeys.activities, fn: adminApi.activities },
];

function relayItem<T>(key: readonly string[], fn: () => Promise<T>) {
  return { key, fn };
}

export function useAdminPrefetch(userId?: string) {
  const queryClient = useQueryClient();

  const prefetchAll = useCallback(() => {
    const prefetch = (items: PrefetchItem[]) =>
      Promise.allSettled(
        items.map(({ key, fn, scoped }) => {
          const queryKey = scoped && userId ? [...key, userId] : [...key];
          return queryClient.prefetchQuery({ queryKey, queryFn: fn, staleTime: 60_000 });
        })
      );

    // Group A first to warm critical admin pages + boards
    prefetch(groupA).then(() => {
      // Group B: lower-priority pages
      prefetch(groupB);

      // Relay-prefetch curriculum hierarchy: boards → grades → subjects → chapters → lessons
      // This runs in background without blocking anything
      const boardData = queryClient.getQueryData<unknown[]>([...adminKeys.boards]);
      if (Array.isArray(boardData)) {
        const gradeItems = boardData.map(b => relayItem([...adminKeys.grades, (b as any)?.id, userId], () => adminApi.grades((b as any)?.id)));
        prefetch(gradeItems).then(() => {
          const allGrades = gradeItems.flatMap(gk => {
            const data = queryClient.getQueryData<unknown[]>(gk.key);
            return Array.isArray(data) ? data : [];
          });
          const subjectItems = allGrades.map(g => relayItem([...adminKeys.subjects, (g as any)?.id, userId], () => adminApi.subjects((g as any)?.id)));
          prefetch(subjectItems).then(() => {
            const allSubjects = subjectItems.flatMap(sk => {
              const data = queryClient.getQueryData<unknown[]>(sk.key);
              return Array.isArray(data) ? data : [];
            });
            const chapterItems = allSubjects.map(s => relayItem([...adminKeys.chapters, (s as any)?.id, userId], () => adminApi.chapters((s as any)?.id)));
            prefetch(chapterItems).then(() => {
              const allChapters = chapterItems.flatMap(ck => {
                const data = queryClient.getQueryData<unknown[]>(ck.key);
                return Array.isArray(data) ? data : [];
              });
              const lessonItems = allChapters.map(c => relayItem([...adminKeys.lessons, (c as any)?.id, userId], () => adminApi.lessons((c as any)?.id)));
              prefetch(lessonItems);
            });
          });
        });
      }
    });
  }, [queryClient, userId]);

  return { prefetchAll };
}
