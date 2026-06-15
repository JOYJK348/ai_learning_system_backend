'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePrefetchSchoolData } from '@/hooks/useSchoolParents';
import { usePrefetchSchoolActivities } from '@/hooks/useSchoolActivities';
import { usePrefetchSchoolCurriculum } from '@/hooks/useSchoolCurriculum';
import { usePrefetchSchoolPayments } from '@/hooks/useSchoolPayments';
import { usePrefetchSchoolMe } from '@/hooks/useSchoolBranding';
import SchoolAdminTopNav from './_components/SchoolAdminTopNav';
import SchoolAdminBottomNav from './_components/SchoolAdminBottomNav';

export default function SchoolAdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  usePrefetchSchoolData();
  usePrefetchSchoolActivities();
  usePrefetchSchoolCurriculum();
  usePrefetchSchoolPayments();
  usePrefetchSchoolMe();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'school_admin')) {
      router.replace(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  if (loading || !user) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#f8faff', gap: '0.75rem' }}>
        <div style={{ width: '1.8rem', height: '1.8rem', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#94a3b8' }}>Loading...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <SchoolAdminTopNav />
      <div style={{ paddingBottom: '5.2rem' }}>
        {children}
      </div>
      <SchoolAdminBottomNav />
    </>
  );
}
