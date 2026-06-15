'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function StudentRootPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'en';

  useEffect(() => {
    // Redirecting to the professional dashboard home
    router.replace(`/${locale}/student/Home`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Entering Adventure Portal...</p>
      </div>
    </div>
  );
}
