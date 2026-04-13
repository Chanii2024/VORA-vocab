"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle, 
  Lock, 
  Unlock,
  CheckCircle2,
  Trophy,
  History,
  RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GameSetup from "@/components/ui/GameSetup";
import { fetchDetectiveChallenge, resolveDetectiveCase } from "@/app/actions/ai-actions";

export default function DetectiveGame() {
  const [gameState, setGameState] = useState("idle"); // idle, setup, loading, playing, solved
  const [challenge, setChallenge] = useState(null);
  const [guess, setGuess] = useState("");
  const [revealedCount, setRevealedCount] = useState(1);
  const [errorFeedback, setErrorFeedback] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [solvedData, setSolvedData] = useState(null);
  
  const [profile, setProfile] = useState({ level: "Intermediate", interests: [] });
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [user, setUser] = useState(null);
  
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile({ 
            level: profileData.current_level || "Intermediate", 
            interests: profileData.interests || [] 
          });
          setIsProfileReady(true);
        }
      } else {
        const guestData = localStorage.getItem('vora_guest_profile');
        if (guestData) {
          const parsed = JSON.parse(guestData);
          setProfile({ 
            level: parsed.current_level || "Intermediate", 
            interests: parsed.interests || [] 
          });
          setIsProfileReady(true);
        }
      }
    };
    checkUser();
  }, []);

  const handleSetupComplete = async (config) => {
    setProfile(config);
    setIsProfileReady(true);
    startNewCase(config);
  };

  const startNewCase = async (currentProfile = profile) => {
    setGameState("loading");
    setRevealedCount(1);
    setGuess("");
    setSolvedData(null);
    
    const data = await fetchDetectiveChallenge(
      currentProfile.level, 
      currentProfile.interests, 
      currentProfile.dynamicWords || []
    );
    
    if (data) {
      setChallenge(data);
      setGameState("playing");
    } else {
      setGameState("idle");
      // Could add a toast here
    }
  };

  const handleRevealClue = () => {
    if (revealedCount < 3) {
      setRevealedCount(prev => prev + 1);
    }
  };

  const handleSubmitGuess = async (e) => {
    if (e) e.preventDefault();
    if (!guess.trim() || isResolving) return;

    setIsResolving(true);
    const result = await resolveDetectiveCase(
      challenge.wordId, 
      guess, 
      revealedCount, 
      challenge.hiddenWord
    );

    if (result.correct) {
      setSolvedData(result);
      setGameState("solved");
    } else {
      setErrorFeedback(true);
      setTimeout(() => setErrorFeedback(false), 500);
    }
    setIsResolving(false);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col font-sans relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] grayscale">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vora-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vora-primary rounded-full blur-[120px]" />
      </div>

      {/* Persistent Header */}
      <header className="px-6 py-5 flex items-center justify-between z-50 sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => gameState === "playing" ? setGameState("idle") : router.push("/dashboard")} 
            className="p-2 -ml-2 text-gray-400 hover:text-vora-primary transition-colors interactive-tap"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black leading-none mb-1">Bureau of Lexicon</h1>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-vora-text uppercase tracking-tighter">Case File: #VOR-{String(challenge?.wordId || "0000").substring(0,4)}</span>
            </div>
          </div>
        </div>
        
        {gameState === "playing" && (
          <div className="flex items-center space-x-2 bg-vora-primary/5 px-3 py-1.5 rounded-full border border-vora-primary/10">
            <ShieldCheck size={14} className="text-vora-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-vora-primary">{profile.level} Tier</span>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col px-4 sm:px-8 max-w-4xl w-full mx-auto py-8 relative">
        <AnimatePresence mode="wait">
          {gameState === "idle" ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-3xl app-shadow flex items-center justify-center text-vora-primary rotate-3">
                  <Search size={40} strokeWidth={2.5} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-vora-accent rounded-xl flex items-center justify-center text-white shadow-lg rotate-12">
                  <Lock size={16} />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter text-vora-text">The Detective</h2>
                <p className="text-base font-bold text-gray-400 max-w-xs mx-auto uppercase tracking-widest leading-relaxed">
                  Identify the hidden word through progressive AI intelligence.
                </p>
              </div>

              <div className="w-full max-w-xs space-y-4">
                <button
                  onClick={() => setGameState("setup")}
                  className="w-full py-6 rounded-2xl bg-vora-primary text-white text-[10px] uppercase tracking-[0.4em] font-black shadow-xl interactive-tap shadow-vora-primary/20"
                >
                  Initiate Investigation
                </button>
                {isProfileReady && (
                  <button 
                    onClick={() => startNewCase()}
                    className="w-full py-5 rounded-2xl bg-white text-vora-text text-[10px] uppercase tracking-[0.4em] font-black app-shadow border border-gray-100 interactive-tap text-gray-400 hover:text-vora-text transition-colors"
                  >
                    Resume Active Profile
                  </button>
                )}
              </div>
            </motion.div>
          ) : gameState === "setup" ? (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <GameSetup 
                onBack={() => setGameState("idle")}
                onComplete={handleSetupComplete} 
                onLoginClick={() => router.push("/login?redirect=/games/detective")}
              />
            </motion.div>
          ) : gameState === "loading" ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center space-y-8"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: [0, 15, -15, 0], y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 bg-white rounded-[2.5rem] app-shadow flex items-center justify-center text-vora-primary"
                >
                  <Search size={44} strokeWidth={2.5} />
                </motion.div>
                <div className="absolute inset-0 bg-vora-primary/5 rounded-[2.5rem] animate-ping" />
              </div>
              <div className="text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-vora-primary animate-pulse block">Analyzing Lexicon</span>
                <p className="text-sm font-bold text-gray-400 italic">"The mystery of language is the beginning of wisdom."</p>
              </div>
            </motion.div>
          ) : gameState === "playing" ? (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 flex-1 flex flex-col"
            >
              {/* Case File Container */}
              <div className="bg-white rounded-[3rem] app-shadow p-8 sm:p-12 relative overflow-hidden border border-gray-50 flex-1 flex flex-col">
                {/* Confidential Stamp */}
                <div className="absolute top-8 right-8 rotate-12 opacity-10 pointer-events-none select-none">
                  <div className="border-4 border-vora-primary px-4 py-1 rounded-sm">
                    <span className="text-4xl font-black text-vora-primary">DETECTIVE</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mb-10">
                  <div className="w-1.5 h-6 bg-vora-primary rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Word Analysis Brief</h3>
                </div>

                {/* Clue Stack */}
                <div className="space-y-4 flex-1">
                  {[1, 2, 3].map((num) => (
                    <motion.div
                      key={`clue-${num}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: revealedCount >= num ? 1 : 0.4, 
                        x: 0,
                        filter: revealedCount >= num ? "blur(0px)" : "blur(4px)"
                      }}
                      className={`p-6 rounded-3xl border-2 transition-all duration-500 overflow-hidden relative ${
                        revealedCount >= num 
                          ? "bg-[#f8fafc] border-gray-100 ring-2 ring-vora-primary/5" 
                          : "bg-gray-50 border-transparent grayscale select-none cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${revealedCount >= num ? "text-vora-primary" : "text-gray-300"}`}>
                          Evidence #{num} {num === 1 && "(Vague)"} {num === 2 && "(Specific)"} {num === 3 && "(Critical)"}
                        </span>
                        {revealedCount >= num ? (
                          <Unlock size={14} className="text-vora-primary/40" />
                        ) : (
                          <Lock size={14} className="text-gray-300" />
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <p className={`text-base sm:text-lg font-bold leading-relaxed ${revealedCount >= num ? "text-vora-text" : "text-transparent"}`}>
                          {challenge.clues[`clue${num}`]}
                        </p>
                        {revealedCount < num && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/40 backdrop-blur-sm">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Locked Content</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Reveal Action */}
                {revealedCount < 3 && (
                  <button
                    onClick={handleRevealClue}
                    className="mt-6 w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-vora-primary hover:text-vora-primary transition-all interactive-tap group flex flex-col items-center justify-center space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <Search size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Reveal Supplementary Clue</span>
                    </div>
                    <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Penalty: Deduction Reward Decreased ({revealedCount === 1 ? '50XP → 25XP' : '25XP → 10XP'})</span>
                  </button>
                )}

                {/* Guess Input */}
                <form 
                  onSubmit={handleSubmitGuess}
                  className="mt-10"
                >
                  <motion.div 
                    animate={errorFeedback ? { x: [-10, 10, -10, 10, 0] } : {}}
                    className={`relative rounded-[2rem] border-4 transition-all duration-300 overflow-hidden ${
                      errorFeedback ? "border-red-400" : "border-vora-primary"
                    }`}
                  >
                    <input 
                      ref={inputRef}
                      autoFocus
                      type="text"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      placeholder="Enter the mysterious word..."
                      className="w-full bg-white p-6 sm:p-8 text-xl sm:text-2xl font-black text-vora-text placeholder:text-gray-200 focus:outline-none uppercase tracking-widest"
                    />
                    <button 
                      type="submit"
                      disabled={!guess.trim() || isResolving}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 bg-vora-text text-white rounded-2xl flex items-center justify-center interactive-tap disabled:opacity-20"
                    >
                      {isResolving ? (
                        <RotateCcw className="animate-spin" size={20} />
                      ) : (
                        <ChevronRight size={28} strokeWidth={3} />
                      )}
                    </button>
                  </motion.div>
                  <p className="mt-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center">Press Enter to File Guess</p>
                </form>
              </div>
            </motion.div>
          ) : gameState === "solved" ? (
            <motion.div 
              key="solved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center space-y-8 py-12"
            >
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-32 h-32 bg-vora-primary text-white rounded-[3rem] flex items-center justify-center shadow-2xl shadow-vora-primary/40"
                >
                  <CheckCircle2 size={64} strokeWidth={2.5} />
                </motion.div>
                <motion.div 
                  animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border-2 border-dashed border-vora-primary/20 rounded-full"
                />
              </div>

              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">Case Solved</div>
                  <div className="flex items-center space-x-1 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Trophy size={12} />
                    <span>+{solvedData.xpEarned} XP</span>
                  </div>
                </div>
                <h2 className="text-6xl sm:text-8xl font-black tracking-tighter text-vora-text uppercase leading-none">
                  {challenge.hiddenWord}
                </h2>
                <div className="w-16 h-1 w-vora-primary mx-auto rounded-full" />
                <p className="text-lg font-bold text-gray-400 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
                  Linguistic Intelligence: {revealedCount === 1 ? 'Elite Detective' : revealedCount === 2 ? 'Master Sleuth' : 'Analytical Specialist'}
                </p>
              </div>

              <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 app-shadow border border-gray-100 text-center">
                 <div className="flex items-center justify-center space-x-2 text-[10px] font-black text-vora-primary uppercase tracking-[0.3em] mb-4">
                    <History size={14} />
                    <span>Linguistic Context</span>
                 </div>
                 <p className="text-base font-bold text-vora-text leading-relaxed">
                   "{solvedData.sync?.newXp ? 'Your linguistic profile has reached a new threshold of precision.' : 'Mastery of this lexical mystery has been recorded in the persistent sanctuary.'}"
                 </p>
              </div>

              <button 
                onClick={() => startNewCase()}
                className="w-full max-w-xs py-6 rounded-2xl bg-vora-primary text-white text-[10px] uppercase tracking-[0.4em] font-black shadow-xl interactive-tap shadow-vora-primary/20"
              >
                Accept Next Case
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .glass {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .app-shadow {
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.08);
        }
        .interactive-tap:active {
          transform: scale(0.97);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </main>
  );
}
