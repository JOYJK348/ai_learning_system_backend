'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Compass, Activity, Building2, Mail, Lock, ShieldCheck, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const portals = [
  {
    id: 'student',
    label: 'Student',
    desc: 'Child-safe learning environment',
    icon: Compass,
    color: 'bg-sky-500',
    ring: 'ring-sky-200',
    path: 'student',
    creds: { email: 'demo1@zhi.sg', pass: 'demo123' }
  },
  {
    id: 'parent',
    label: 'Parent',
    desc: "Track your child's progress",
    icon: Activity,
    color: 'bg-amber-500',
    ring: 'ring-amber-200',
    path: 'parent',
    creds: { email: 'kumar@parent.sg', pass: 'parent123' }
  },
  {
    id: 'school-admin',
    label: 'School Admin',
    desc: 'School command center',
    icon: Building2,
    color: 'bg-emerald-500',
    ring: 'ring-emerald-200',
    path: 'school-admin',
    creds: { email: '', pass: '' }
  },
  {
    id: 'super-admin',
    label: 'Super Admin',
    desc: 'System & administration hub',
    icon: ShieldCheck,
    color: 'bg-violet-500',
    ring: 'ring-violet-200',
    path: 'admin',
    creds: { email: 'admin@zhilearn.sg', pass: 'admin123' }
  },
];

export default function LoginPage() {
  const [selectedPortal, setSelectedPortal] = useState('student');
  const [isRegister, setIsRegister] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('UKG');
  const [errorMessage, setErrorMessage] = useState('');
  const [trialExpired, setTrialExpired] = useState(false);

  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const portal = portals.find(p => p.id === selectedPortal)!;
  const { user, login, registerParent, loading: authLoading, error: authError } = useAuth();

  useEffect(() => {
    if (window.location.search.includes('expired=1')) {
      setTrialExpired(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const route = user.role === 'super_admin' ? 'admin' : user.role === 'school_admin' ? 'school-admin' : user.role;
      router.push(`/${locale}/${route}`);
    }
  }, [user, locale, router]);

  useEffect(() => {
    if (authError) setErrorMessage(authError);
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (isRegister) {
      if (!parentName.trim() || !email.trim() || !password.trim()) {
        setErrorMessage('Please fill all registration fields.');
        setIsLoading(false);
        return;
      }

      const ok = await registerParent({
        name: parentName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: ''
      });

      setIsLoading(false);
      if (ok) {
        setIsSuccess(true);
        setErrorMessage('');
      } else {
        setErrorMessage(authError || 'Registration failed.');
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      setIsLoading(false);
      return;
    }

    const loggedIn = await login(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (loggedIn) {
      const route = loggedIn.role === 'super_admin' ? 'admin' : loggedIn.role === 'school_admin' ? 'school-admin' : loggedIn.role;
      router.push(`/${locale}/${route}`);
    } else {
      setErrorMessage(authError || 'Invalid email or password.');
    }
  };

  const autofill = () => {
    setEmail(portal.creds.email);
    setPassword(portal.creds.pass);
  };

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

      {/* Background decoration - hidden on mobile for pure white box feel */}
      <div className="hidden sm:block absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[120px] -ml-48 -mb-48" />
      </div>

      <div className="w-full sm:max-w-md relative z-10 flex flex-col items-center">
        <div className="w-full min-h-screen sm:min-h-0">
          {isSuccess ? (
            <div
              className="bg-white p-8 sm:p-10 border-none sm:border border-slate-200 shadow-none sm:shadow-xl text-center rounded-none min-h-screen sm:min-h-0 flex flex-col justify-center"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Request Submitted</h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-8 px-8">
                Your enrolment data has been received. The admin team will review and approve your account shortly.
              </p>
              <button
                onClick={() => { setIsSuccess(false); setIsRegister(false); }}
                className="w-full py-4 bg-slate-900 text-white rounded-none font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 uppercase"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <div 
              className="bg-white p-6 sm:p-10 border-none sm:border border-slate-200 shadow-none sm:shadow-2xl relative overflow-hidden rounded-none min-h-screen sm:min-h-0 flex flex-col"
            >
              {/* Visual Top Bar */}
              <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-500 ${portal.id === 'student' ? 'bg-sky-500' : portal.id === 'parent' ? 'bg-amber-500' : 'bg-violet-500'}`} />

              {/* Internal Logo Section - Mobile Centered, Desktop Row */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 mb-6 pb-6 border-b border-slate-50 pt-12 sm:pt-0">
                <div className="shrink-0">
                  <Image src="/assets/img/logo-removebg-preview.png" alt="ZHI" width={72} height={72} className="object-contain sm:w-[88px] sm:h-[88px]" />
                </div>
                <div className="flex flex-col">
                  <p className="text-slate-900 font-black text-2xl sm:text-3xl leading-none tracking-tighter">ZHI <span className="text-blue-600">LearnAI</span></p>
                  <p className="text-indigo-600/60 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-2.5 whitespace-nowrap">Learn While Playing</p>
                </div>
              </div>

              {/* Portal Selector */}
              <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 border border-slate-100">
                {portals.map((p) => {
                  const Icon = p.icon;
                  const active = selectedPortal === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      suppressHydrationWarning
                      disabled={isRegister}
                      onClick={() => { setSelectedPortal(p.id); setEmail(''); setPassword(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                        active
                          ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-100'
                          : 'text-slate-400 hover:text-slate-600'
                      } ${isRegister && !active ? 'opacity-30' : ''}`}
                    >
                      <Icon size={ active ? 14 : 12 } className={active ? 'text-indigo-600' : ''} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
                {isRegister && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600">Parent Name</label>
                      <input
                        suppressHydrationWarning
                        required
                        type="text"
                        value={parentName}
                        onChange={e => setParentName(e.target.value)}
                        placeholder="Full name"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner rounded-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600">Child Name</label>
                      <input
                        suppressHydrationWarning
                        required
                        type="text"
                        value={childName}
                        onChange={e => setChildName(e.target.value)}
                        placeholder="Full name"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner rounded-none"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600">Grade</label>
                      <select
                        value={childGrade}
                        onChange={e => setChildGrade(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none shadow-inner rounded-none"
                      >
                        <option>LKG</option><option>UKG</option><option>Grade 1</option><option>Grade 2</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      suppressHydrationWarning
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner rounded-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      suppressHydrationWarning
                      required
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 outline-none text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all tracking-wider shadow-inner rounded-none"
                    />
                  </div>
                </div>

                {trialExpired && (
                  <div className="bg-red-50 border border-red-200 p-4 text-center">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1">Trial Ended</p>
                    <p className="text-sm text-red-600 font-semibold">Your 14-day trial has expired. Please contact support to renew your plan.</p>
                  </div>
                )}
                {errorMessage && (
                  <p className="text-sm text-rose-600 font-semibold">{errorMessage}</p>
                )}

                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-none font-semibold text-sm tracking-wide transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed uppercase"
                >
                  {isLoading || authLoading
                    ? 'Working...'
                    : isRegister ? 'Create Parent Account' : `Sign in as ${portal.label}`}
                </button>

                {!isRegister && (
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={autofill}
                    className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-none flex items-center justify-between border border-indigo-100 hover:border-indigo-200 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles size={14} className="text-indigo-500" />
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 leading-none mb-0.5">Demo Mode</p>
                        <p className="text-xs font-semibold text-indigo-700">Use {portal.label} credentials</p>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </form>

              {/* Footer Toggle */}
              <p className="mt-6 text-center text-sm text-slate-500">
                {isRegister ? 'Prefer to sign in? ' : "Don't have an account? "}
                <Link
                  href="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Register as Parent
                </Link>
              </p>

            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-slate-400 text-center uppercase tracking-widest font-medium opacity-60">
          © 2025 ZHI LearnAI · Singapore · <span className="text-indigo-600">v2.4.1</span>
        </p>
      </div>
    </div>
  );
}
