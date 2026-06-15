'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { schoolAdminKeys } from '@/core/constants/queryKeys';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export interface SchoolBranding {
  name: string;
  logo_url: string | null;
}

async function fetchSchoolMe() {
  const res = await fetch(`${API_BASE}/api/school-admin/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load school');
  const json = await res.json();
  return json as { user: unknown; school: Record<string, unknown> | null };
}

export function clearSchoolBrandingCache(schoolId?: string | null) {
  try {
    const key = schoolId ? `zhi_school_branding_${schoolId}` : 'zhi_school_branding';
    localStorage.removeItem(key);
  } catch {}
}

export function useSchoolBranding(schoolId?: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: schoolAdminKeys.me(schoolId),
    queryFn: fetchSchoolMe,
    enabled: !!schoolId,
    staleTime: 300_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const branding: SchoolBranding = {
    name: (data?.school?.name as string) || '',
    logo_url: (data?.school?.logo_url as string) || null,
  };

  return {
    school: isLoading ? null : branding,
    loaded: !isLoading,
    reload: () => queryClient.invalidateQueries({ queryKey: schoolAdminKeys.me(schoolId) }),
  };
}

export function usePrefetchSchoolMe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  useEffect(() => {
    if (!schoolId) return;
    queryClient.prefetchQuery({
      queryKey: schoolAdminKeys.me(schoolId),
      queryFn: fetchSchoolMe,
      staleTime: 300_000,
    });
  }, [schoolId, queryClient]);
}
