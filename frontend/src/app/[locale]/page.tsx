'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Play, ArrowRight, Brain, Globe, Shield, Sparkles, Star,
  GraduationCap, Heart, Settings, Eye, Zap, Layers,
  Mail, Phone, User, MessageCircle, X, Menu,
  ExternalLink, Video, AtSign, CheckCircle2,
  Wifi, Battery, Rocket, Activity, TrendingUp, Gamepad2, Quote,
  ChevronRight, Lock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const C = {
  primary: '#013237',
  primLight: '#0a4a50',
  gold: '#D4AF37', // High-End Metallic Gold
  goldLight: '#F7EF8A', // Shiny Light Gold
  goldDark: '#9D7606',
  cyberBlue: '#00D2FF',
  cyberViolet: '#9D50BB',
};

/* ── Section label ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="section-label">
      <Sparkles size={11} className="inline-block mr-1.5" />
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const params = useParams();
  const locale = params?.locale || 'en';
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Portals', href: '#portals' },
    { label: 'Vision', href: '#vision' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 h-20 flex items-center justify-between py-4">
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-14 h-14 transition-transform group-hover:scale-110">
              <Image src="/assets/img/logo.png" alt="Zhi Logo" fill className="object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-lg" style={{ color: C.primary }}>
                ZHI <span style={{ color: C.gold }}>LearnAI</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-bold mt-0.5">Learn while playing</span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} className="nav-link">{l.label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href={`/${locale}/login`} className="btn-primary text-sm">
              Get Started <ArrowRight size={15} />
            </a>
          </div>

          <button className="md:hidden p-2 rounded-lg" style={{ color: C.primary }}
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-5 py-5 space-y-4">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                className="block text-sm font-semibold text-slate-600 hover:text-[#013237] py-1">
                {l.label}
              </a>
            ))}
            <a href={`/${locale}/login`} className="btn-primary w-full justify-center text-sm mt-2">Get Started</a>
          </div>
        )}
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative flex flex-col pt-32 md:pt-40 pb-12 overflow-hidden bg-white">

        {/* Professional Studio Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.4]"
            style={{ backgroundImage: 'radial-gradient(#013237 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-cyan-50/40 to-transparent blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-50/30 to-transparent blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 w-full">
          <div className="flex flex-col lg:grid lg:grid-cols-2 items-center gap-8 lg:gap-16">

            {/* ── LEFT: Text (Visionary Editorial) ── */}
            <motion.div
              initial={{ x: -20, opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="order-1 lg:order-1 text-center lg:text-left lg:-mt-[40px]"
            >
              <div className="relative mb-6">
                <h1 className="font-extrabold tracking-[-0.05em] text-slate-900 leading-[1.1]"
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', fontFamily: 'Inter, sans-serif' }}>
                  The Learning Experience<br />
                  <span className="italic font-light tracking-tight text-[#013237]" style={{ fontFamily: 'serif' }}>Every Child Deserves.</span>
                </h1>
              </div>

              <div className="max-w-lg lg:mx-0 mx-auto mt-6">
                <p className="text-[15px] sm:text-[17px] text-slate-500 leading-relaxed font-medium mb-10 text-justify">
                  <span className="text-slate-900 font-extrabold block mb-2 text-xl tracking-tight italic text-left" style={{ fontFamily: 'serif' }}>An AI Learning Platform Built for Children.</span>
                  ZHI LearnAI gives your child a structured, curriculum-aligned learning environment that feels nothing like studying. Through AI-guided game quests, animated lessons, and interactive challenges, children build genuine subject mastery — independently, confidently, and joyfully.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start mb-12">
                <a href={`/${locale}/login`}
                  className="px-12 py-5 rounded-full text-white font-black text-[12px] uppercase tracking-[0.2em] transition-all hover:brightness-110 active:scale-95 shadow-2xl"
                  style={{ background: C.primary, boxShadow: `0 20px 40px ${C.primary}30` }}>
                  Get Started
                </a>
                <a href="#demo"
                  className="px-12 py-5 rounded-full font-black text-[12px] uppercase tracking-[0.2em] border border-slate-200 bg-white/50 backdrop-blur transition-all hover:bg-white"
                  style={{ color: C.primary }}>
                  Watch Demo
                </a>
              </div>

            </motion.div>

            {/* ── RIGHT: Immersive AR Laptop Visual ── */}
            <motion.div
              initial={{ scale: 0.98, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="order-2 lg:order-2 w-full max-w-2xl mx-auto lg:max-w-none relative"
            >
              <div className="relative w-full flex items-center justify-center p-4">

                {/* ── THE MODERN LAPTOP ── */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10 w-full -mt-[40px]"
                >
                  {/* Laptop Lid / Screen */}
                  <div className="relative mx-auto rounded-[2.2rem] p-1.5 shadow-[0_45px_100px_-20px_rgba(0,0,0,0.6)]"
                    style={{
                      background: 'linear-gradient(145deg, #2d3e4f, #0f172a)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>

                    <div className="relative aspect-[16/10] bg-black rounded-[1.8rem] overflow-hidden border border-white/5 shadow-inner">
                      {/* Image Content */}
                      <div className="absolute inset-0">
                        <Image src="/assets/img/hero.png" alt="Zhi AR Platform" fill className="object-cover opacity-95 transition-transform duration-700 hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>

                      {/* Video Player overlay */}
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-3xl flex items-center justify-center border border-white/20 text-white shadow-2xl group"
                        >
                          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/30 transition-colors group-hover:bg-white/20">
                            <Play size={24} fill="white" className="ml-1" />
                          </div>
                        </motion.button>
                      </div>

                    </div>
                  </div>

                  {/* ═══ PROJECTING ELEMENTS REMOVED FOR CLEAN LOOK ═══ */}

                  {/* Laptop Base */}
                  <div className="relative -mt-1.5 px-4">
                    <div className="h-2 w-full bg-[#1e293b] rounded-t-sm" />
                    <div
                      className="relative h-6 bg-gradient-to-b from-[#1e293b] to-[#0a0f18] rounded-b-[4rem] w-[110%] -left-[5%]"
                      style={{
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        clipPath: 'polygon(0 0, 100% 0, 97% 100%, 3% 100%)'
                      }}
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2.5 bg-[#0f172a]/90 rounded-b-xl" />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-12 bg-cyan-500/10 blur-[40px] rounded-full" />
                  </div>

                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* ── NEW: Unified Feature Cards Row (Same Height) ── */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">

            {/* Card 1: Visionary Manifesto */}
            <motion.div
              initial={{ y: 0, opacity: 1 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/40 via-white to-white rounded-[2.5rem] border border-amber-200/50 shadow-premium transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-400/20 to-transparent blur-[80px] rounded-full -mr-20 -mt-20 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 p-8 h-full flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                  <Quote size={80} className="text-[#9D7606]" />
                </div>

                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#9D7606] mb-4 block">ZHI LearnAI • Interactive Education</span>

                <h3 className="text-2xl font-light italic text-slate-800 mb-4" style={{ fontFamily: 'serif' }}>
                  The Future of <span className="font-bold not-italic text-amber-900">Play-Based Learning.</span>
                </h3>

                <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                  A world where every lesson is an adventure. Through gamified quests, interactive quizzes, and cinematic audio-visual lessons, children master complex subjects naturally as they play.
                </p>

                <div className="mt-8 space-y-5 flex-grow">
                  {[
                    { icon: <Gamepad2 size={16} />, label: 'Gamified Quests', desc: 'Narrative-driven missions that turn study sessions into epic adventures.', color: 'text-amber-600' },
                    { icon: <Zap size={16} />, label: 'Adaptive Quizzes', desc: 'Smart challenges that adjust difficulty in real-time to match your pace.', color: 'text-orange-500' },
                    { icon: <Video size={16} />, label: 'Cinematic Media', desc: 'High-definition animations and audio stories for deep sensory learning.', color: 'text-amber-700' },
                    { icon: <Star size={16} />, label: 'Milestone Rewards', desc: 'Unlock exclusive gear and badges as your child achieves breakthroughs.', color: 'text-yellow-600' }
                  ].map((pill, i) => (
                    <div key={i} className="flex gap-4 items-start border-l-2 border-amber-100 pl-4 transition-all hover:border-amber-400 group/pill">
                      <div className={`${pill.color} mt-0.5 group-hover/pill:scale-110 transition-transform`}>{pill.icon}</div>
                      <div>
                        <p className="text-[11px] font-black uppercase text-slate-800 tracking-tight">{pill.label}</p>
                        <p className="text-[12px] text-slate-500 leading-snug">{pill.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-5 border-t border-amber-100/50">
                  <span className="text-[#9D7606] font-bold text-[13px]">Engaging Games. Adaptive Quizzes. Immersive Multimedia.</span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Professional HUD Badge */}
            <motion.div
              initial={{ y: 0, opacity: 1 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 via-white to-white rounded-[2.5rem] border border-emerald-200/50 shadow-premium transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-400/15 to-transparent blur-[80px] rounded-full -ml-20 -mb-20" />
              
              <div className="relative z-10 p-8 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#013237] rounded-xl rotate-45 shadow-lg shadow-[#013237]/30 border border-white/20" />
                    <span className="relative z-10 text-white font-medium italic text-base" style={{ fontFamily: 'serif' }}>Lvl 12</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-1">Play Mode: Active</p>
                    <h4 className="text-xl font-medium italic text-slate-900 leading-none" style={{ fontFamily: 'serif' }}>Geometry Mastery</h4>
                  </div>
                </div>

                {/* ── NEW: Professional HUD Stats ── */}
                <div className="flex-grow py-5">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <p className="text-[9px] font-black tracking-widest text-emerald-700 uppercase opacity-70">Accuracy</p>
                      <p className="text-2xl font-black text-slate-800" style={{ fontFamily: 'serif' }}>94<span className="text-sm ml-0.5">%</span></p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 tracking-tight">Mastering Concepts</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <p className="text-[9px] font-black tracking-widest text-emerald-700 uppercase opacity-70">Progress Pace</p>
                      <p className="text-2xl font-black text-slate-800" style={{ fontFamily: 'serif' }}>Fast</p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 tracking-tight">Ahead of Grade</p>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-emerald-100/50">
                    <p className="text-[9px] font-black tracking-[0.2em] text-slate-400 mb-4 uppercase">Skill Strengths</p>
                    <div className="space-y-2.5">
                      {[
                        { label: '3D Visualization', val: 85, color: 'bg-emerald-600', note: 'Strong' },
                        { label: 'Spatial Reasoning', val: 92, color: 'bg-[#013237]', note: 'Excellent' },
                      ].map(s => (
                        <div key={s.label} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-600 italic" style={{ fontFamily: 'serif' }}>{s.label}</span>
                            <span className="text-[10px] font-black text-emerald-800">{s.note} ({s.val}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-emerald-100/50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${s.val}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className={`h-full ${s.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── NEW: Cognitive Score to fill space ── */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-emerald-100 transition-colors shadow-sm">
                      <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Concentration</p>
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-black text-slate-800">High</span>
                        <TrendingUp size={14} className="mb-1 text-emerald-500" />
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-emerald-100 transition-colors shadow-sm">
                      <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Practice Streak</p>
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-black text-slate-800">12<span className="text-xs ml-1">d</span></span>
                        <Zap size={14} className="mb-1 text-amber-500 fill-amber-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-auto pt-5 border-t border-emerald-100/50">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">Current XP: <span className="text-slate-900 font-black" style={{ fontFamily: 'serif' }}>850</span></span>
                    <span className="text-[11px] font-black text-emerald-700 uppercase">Next level: 13</span>
                  </div>
                  <div className="flex gap-1.5 h-3">
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: i < 8 ? 1 : 0.3, backgroundColor: i < 8 ? '#013237' : '#E2E8F0' }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className="flex-1 rounded-sm shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Active Reality Engine */}
            <motion.div
              initial={{ y: 0, opacity: 1 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-white to-white rounded-[2.5rem] border border-blue-200/50 shadow-premium transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-400/20 to-transparent blur-[80px] rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform" />
              
              <div className="relative z-10 p-8 h-full flex flex-col">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#013237] flex items-center justify-center text-[#D4AF37] border border-white/20 shadow-xl group-hover:scale-110 transition-transform">
                      <Eye size={24} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-700">Reality Engine</p>
                      <h4 className="text-xl font-medium italic text-slate-900 leading-none" style={{ fontFamily: 'serif' }}>See the Invisible.</h4>
                    </div>
                  </div>
                </div>

                {/* ── NEW: Neural Processing Visual ── */}
                <div className="flex-grow py-5 relative z-10 transition-all group-hover:translate-x-1">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase text-cyan-700 tracking-wider">Reality Sync Active</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 italic">100% Precision</div>
                  </div>

                  <div className="bg-white/60 rounded-2xl p-5 border border-blue-100/50 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Learning Assets</span>
                      <Sparkles size={12} className="text-amber-500" />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: '3D & AR Labs', val: '45+', icon: <Layers size={14} />, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                        { label: 'Animated Lessons', val: '120+', icon: <Video size={14} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Interactive Quests', val: '80+', icon: <Zap size={14} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      ].map(stat => (
                        <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-50 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                              {stat.icon}
                            </div>
                            <span className="text-[11px] font-bold text-slate-600">{stat.label}</span>
                          </div>
                          <span className={`text-[13px] font-black ${stat.color}`}>{stat.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="mt-6 text-[12px] font-medium leading-relaxed text-slate-500 border-l-2 border-slate-100 pl-4">
                    Complex ideas transformed into <span className="text-slate-900 font-bold italic">easy 3D stories.</span>
                  </p>
                </div>

                <div className="space-y-3 mb-8 relative z-10 mt-auto pt-5 border-t border-blue-100/50">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                    <span className="text-slate-500">Learning Level</span>
                    <span className="text-cyan-700 font-black italic">Simplified for All</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                    <span className="text-slate-500">Memory Retention</span>
                    <span className="text-blue-700 font-black italic">100% Mastery</span>
                  </div>
                  <div className="h-[1px] w-full bg-blue-100/50 mt-2" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-40" />
            </motion.div>

          </div>
        </div>
      </section>



      {/* ═══════ FEATURES: IMMERSIVE (INNOVATION) ═══════ */}
      <section id="how-it-works" className="scroll-mt-32 pt-24 md:pt-32 pb-12 md:pb-16 relative overflow-hidden bg-[#F8FAFC]">
        {/* Subtle Neural Pattern Background */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#013237 0.8px, transparent 0.8px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/50 blur-[120px] rounded-full -mr-32 -mt-32 opacity-60" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">

            {/* Visual Side with Holographic Tags */}
            <div className="lg:col-span-6 relative order-2 lg:order-1">
              <motion.div
                initial={{ x: 0, opacity: 1 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="relative z-10 rounded-[3rem] overflow-hidden group shadow-[0_32px_64px_-16px_rgba(1,50,55,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#013237]/30 via-transparent to-white/10 z-10" />
                <Image
                  src="/assets/img/achievement.png"
                  alt="Innovation Tech"
                  width={800}
                  height={1000}
                  className="w-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                />

              </motion.div>
              
              {/* Decorative behind image */}
              <div className="absolute -inset-10 bg-[#013237]/5 rounded-[4rem] blur-[80px] -z-10" />
            </div>

            {/* Content Side with Intelligent Tiles */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <motion.div
                initial={{ y: 0, opacity: 1 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <SectionLabel>Innovation</SectionLabel>
                <h2 className="text-3xl md:text-5xl font-black mb-4 leading-[1.1] tracking-tight" style={{ color: '#013237' }}>
                  The technology that <br /> changes <span className="text-gradient-gold">everything.</span>
                </h2>

                <div className="space-y-4 mt-6">
                  {[
                    {
                      t: 'Cinematic Animations',
                      d: 'Complex science and math topics transformed into 4K animated epics that tell unforgettable stories.',
                      icon: Video,
                      color: '#9D50BB',
                      bg: 'bg-purple-50'
                    },
                    {
                      t: 'Neural AI Tutoring',
                      d: 'A personal AI companion trained locally on pedagogic principles to guide students personally.',
                      icon: Brain,
                      color: '#013237',
                      bg: 'bg-emerald-50'
                    },
                    {
                      t: 'Interactive AR Overlay',
                      d: 'Turn any physical space into a digital laboratory. Study systems in true 1:1 hyper-realistic scale.',
                      icon: Layers,
                      color: '#00D2FF',
                      bg: 'bg-cyan-50'
                    }
                  ].map((f, i) => (
                    <motion.div
                      key={f.t}
                      initial={{ x: 0, opacity: 1 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, duration: 0.8 }}
                      className="group flex gap-6 p-6 rounded-[2.5rem] transition-all duration-500 hover:bg-slate-50 border border-transparent hover:border-slate-100"
                    >
                      <div className={`w-16 h-16 rounded-2xl ${f.bg} flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}>
                        <f.icon size={28} style={{ color: f.color }} />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="text-xl font-black mb-2 text-slate-800 tracking-tight group-hover:text-[#013237] transition-colors">{f.t}</h4>
                        <p className="text-slate-500 leading-relaxed text-[14px] font-medium">{f.d}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>


      {/* ═══════ THE ECOSYSTEM: COMPACT HUB (PORTALS) ═══════ */}
      <section id="portals" className="scroll-mt-32 mt-20 md:mt-0 pt-36 md:pt-16 pb-16 md:pb-24 bg-white relative overflow-hidden">
        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.3] pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#013237 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6">
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
              <div className="max-w-xl">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#9D7606] mb-4 block">The Unified Architecture</span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Intelligence for <span className="italic font-light text-[#013237]" style={{ fontFamily: 'serif' }}>Everyone.</span>
                </h2>
              </div>
              <p className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed border-l-2 border-slate-100 pl-6">
                A connected ecosystem bridging the gap between imagination and performance.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 'student',
                label: 'Explorer',
                title: 'Student Portal',
                desc: 'A gamified sanctuary where lessons become 3D adventures and AI tutors provide absolute clarity through adaptive feedback.',
                items: ['3D Worlds', 'AR Labs', 'AI Tutors', 'Daily Quests', 'Gear Shop', 'Global Hall'],
                stats: [{ label: 'Active Worlds', val: '14' }, { label: 'Top Subject', val: 'Physics' }],
                update: 'New "Quantum Realm" AR Lab added yesterday.',
                color: '#013237',
                accent: 'from-emerald-400/20 to-teal-500/5',
                border: 'border-emerald-100',
                btn: 'bg-[#013237]',
                icon: <GraduationCap size={22} />,
                visual: (
                  <div className="h-full flex items-end gap-1 px-1">
                    {[40, 70, 45, 90, 65, 80, 50, 85, 40].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04, duration: 1 }}
                        className="flex-1 bg-[#013237]/80 rounded-t-[2px]"
                      />
                    ))}
                  </div>
                )
              },
              {
                id: 'parent',
                label: 'Intelligence',
                title: 'Parent Portal',
                desc: 'Real-time windows into growth, mapping breakthrough and defining the path forward for cognitive excellence.',
                items: ['Cognitive Maps', 'Activity Feed', 'Skill Tracking', 'Safety Filter', 'Goal Setter', 'Rewards Hub'],
                stats: [{ label: 'Growth Score', val: '92%' }, { label: 'Active Streak', val: '12d' }],
                update: 'Breakthrough detected in Spatial Reasoning.',
                color: '#D4AF37',
                accent: 'from-amber-400/20 to-orange-500/5',
                border: 'border-amber-100',
                btn: 'bg-[#9D7606]',
                icon: <Heart size={22} />,
                visual: (
                  <div className="h-full flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200 to-transparent h-[1px] top-1/2 opacity-30" />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.6, 1], opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 3, delay: 1, repeat: Infinity }}
                      className="absolute w-16 h-16 rounded-full bg-amber-400/10 border border-amber-200"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <TrendingUp size={16} className="text-amber-600 opacity-60" />
                    </div>
                  </div>
                )
              },
              {
                id: 'school',
                label: 'Core',
                title: 'Institutional Portal',
                desc: 'Enterprise-grade orchestration for schools to manage complex curriculum, security, and student data.',
                items: ['Bulk Analytics', 'Content Control', 'Strategy Hub', 'Teacher Tools', 'Compliance', 'Security'],
                stats: [{ label: 'System Health', val: '99.9%' }, { label: 'Regional Nodes', val: '42' }],
                update: 'Node synchronization completed globally.',
                color: '#9D50BB',
                accent: 'from-violet-400/20 to-purple-500/5',
                border: 'border-violet-100',
                btn: 'bg-[#7C3AED]',
                icon: <Shield size={22} />,
                visual: (
                  <div className="h-full grid grid-cols-6 gap-1 px-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="relative overflow-hidden rounded-sm bg-slate-100/30">
                        <motion.div
                          animate={{ opacity: [0.1, 0.5, 0.1] }}
                          transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                          className="absolute inset-0 bg-violet-400"
                        />
                      </div>
                    ))}
                  </div>
                )
              }
            ].map((portal, i) => (
              <div
                key={portal.id}
                className="relative group h-full cursor-default"
              >
                {/* Visual Background Container */}
                <div className={`absolute inset-0 bg-white rounded-[2.5rem] shadow-premium border ${portal.border} overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2`} />
                <div className={`absolute inset-0 bg-gradient-to-br ${portal.accent} opacity-40 rounded-[2.5rem]`} />
                
                <div className="relative z-10 p-8 h-full flex flex-col">
                  {/* Status Row */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/90 border border-slate-100 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{portal.label}</span>
                    </div>
                    <div className="text-[9px] font-black text-slate-300 uppercase">PRTL_{portal.id.toUpperCase()}</div>
                  </div>

                  {/* Header Row */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-3 transition-transform ${portal.btn}`}>
                       {portal.icon}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-2xl font-light italic text-slate-900 leading-tight" style={{ fontFamily: 'serif' }}>
                        {portal.title}
                      </h3>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Access Tier: Premium</p>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {portal.stats.map(s => (
                      <div key={s.label} className="bg-white/40 p-3 rounded-xl border border-white group-hover:bg-white transition-colors">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5">{s.label}</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight">{s.val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-slate-500 text-[13px] leading-relaxed mb-6 font-medium">
                    {portal.desc}
                  </p>

                  {/* Feature Matrix - Higher Density */}
                  <div className="grid grid-cols-2 gap-2 mb-8">
                    {portal.items.map(item => (
                      <div key={item} className="flex items-center gap-2 group/tag">
                        <div className={`w-1 h-1 rounded-full ${portal.btn} opacity-30 group-hover/tag:opacity-100 transition-opacity`} />
                        <span className="text-[10px] font-bold text-slate-600 transition-colors group-hover:text-slate-900">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Visual Activity & Update */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-2/3 border-r border-slate-100 pr-4">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Live Sync</p>
                        {portal.visual}
                      </div>
                      <div className="w-1/3 pl-4">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Operational</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-6">
                      <p className="text-[9px] font-black text-slate-800 leading-snug">
                        <span className="opacity-40 uppercase text-[8px] mr-1">Latest Upgrade:</span><br/>
                        {portal.update}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <a 
                        href={`/${locale}/login?portal=${portal.id}`} 
                        className="group/btn relative flex items-center justify-center gap-4 px-10 py-3.5 rounded-full overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95"
                      >
                        {/* Shimmering Background */}
                        <div className={`absolute inset-0 opacity-10 group-hover/btn:opacity-100 transition-opacity duration-500 ${portal.btn}`} />
                        <div className="absolute inset-0 border border-slate-200 group-hover/btn:border-transparent transition-colors" style={{ borderRadius: 'inherit' }} />
                        
                        <span className={`relative z-10 font-black text-[10px] uppercase tracking-[0.3em] transition-colors duration-500 group-hover/btn:text-white ${portal.id === 'student' ? 'text-[#013237]' : portal.id === 'parent' ? 'text-[#9D7606]' : 'text-[#7C3AED]'}`}>
                          Initiate Access
                        </span>
                        
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 group-hover/btn:bg-white/20 group-hover/btn:translate-x-1 ${portal.btn} text-white`}>
                          <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </div>

                        {/* Outer Glow */}
                        <div className={`absolute -inset-2 blur-xl opacity-0 group-hover/btn:opacity-20 transition-opacity -z-10 ${portal.btn}`} />
                      </a>
                      
                      <div className="flex items-center gap-1.5 opacity-30 group-hover:opacity-60 transition-opacity">
                        <Lock size={10} className="text-slate-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Encrypted Gateway</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════ VISION ROADMAP ═══════ */}
      <section id="vision" className="scroll-mt-32 py-16 md:py-32 relative overflow-hidden"
        style={{ background: C.primary }}>

        {/* Background texture */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#fff 0.5px, transparent 0.5px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-400/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6">

          {/* Header */}
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6"
              style={{ background: 'rgba(212,175,55,0.15)', color: C.goldLight, border: '1px solid rgba(212,175,55,0.25)' }}>
              <Sparkles size={10} /> What&apos;s Coming Next
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
              The Future of{' '}
              <span className="italic font-light" style={{ fontFamily: 'serif', color: C.goldLight }}>Play-Based Learning.</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto text-sm leading-relaxed">
              &ldquo;The best kind of learning is the kind kids ask to do again.&rdquo;
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative items-stretch">

            {/* Connecting line (desktop only) */}
            <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-[1px] z-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), rgba(0,210,255,0.3), rgba(212,175,55,0.3), transparent)' }} />

            {[
              {
                tag: 'Phase 1', num: '01',
                title: 'Neural Study Companion',
                desc: 'An adaptive AI guide providing personalized Socratic hinting and emotional support, ensuring mastery without frustration.',
                icon: MessageCircle,
                accent: C.cyberViolet,
                glow: 'rgba(157,80,187,0.25)',
              },
              {
                tag: 'Phase 2', num: '02',
                title: 'Immersive AR Laboratories',
                desc: 'Step inside the invisible. Transition from theory to 3D reality by exploring complex systems in hyper-realistic scale.',
                icon: Eye,
                accent: C.cyberBlue,
                glow: 'rgba(0,210,255,0.2)',
              },
              {
                tag: 'Phase 3', num: '03',
                title: 'Collaborative Social Hubs',
                desc: 'Bridging play and academic rivalry. Students solve high-stakes challenges together, fostering leadership and teamwork.',
                icon: Gamepad2,
                accent: C.goldLight,
                glow: 'rgba(247,239,138,0.15)',
              },
              {
                tag: 'Phase 4', num: '04',
                title: 'Universal Academic Alignment',
                desc: 'Global scaling to support localized national standards, delivering world-class curriculum with AI-powered precision.',
                icon: Globe,
                accent: C.gold,
                glow: 'rgba(212,175,55,0.2)',
              },
            ].map((r, i) => (
              <div
                key={r.title}
                className="relative group h-full"
              >
                {/* Glow behind card */}
                <div className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: r.glow }} />

                <div className="relative rounded-2xl overflow-hidden border transition-all duration-500 group-hover:border-white/20 flex flex-col h-full"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>

                  {/* Colored top strip */}
                  <div className="h-1 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${r.accent}, transparent)` }} />

                  <div className="p-7 flex flex-col flex-1 relative">

                    {/* Ghost number — absolute background */}
                    <div className="absolute bottom-4 right-4 text-[7rem] font-black leading-none select-none pointer-events-none"
                      style={{ color: 'rgba(255,255,255,0.05)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.05em', lineHeight: 1 }}>
                      {r.num}
                    </div>

                    {/* Phase badge + icon row */}
                    <div className="flex items-center justify-between mb-7 relative z-10">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
                        {r.tag}
                      </span>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3"
                        style={{ background: `${r.accent}20`, color: r.accent, border: `1px solid ${r.accent}30` }}>
                        <r.icon size={20} />
                      </div>
                    </div>

                    {/* Title + Desc */}
                    <div className="flex-1 relative z-10">
                      <h3 className="text-white font-extrabold text-lg mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {r.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {r.desc}
                      </p>
                    </div>

                    {/* Bottom accent line */}
                    <div className="mt-6 h-[1px] w-8 rounded-full transition-all duration-500 group-hover:w-full relative z-10"
                      style={{ background: r.accent }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA strip */}
          <motion.div
            initial={{ opacity: 1 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <p className="text-white/30 text-xs uppercase tracking-[0.3em]">Phase 1 is live now &mdash; Join thousands of learners today</p>
          </motion.div>

        </div>
      </section>


      {/* ═══════ CONTACT ═══════ */}
      <section id="contact" className="py-16 md:py-28 bg-[#F8FAFC] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-cyan-50/50 to-transparent blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-50/40 to-transparent blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">

          {/* Section Header */}
          <div className="text-center mb-14">
            <SectionLabel>Get In Touch</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3" style={{ color: C.primary, fontFamily: 'Inter, sans-serif' }}>
              Ready to make learning <span className="italic font-light" style={{ fontFamily: 'serif' }}>joyful?</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Book a personalised demo and discover why parents and schools choose ZHI LearnAI.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-start">

            {/* ── LEFT: Contact Info Panel ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Contact Card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
                    <MessageCircle size={15} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Direct Contact</span>
                </div>
                <h3 className="text-xl font-extrabold mb-1 mt-3" style={{ color: C.primary }}>Ready to make learning fun?</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-7">
                  Book a free demo and see your child light up while they learn through play.
                </p>

                <div className="space-y-4">
                  <a href="mailto:hello@zhilearnai.sg"
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#013237]/20 hover:bg-white transition-all group">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                      style={{ background: `${C.primary}12`, color: C.primary }}>
                      <Mail size={17} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Email Us</p>
                      <p className="text-sm font-semibold text-slate-700">hello@zhilearnai.sg</p>
                    </div>
                  </a>

                  <a href="tel:+18001234567"
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#013237]/20 hover:bg-white transition-all group">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                      style={{ background: `${C.gold}18`, color: C.goldDark }}>
                      <Phone size={17} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Call Us</p>
                      <p className="text-sm font-semibold text-slate-700">+1 800 123 4567</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5">Why Parents Trust Us</p>
                <div className="space-y-3">
                  {[
                    { icon: CheckCircle2, label: 'Standard Curriculum Aligned', color: C.primary },
                    { icon: Shield, label: 'Global Data Compliance', color: C.cyberBlue },
                    { icon: Star, label: 'Global AI-First Platform', color: C.goldDark },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon size={15} style={{ color }} />
                      <span className="text-sm font-medium text-slate-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Form Panel ── */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-10">
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Book a Demo</p>
                  <h4 className="text-xl font-extrabold text-slate-900">Tell us about yourself</h4>
                </div>

                <form className="space-y-5" onSubmit={e => e.preventDefault()}>

                  {/* Row 1: Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="David Lim"
                          suppressHydrationWarning
                          className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm transition-all focus:border-[#013237] focus:bg-white focus:ring-2 focus:ring-[#013237]/8 placeholder:text-slate-300 text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        <input
                          type="email"
                          placeholder="you@school.edu"
                          suppressHydrationWarning
                          className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm transition-all focus:border-[#013237] focus:bg-white focus:ring-2 focus:ring-[#013237]/8 placeholder:text-slate-300 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Phone + Role */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact Number</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        <input
                          type="tel"
                          placeholder="+1 234 567 890"
                          suppressHydrationWarning
                          className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm transition-all focus:border-[#013237] focus:bg-white focus:ring-2 focus:ring-[#013237]/8 placeholder:text-slate-300 text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Role</label>
                      <div className="relative">
                        <select
                          defaultValue=""
                          suppressHydrationWarning
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm transition-all focus:border-[#013237] focus:bg-white focus:ring-2 focus:ring-[#013237]/8 text-slate-600 appearance-none"
                        >
                          <option value="" disabled>Select your role...</option>
                          {['Parent / Guardian', 'Student', 'Educator', 'Institution Lead'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Grade + School */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student Grade Level</label>
                      <div className="relative">
                        <select
                          defaultValue=""
                          suppressHydrationWarning
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm transition-all focus:border-[#013237] focus:bg-white focus:ring-2 focus:ring-[#013237]/8 text-slate-600 appearance-none"
                        >
                          <option value="" disabled>Select grade level...</option>
                          {['Primary / Elementary', 'Secondary / Middle School', 'High School / Pre-College', 'Other'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">School / Institution</label>
                      <div className="relative">
                        <GraduationCap size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="e.g. International Academy"
                          suppressHydrationWarning
                          className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm transition-all focus:border-[#013237] focus:bg-white focus:ring-2 focus:ring-[#013237]/8 placeholder:text-slate-300 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message <span className="normal-case tracking-normal text-slate-300 font-normal">(optional)</span></label>
                    <textarea
                      rows={4}
                      placeholder="Tell us how we can help your child or school..."
                      suppressHydrationWarning
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm transition-all focus:border-[#013237] focus:bg-white focus:ring-2 focus:ring-[#013237]/8 resize-none placeholder:text-slate-300"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    suppressHydrationWarning
                    className="w-full py-4 rounded-xl text-white font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primLight})`, boxShadow: `0 12px 30px ${C.primary}35` }}
                  >
                    Book Your Free Demo <ArrowRight size={15} />
                  </button>

                  <p className="text-center text-[11px] text-slate-400">
                    No commitment required. We&apos;ll get back to you within 24 hours.
                  </p>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-slate-100 bg-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/assets/img/logo.png" alt="Zhi Logo" width={32} height={32} />
              <span className="font-extrabold text-lg" style={{ color: C.primary }}>
                ZHI <span style={{ color: C.gold }}>LearnAI</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-7">
              Building local intelligence through global educational standards and cutting-edge artificial intelligence.
            </p>
            <div className="flex gap-3">
              {[AtSign, MessageCircle, Video, ExternalLink].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-[#013237] hover:text-[#013237] transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-5 uppercase tracking-widest text-xs">Resources</h5>
            <ul className="space-y-3 text-sm text-slate-500">
              {['Student Guide', 'Parent Resources', 'Success Stories'].map(l => (
                <li key={l}><a href="#" className="hover:text-[#013237] transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-5 uppercase tracking-widest text-xs">Company</h5>
            <ul className="space-y-3 text-sm text-slate-500">
              {['About ZHI', 'Contact Us', 'Careers'].map(l => (
                <li key={l}><a href="#" className="hover:text-[#013237] transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
          <div>© 2026 ZHI LearnAI. AI-Powered Learning Platform.</div>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" className="hover:text-[#013237] transition-colors uppercase tracking-wider">{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
