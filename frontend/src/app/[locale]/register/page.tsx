'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Mail, Phone, GraduationCap, ArrowRight, CheckCircle2, AlertCircle,
  Compass, ArrowLeft, ShieldCheck, User
} from 'lucide-react';
import Image from 'next/image';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export default function RegisterParentPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    child_name: '',
    child_grade_id: '',
  });

  const { data: gradesData } = useQuery({
    queryKey: ['public', 'grades'],
    queryFn: () => fetch(`${BASE}/api/grades`).then(r => r.json()).then(d => d.data ?? []),
    staleTime: 10 * 60 * 1000,
  });
  const grades = Array.isArray(gradesData) ? gradesData : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('submitting');

    try {
      const res = await fetch(`${BASE}/api/auth/register-parent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_name: form.parent_name,
          parent_email: form.parent_email,
          parent_phone: form.parent_phone || null,
          child_name: form.child_name,
          child_grade_id: form.child_grade_id ? form.child_grade_id : null,
          school_id: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('form');
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col sm:items-center sm:justify-center bg-slate-50 font-sans p-0 sm:px-6 sm:py-12 relative overflow-x-hidden">
        {/* Back to Home Button */}
        <Link
          href="/"
          className="absolute sm:fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/60 hover:bg-white backdrop-blur-xl border border-slate-200 rounded-none text-slate-600 hover:text-indigo-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm hover:shadow-md group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform sm:w-4 sm:h-4" />
          <span>Home</span>
        </Link>

        <div className="hidden sm:block absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[120px] -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[120px] -ml-48 -mb-48" />
        </div>

        <div className="w-full sm:max-w-md relative z-10 flex flex-col items-center">
          <div className="w-full min-h-screen sm:min-h-0">
            <div className="bg-white p-8 sm:p-10 border-none sm:border border-slate-200 shadow-none sm:shadow-xl text-center rounded-none min-h-screen sm:min-h-0 flex flex-col justify-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Registration Submitted!</h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-6 px-4">
                Thank you, <strong>{form.parent_name}</strong>! Your registration for <strong>{form.child_name}</strong> has been submitted for approval.
              </p>

              <div className="bg-amber-50 border border-amber-100 p-5 text-left mb-6">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">What happens next?</p>
                <div className="flex items-start gap-3 mb-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span className="text-xs text-amber-900 font-semibold">Admin reviews your application</span>
                </div>
                <div className="flex items-start gap-3 mb-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span className="text-xs text-amber-900 font-semibold">You receive login credentials via email</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span className="text-xs text-amber-900 font-semibold">Start tracking your child&apos;s learning!</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-semibold mb-6">We&apos;ll notify you at <strong className="text-slate-800">{form.parent_email}</strong></p>

              <Link
                href="/login"
                className="w-full py-4 bg-slate-900 text-white rounded-none font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 uppercase text-center block"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col sm:items-center sm:justify-center bg-slate-50 font-sans p-0 sm:px-6 sm:py-12 relative overflow-x-hidden">

      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute sm:fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/60 hover:bg-white backdrop-blur-xl border border-slate-200 rounded-none text-slate-600 hover:text-indigo-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm hover:shadow-md group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform sm:w-4 sm:h-4" />
        <span>Home</span>
      </Link>

      {/* Background decoration */}
      <div className="hidden sm:block absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[120px] -ml-48 -mb-48" />
      </div>

      <div className="w-full sm:max-w-md relative z-10 flex flex-col items-center">
        <div className="w-full min-h-screen sm:min-h-0">
          <div className="bg-white p-6 sm:p-10 border-none sm:border border-slate-200 shadow-none sm:shadow-2xl relative overflow-hidden rounded-none min-h-screen sm:min-h-0 flex flex-col">

            {/* Visual Top Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />

            {/* Logo Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 mb-6 pb-6 border-b border-slate-50 pt-12 sm:pt-0">
              <div className="shrink-0">
                <Image src="/assets/img/logo-removebg-preview.png" alt="ZHI" width={72} height={72} className="object-contain sm:w-[88px] sm:h-[88px]" />
              </div>
              <div className="flex flex-col">
                <p className="text-slate-900 font-black text-2xl sm:text-3xl leading-none tracking-tighter">ZHI <span className="text-blue-600">LearnAI</span></p>
                <p className="text-indigo-600/60 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-2.5 whitespace-nowrap">Learn While Playing</p>
              </div>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-none flex items-center justify-center border border-amber-100">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Register as Parent</h2>
                <p className="text-xs text-slate-500 font-medium">Fill in your details below</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Parent Details */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Your Name *</label>
                <input
                  suppressHydrationWarning
                  required
                  type="text"
                  value={form.parent_name}
                  onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner rounded-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    suppressHydrationWarning
                    required
                    type="email"
                    value={form.parent_email}
                    onChange={e => setForm(f => ({ ...f, parent_email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Phone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    suppressHydrationWarning
                    type="tel"
                    value={form.parent_phone}
                    onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner rounded-none"
                  />
                </div>
              </div>

              {/* Child Details */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap size={15} className="text-amber-500" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Child Details</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">Child Name *</label>
                  <input
                    suppressHydrationWarning
                    required
                    type="text"
                    value={form.child_name}
                    onChange={e => setForm(f => ({ ...f, child_name: e.target.value }))}
                    placeholder="Enter child's full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner rounded-none"
                  />
                </div>

                <div className="mt-4 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">Grade</label>
                  <select
                    value={form.child_grade_id}
                    onChange={e => setForm(f => ({ ...f, child_grade_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none shadow-inner rounded-none"
                  >
                    <option value="">Select Grade</option>
                    {grades.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-4">
                  <p className="text-xs font-bold text-red-700 flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                  </p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 p-4">
                <p className="text-xs text-amber-800 font-semibold flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>Your account will be activated after admin approval. You&apos;ll receive login credentials via email.</span>
                </p>
              </div>

              <button
                suppressHydrationWarning
                type="submit"
                disabled={step === 'submitting'}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-semibold text-sm tracking-wide transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed uppercase flex items-center justify-center gap-2"
              >
                {step === 'submitting' ? 'Submitting...' : 'Submit for Approval'}
                {step !== 'submitting' && <ArrowRight size={16} />}
              </button>
            </form>

            {/* Footer Toggle */}
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Sign In
              </Link>
            </p>

          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-slate-400 text-center uppercase tracking-widest font-medium opacity-60">
          © 2025 ZHI LearnAI · Singapore · <span className="text-indigo-600">v2.4.1</span>
        </p>
      </div>
    </div>
  );
}
