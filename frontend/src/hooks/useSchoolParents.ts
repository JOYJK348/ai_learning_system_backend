'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export const schoolAdminKeys = {
  dashboard: (schoolId?: string | null) => ['school-admin', 'dashboard', schoolId] as const,
  students: (schoolId?: string | null) => ['school-admin', 'students', schoolId] as const,
  parents: (schoolId?: string | null) => ['school-admin', 'parents', schoolId] as const,
};

async function fetchParents(schoolId: string | null | undefined) {
  const res = await fetch(`${API_BASE}/api/school-admin/parents`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch parents');
  return res.json();
}

async function fetchParent(schoolId: string | null | undefined, id: string) {
  const res = await fetch(`${API_BASE}/api/school-admin/parents/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch parent');
  return res.json();
}

export function usePrefetchSchoolData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  useEffect(() => {
    if (!schoolId) return;

    queryClient.prefetchQuery({
      queryKey: schoolAdminKeys.dashboard(schoolId),
      queryFn: () => fetch(`${API_BASE}/api/school-admin/dashboard`, { credentials: 'include' }).then((r) => r.json()),
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: schoolAdminKeys.students(schoolId),
      queryFn: () => fetch(`${API_BASE}/api/school-admin/students`, { credentials: 'include' }).then((r) => r.json()),
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: schoolAdminKeys.parents(schoolId),
      queryFn: () => fetchParents(schoolId),
      staleTime: 60_000,
    });
  }, [schoolId, queryClient]);
}

export function useSchoolParents() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  return useQuery({
    queryKey: schoolAdminKeys.parents(schoolId),
    queryFn: () => fetchParents(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useSchoolParent(id: string) {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  return useQuery({
    queryKey: [...schoolAdminKeys.parents(schoolId), id],
    queryFn: () => fetchParent(schoolId!, id),
    enabled: !!schoolId && !!id,
    staleTime: 30_000,
  });
}

export type CreateParentInput = {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  child_ids?: string[];
};

export type CreateParentResult = {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
};

export function useCreateParent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: async (input: CreateParentInput) => {
      const res = await fetch(`${API_BASE}/api/school-admin/parents`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create parent');
      return json.data as CreateParentResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.parents(schoolId) });
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.dashboard(schoolId) });
    },
  });
}

export function useUpdateParent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: async ({ id, name, phone }: { id: string; name?: string; phone?: string }) => {
      const res = await fetch(`${API_BASE}/api/school-admin/parents/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update parent');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.parents(schoolId) });
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.dashboard(schoolId) });
    },
  });
}

export function useDeleteParent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/school-admin/parents/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete parent');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.parents(schoolId) });
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.dashboard(schoolId) });
    },
  });
}

export function useLinkChild() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: async ({ parentId, studentId }: { parentId: string; studentId: string }) => {
      const res = await fetch(`${API_BASE}/api/school-admin/parents/${parentId}/children`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to link child');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.parents(schoolId) });
    },
  });
}

export function useUnlinkChild() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: async ({ parentId, studentId }: { parentId: string; studentId: string }) => {
      const res = await fetch(`${API_BASE}/api/school-admin/parents/${parentId}/children?student_id=${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to unlink child');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.parents(schoolId) });
    },
  });
}
