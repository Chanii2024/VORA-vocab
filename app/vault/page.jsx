"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  History, 
  FlaskConical, 
  Settings, 
  ArrowRight, 
  Star, 
  LayoutGrid, 
  List,
  ChevronDown,
  Play,
  Zap,
  ShieldCheck,
  Award,
  BookOpen
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchVaultData } from "@/app/actions/vault-actions";
import MasteryRing from "@/components/ui/MasteryRing";
import CategoryItem from "@/components/ui/CategoryItem";
import XPBar from "@/components/ui/XPBar";
import { getXPForNextLevel, getNextLevel } from "@/lib/progression";
import MobileNav from "@/components/layout/MobileNav";

export default function VoraVault() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mastered"); // mastered, lab
  const [expandedWord, setExpandedWord] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const vaultData = await fetchVaultData();
      if (vaultData) {
        setData(vaultData);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-vora-bg flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-vora-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!data) {
    return (
       <div className="min-h-screen bg-vora-bg flex flex-col items-center justify-center p-8 text-center space-y-6">
          <History size={64} className="text-gray-300" />
          <h2 className="text-2xl font-bold text-vora-text">The Sanctuary is Empty</h2>
          <p className="max-w-xs text-gray-400 font-medium">Your progress data is currently obscured. Start a module to begin your linguistic journey.</p>
          <button onClick={() => router.push("/dashboard")} className="px-8 py-4 bg-vora-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Return to Fleet</button>
       </div>
    );
  }

  const { profile, mastery, categories, words } = data;
  const xpThreshold = getXPForNextLevel(profile.current_level);
  const nextLevel = getNextLevel(profile.current_level);

  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col pb-32">
      <MobileNav />

      {/* Profile Header (High-Contrast Center UI) */}
      <header className="gradient-blue pt-16 pb-24 px-6 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        </div>

        <div className="max-w-md mx-auto relative z-10 space-y-8">
          <div className="relative inline-block">
             <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-vora-primary app-shadow rotate-3 border-4 border-white/20">
                <span className="text-4xl sm:text-5xl font-black">{profile.avatarInitials}</span>
             </div>
             <motion.div 
               initial={{ scale: 0 }} animate={{ scale: 1 }}
               className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-vora-accent text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-vora-primary"
             >
                <Award size={20} />
             </motion.div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">{profile.full_name || 'Vora Scholar'}</h1>
            <div className="flex items-center justify-center space-x-2">
              <ShieldCheck size={16} className="text-white/60" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">{profile.voraRank}</span>
            </div>
          </div>

          <div className="pt-4">
            <XPBar current={profile.xp} total={xpThreshold} level={nextLevel} />
          </div>
        </div>
      </header>

      {/* Analytics & Progress Analytics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 -mt-12 relative z-20 w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Mastery Ring Card */}
          <div className="md:col-span-12 lg:col-span-5 bg-white rounded-[3rem] p-10 app-shadow border border-gray-50 flex flex-col items-center justify-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-10 w-full text-center">Mastery Velocity</h3>
            <MasteryRing progress={mastery.overall} label="Words Cached" />
            <div className="mt-10 grid grid-cols-2 gap-8 w-full">
              <div className="text-center">
                <span className="block text-2xl font-black text-vora-text">{mastery.masteredCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Archived</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-black text-vora-text">{mastery.totalSeen}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Logged</span>
              </div>
            </div>
          </div>

          {/* Category Deep Dive */}
          <div className="md:col-span-12 lg:col-span-7 bg-white rounded-[3rem] p-10 app-shadow border border-gray-50">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Contextual Success</h3>
                <div className="px-3 py-1 bg-vora-primary/5 text-vora-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-vora-primary/10">Active Tracking</div>
             </div>
             
             <div className="space-y-8">
               {categories.map((cat, idx) => (
                 <CategoryItem key={idx} label={cat.label} rate={cat.rate} />
               ))}
               
               <div className="pt-6 border-t border-gray-50">
                  <div className="flex items-center justify-between p-6 bg-vora-bg rounded-3xl">
                     <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-vora-primary shadow-sm">
                           <Zap size={24} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Active Uptime</p>
                           <h4 className="text-xl font-black text-vora-text">{profile.streak_count} Consecutive Days</h4>
                        </div>
                     </div>
                     <Star size={20} className="text-vora-accent" />
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* The Word Library (Mastered vs. Lab) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
               <button 
                 onClick={() => setActiveTab("mastered")}
                 className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "mastered" ? "bg-white text-vora-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
               >
                 Mastered ({mastery.masteredCount})
               </button>
               <button 
                 onClick={() => setActiveTab("lab")}
                 className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "lab" ? "bg-white text-vora-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
               >
                 The Lab ({mastery.labCount})
               </button>
            </div>
            
            {activeTab === "lab" && mastery.labCount > 0 && (
              <button 
                onClick={() => router.push("/games/time-attack")} // Or a specific review mode
                className="flex items-center space-x-3 px-8 py-4 bg-vora-text text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all interactive-tap group"
              >
                <FlaskConical size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Ignite Review Session</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <AnimatePresence mode="popLayout">
                {words[activeTab].map((word, idx) => (
                  <motion.div
                    key={word.word}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className={`bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-vora-primary/20 transition-all cursor-pointer group shadow-sm hover:shadow-xl ${expandedWord === word.word ? 'md:col-span-2 lg:col-span-2' : ''}`}
                    onClick={() => setExpandedWord(expandedWord === word.word ? null : word.word)}
                  >
                    <div className="flex items-start justify-between">
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-vora-primary mb-1 underline underline-offset-4 decoration-2">{word.category}</p>
                          <h4 className="text-3xl font-black text-vora-text tracking-tighter group-hover:text-vora-primary transition-colors">{word.word}</h4>
                          <p className="text-sm font-medium text-gray-400 mt-1 italic">{word.phonetic}</p>
                       </div>
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'mastered' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>
                          {activeTab === 'mastered' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                       </div>
                    </div>

                    <AnimatePresence>
                       {expandedWord === word.word && (
                         <motion.div 
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: "auto", opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="overflow-hidden"
                         >
                           <div className="pt-8 space-y-6">
                              <div className="space-y-2">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 block">Definition</span>
                                 <p className="text-base font-bold text-vora-text leading-relaxed">
                                    "{word.definition}"
                                 </p>
                              </div>
                              <div className="p-6 bg-vora-bg rounded-2xl border border-gray-50">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-vora-primary block mb-2">AI Rationale</span>
                                 <p className="text-sm font-medium text-gray-500 leading-relaxed italic">
                                    {word.rationale || "This word has been selected for its architectural precision in high-end discourse."}
                                 </p>
                              </div>
                              <div className="flex items-center justify-between pt-4">
                                 <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-bold text-gray-300 uppercase">Success Rate:</span>
                                    <span className="text-[10px] font-black text-vora-text">{word.success_rate}%</span>
                                 </div>
                                 <button className="text-[10px] font-black uppercase tracking-widest text-vora-primary hover:translate-x-1 transition-transform flex items-center">
                                    Full Card <ArrowRight size={14} className="ml-2" />
                                 </button>
                              </div>
                           </div>
                         </motion.div>
                       )}
                    </AnimatePresence>
                  </motion.div>
                ))}
             </AnimatePresence>
          </div>
        </div>

        {/* Level Cap & Accuracy Information */}
        <div className="bg-vora-text rounded-[3rem] p-10 sm:p-14 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12">
              <ShieldCheck size={200} />
           </div>
           
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                 <div>
                    <h3 className="text-4xl font-black tracking-tighter mb-2">Elevation Status</h3>
                    <p className="text-white/50 text-sm font-bold uppercase tracking-widest">Protocol Vanguard // Level Clearance</p>
                 </div>
                 
                 <div className="space-y-8 py-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                       <span className="text-[11px] font-black uppercase tracking-widest text-white/40">Current Accuracy</span>
                       <span className="text-3xl font-black">{mastery.overall}%</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                       <span className="text-[11px] font-black uppercase tracking-widest text-white/40">Target for Elevation</span>
                       <span className="text-3xl font-black text-vora-accent">90%</span>
                    </div>
                 </div>

                 <p className="text-xs font-medium text-white/40 leading-relaxed lowercase italic">
                    * continue demonstrating consistent lexical precision in "the lab" to trigger automated level elevation.
                 </p>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10">
                 <div className="w-20 h-20 bg-vora-accent text-white rounded-3xl flex items-center justify-center shadow-xl mb-6">
                    <History size={36} />
                 </div>
                 <h4 className="text-xl font-black mb-2">Lexical Ceiling</h4>
                 <p className="text-center text-white/40 text-sm font-medium max-w-[200px]">
                    You have mastered <span className="text-white font-black">{mastery.masteredCount}</span> out of the current <span className="text-white font-black">{profile.current_level}</span> tier capacity.
                 </p>
              </div>
           </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto mt-24 px-8 text-center sm:text-left opacity-10">
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">VORA VAULT // ANALYTICS_CORE_V4</p>
      </footer>

      <style jsx global>{`
        .gradient-blue {
          background: linear-gradient(135deg, #1A1C2E 0%, #3B58D8 100%);
        }
        .app-shadow {
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.1);
        }
        .interactive-tap:active {
          transform: scale(0.97);
        }
      `}</style>
    </main>
  );
}

function CheckCircle2(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function AlertCircle(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
