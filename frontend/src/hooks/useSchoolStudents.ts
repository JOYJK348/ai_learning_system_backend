'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export const schoolAdminKeys = {
  dashboard: (schoolId?: string | null) => ['school-admin', 'dashboard', schoolId] as const,
  students: (schoolId?: string | null) => ['school-admin', 'students', schoolId] as const,
};

async function fetchDashboard(schoolId: string | null | undefined) {
  const res = await fetch(`${API_BASE}/api/school-admin/dashboard`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

async function fetchStudents(schoolId: string | null | undefined, gradeId?: string) {
  const params = gradeId ? `?grade_id=${gradeId}` : '';
  const res = await fetch(`${API_BASE}/api/school-admin/students${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch students');
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
      queryFn: () => fetchDashboard(schoolId),
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      queryKey: schoolAdminKeys.students(schoolId),
      queryFn: () => fetchStudents(schoolId),
      staleTime: 60_000,
    });
  }, [schoolId, queryClient]);
}

export function useSchoolDashboard() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  return useQuery({
    queryKey: schoolAdminKeys.dashboard(schoolId),
    queryFn: () => fetchDashboard(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

export function useSchoolStudents() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  return useQuery({
    queryKey: schoolAdminKeys.students(schoolId),
    queryFn: () => fetchStudents(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export type CreateStudentInput = {
  full_name: string;
  email: string;
  mobile: string;
  grade_id?: string;
  section?: string;
  roll_number?: string;
};

export type CreateStudentResult = {
  id: string;
  full_name: string;
  email: string;
  username: string;
  password: string;
};

export function useCreateStudent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const res = await fetch(`${API_BASE}/api/school-admin/students`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create student');
      return json.data as CreateStudentResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.students(schoolId) });
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.dashboard(schoolId) });
    },
  });
}

export type UpdateStudentInput = {
  id: string;
  grade_id?: string;
  roll_number?: string;
  section?: string;
};

export function useUpdateStudent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: async (input: UpdateStudentInput) => {
      const { id, ...body } = input;
      const res = await fetch(`${API_BASE}/api/school-admin/students/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update student');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.students(schoolId) });
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.dashboard(schoolId) });
    },
  });
}

export function useDeleteStudent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/school-admin/students/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete student');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.students(schoolId) });
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.dashboard(schoolId) });
    },
  });
}

export function useBulkDeleteStudents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`${API_BASE}/api/school-admin/students/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          }).then((r) => r.json())
        )
      );
      const errors = results.filter((r) => r.status === 'rejected').map((r) => (r as PromiseRejectedResult).reason);
      if (errors.length > 0) throw new Error(`Failed to delete ${errors.length} students`);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.students(schoolId) });
      queryClient.invalidateQueries({ queryKey: schoolAdminKeys.dashboard(schoolId) });
    },
  });
}
