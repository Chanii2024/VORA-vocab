"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ShoppingBag, User, Sparkles, Volume2, Plus, BookOpen, ArrowRight } from "lucide-react";
import GameCard from "@/components/ui/GameCard";
import ProgressRing from "@/components/ui/ProgressRing";
import MobileNav from "@/components/layout/MobileNav";
import DesktopSideNav from "@/components/layout/DesktopSideNav";
import { createClient } from "@/lib/supabase/client";
import { getWordOfTheDay, getWordCount, getDailyTask } from "@/lib/word-utils";
import { useRouter } from "next/navigation";

const games = [
  {
    title: "The Ascent",
    category: "Progression",
    level: "Intermediate",
    description: "Master words through level-based challenges.",
    href: "/games/the-ascent",
  },
  {
    title: "Time Attack",
    category: "Speed",
    level: "Elite",
    description: "Match synonyms at high speed.",
    href: "/games/time-attack",
  },
  {
    title: "Context Climber",
    category: "Application",
    level: "Master",
    description: "Complete sentences in contextual scenarios.",
    href: "/games/context-climber",
  },
  {
    title: "The Detective",
    category: "Logic",
    level: "Intermediate",
    description: "Identify the hidden word through progressive clues.",
    href: "/games/detective",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [wotd, setWotd] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [task, setTask] = useState(null);
  
  // Profile State
  const [profile, setProfile] = useState({
    email: "Loading...",
    level: "Apprentice",
    xp: 0
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (typeof window !== 'undefined' && localStorage.getItem('vora_guest_profile')) {
        const guestData = JSON.parse(localStorage.getItem('vora_guest_profile'));
        setProfile({
          email: "Guest Artisan",
          level: guestData.current_level || "Intermediate",
          xp: guestData.xp || 0
        });
        setWotd(getWordOfTheDay(guestData.current_level, guestData.interests));
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login"); // Force login if unauthenticated
        return;
      }

      // Fetch the custom Profile row
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          email: user.email,
          level: profileData.current_level,
          xp: profileData.xp
        });
        
        // Use custom interests for Word of the Day!
        setWotd(getWordOfTheDay(profileData.current_level, profileData.interests));
      } else {
        setWotd(getWordOfTheDay());
      }
    };

    fetchProfile();
    setTask(getDailyTask());
  }, []);

  return (
    <main className="min-h-screen bg-vora-bg overflow-x-hidden flex flex-col font-sans pb-32 relative md:pl-[260px]">
      <DesktopSideNav />
      {/* Dynamic Header with Profile Context & Progress */}
      <header className="px-4 sm:px-8 pt-6 sm:pt-10 pb-20 sm:pb-32 gradient-blue relative z-10">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between z-20 relative">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6 md:w-1/2">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-5">
               <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                  <User size={28} className="text-white" />
               </div>
               <div>
                  <p className="text-xs uppercase tracking-widest text-white/60 mb-1 font-bold">Vora Learner</p>
                  <h1 className="text-3xl md:text-4xl text-white font-bold tracking-tight">{profile.email.split('@')[0]}</h1>
               </div>
            </div>

            <div className="flex items-center space-x-3">
               <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center space-x-2 shadow-md">
                  <Sparkles size={16} className="text-vora-accent" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-technical">{profile.xp} XP // {profile.level}</span>
               </div>
            </div>
          </div>

          <div className="mt-10 md:mt-0 flex justify-center md:justify-end md:w-1/2">
             <ProgressRing progress={75} label="Level Mastery" />
          </div>
        </div>

        {/* Decorative branding */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
           <span className="text-[200px] font-bold text-white leading-none tracking-tighter">VORA</span>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 -mt-10 relative z-20 w-full space-y-8 sm:space-y-12">
        {/* Daily Word of the Day - High Visibility Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12">
            <motion.div
              layout
              onClick={() => setRevealed(true)}
              className="bg-white rounded-[2rem] p-6 sm:p-10 md:p-14 app-shadow relative cursor-pointer overflow-hidden group border border-transparent hover:border-vora-primary/10 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-[1.6] transition-transform duration-700">
                 <BookOpen size={120} className="text-vora-primary" />
              </div>

              <AnimatePresence mode="wait">
                {!revealed ? (
                  <motion.div
                    key="hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10 space-y-8"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-vora-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                       <Plus size={28} className="text-vora-primary" strokeWidth={2.5} />
                    </div>
                    <div className="text-center">
                       <p className="text-xs font-bold uppercase tracking-[0.6em] text-vora-primary mb-2">Focus Point</p>
                       <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Reveal Daily Curation</h2>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-10"
                  >
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                      <div>
                        <div className="flex items-center space-x-3 mb-4">
                          <span className="px-3 py-1 rounded-full bg-vora-primary/10 text-vora-primary text-[10px] font-bold uppercase tracking-widest flex items-center shadow-sm">
                            <Sparkles size={10} className="mr-2" />
                            VORA Intelligence
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-black/20 italic font-technical">{wotd?.level} Tier</span>
                        </div>
                        <h2 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-vora-text leading-[0.9] break-words w-full">{wotd?.word}</h2>
                        <div className="flex items-center space-x-4 mt-4">
                           <p className="text-xl font-medium text-vora-primary italic">{wotd?.phonetic}</p>
                           <button className="p-3 rounded-2xl bg-vora-bg hover:bg-vora-primary hover:text-white transition-all">
                              <Volume2 size={20} />
                           </button>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-vora-bg rounded-3xl max-w-sm hidden md:block">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-[#C5A27D] mb-2">Daily Directive</p>
                         <h4 className="text-base font-bold">{task?.goal}</h4>
                         <p className="text-xs text-black/40 mt-1">{task?.reward}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10 border-t border-vora-bg">
                      <div className="lg:col-span-2 space-y-4">
                         <p className="text-lg md:text-xl font-medium leading-relaxed text-black/70 italic">
                            &quot;{wotd?.definition}&quot;
                         </p>
                         <div className="p-5 sm:p-8 bg-vora-bg rounded-3xl border border-black/[0.02]">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-3">Enunciated Context</p>
                            <p className="text-sm md:text-base leading-relaxed text-black/60 font-medium">
                               {wotd?.exampleSentence}
                            </p>
                         </div>
                      </div>

                      <div className="p-5 sm:p-8 bg-vora-primary/5 rounded-[2rem] border border-vora-primary/10 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles size={24} className="text-vora-primary" />
                         </div>
                         <p className="text-[10px] font-bold uppercase tracking-widest text-vora-primary mb-4">AI Insight // Rationale</p>
                         <p className="text-sm leading-relaxed text-black/60 font-medium italic">
                           {wotd?.rationale}
                         </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Learning Pathways Grid */}
        <div className="space-y-8">
          <div className="flex items-end justify-between border-b border-vora-bg pb-6">
             <div>
                <h3 className="text-2xl font-bold tracking-tight text-vora-text">Learning Pathways</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mt-1">Select a module to begin</p>
             </div>
             <button className="text-[10px] font-bold uppercase tracking-widest text-vora-primary hover:translate-x-1 transition-transform flex items-center">
                All Modules <ArrowRight size={14} className="ml-2" />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Featured Next Module */}
            <div className="order-first md:col-span-1 lg:col-span-1 border-2 border-dashed border-vora-bg rounded-2xl p-8 flex flex-col justify-center bg-white/50 relative group hover:border-vora-primary/20 transition-colors">
               <div className="absolute top-4 right-4 text-vora-bg group-hover:text-vora-primary/20 transition-colors">
                  <Plus size={24} />
               </div>
               <h4 className="text-xl font-bold mb-4 italic text-black/20">Next Arrival</h4>
               <p className="text-[10px] font-bold text-black/30 leading-relaxed uppercase tracking-widest">
                 Upcoming modules are manually curated for seasonal refinement.
               </p>
               <div className="mt-8">
                 <span className="text-3xl font-bold text-vora-bg">2026</span>
               </div>
            </div>
            
            {games.map((game) => (
              <GameCard 
                key={game.title} 
                {...game} 
                wordCount={getWordCount(game.level)}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto mt-16 sm:mt-24 pt-8 sm:pt-12 border-t border-vora-bg text-center md:text-left px-4 sm:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/10">
          VORA PLATFORM © 2026 — Optimized for the Modern Artisan
        </p>
      </footer>

      <MobileNav />
    </main>
  );
}
