'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { parentApi } from '@/core/services/parentApi';
import { parentKeys } from '@/core/constants/queryKeys';
import type { ParentProfile, ChildSummary, ChildProgress, QuizAttempt, Badge, SubjectProgress, ParentDashboard } from '@/types/parent';

export function useParentData() {
  const queryClient = useQueryClient();
  const [activeChildId, setActiveChildIdState] = useState<string | null>(null);

  const me = useQuery({
    queryKey: parentKeys.me,
    queryFn: parentApi.me,
    staleTime: 5 * 60 * 1000,
  });

  const childrenRes = useQuery({
    queryKey: parentKeys.children,
    queryFn: parentApi.children,
    staleTime: 5 * 60 * 1000,
    select: (d) => d.children ?? [],
  });

  const children: ChildSummary[] = childrenRes.data ?? [];

  // On first load, set active child to first child
  if (!activeChildId && children.length > 0) {
    setActiveChildIdState(children[0].id);
  }

  const setActiveChildId = useCallback((id: string) => {
    setActiveChildIdState(id);
  }, []);

  const childProgress = useQuery({
    queryKey: parentKeys.childProgress(activeChildId ?? ''),
    queryFn: () => parentApi.childProgress(activeChildId!),
    enabled: !!activeChildId,
    staleTime: 60_000,
  });

  const childQuizzes = useQuery({
    queryKey: parentKeys.childQuizzes(activeChildId ?? ''),
    queryFn: () => parentApi.childQuizzes(activeChildId!),
    enabled: !!activeChildId,
    staleTime: 60_000,
  });

  const childBadges = useQuery({
    queryKey: parentKeys.childBadges(activeChildId ?? ''),
    queryFn: () => parentApi.childBadges(activeChildId!),
    enabled: !!activeChildId,
    staleTime: 60_000,
  });

  const childChapterProgress = useQuery({
    queryKey: parentKeys.childChapterProgress(activeChildId ?? ''),
    queryFn: () => parentApi.childChapterProgress(activeChildId!),
    enabled: !!activeChildId,
    staleTime: 60_000,
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: parentKeys.all });
  }, [queryClient]);

  return {
    parent: me.data as ParentProfile | undefined,
    children,
    activeChild: children.find((c) => c.id === activeChildId) ?? null,
    activeChildId,
    setActiveChildId,
    childProgress: childProgress.data as ChildProgress | undefined,
    childQuizzes: (childQuizzes.data as { quizzes: QuizAttempt[] } | undefined)?.quizzes ?? [],
    childBadges: (childBadges.data as { badges: Badge[] } | undefined)?.badges ?? [],
    childChapterProgress: childChapterProgress.data as SubjectProgress[] | undefined,
    loading: me.isLoading || childrenRes.isLoading || childProgress.isLoading,
    invalidateAll,
  };
}
