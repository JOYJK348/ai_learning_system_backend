'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdminPrefetch } from '@/core/hooks/useAdminPrefetch';
import AdminBottomNav from './_components/AdminBottomNav';
import AdminTopNav from './_components/AdminTopNav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { prefetchAll } = useAdminPrefetch(user?.id);

  useEffect(() => {
    if (!loading && user) prefetchAll();
  }, [loading, user, prefetchAll]);

  return (
    <>
      <AdminTopNav />
      {children}
      <AdminBottomNav />
    </>
  );
}
