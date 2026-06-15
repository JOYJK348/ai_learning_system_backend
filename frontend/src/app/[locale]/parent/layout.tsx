'use client';

import type { ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ParentTopNav from './_components/ParentTopNav';
import ParentBottomNav from './_components/ParentBottomNav';

export default function ParentLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { logout: authLogout } = useAuth();

  const handleLogout = async () => {
    await authLogout();
    router.push(`/${locale}/login`);
  };

  return (
    <>
      <ParentTopNav onLogout={handleLogout} />
      {children}
      <ParentBottomNav onLogout={handleLogout} />
    </>
  );
}
