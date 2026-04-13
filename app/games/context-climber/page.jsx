"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Send, CheckCircle2, XCircle, ChevronDown, Loader2, Trophy } from "lucide-react";
import { getRandomWord } from "@/lib/word-utils";
import { validateUserSentence, syncProgression } from "@/app/actions/ai-actions";
import GameSetup from "@/components/ui/GameSetup";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ContextClimber() {
  const [gameState, setGameState] = useState("idle"); // idle, setup, playing
  const [profile, setProfile] = useState({ level: "Intermediate", interests: [], dynamicWords: [] });
  const [seenWords, setSeenWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [sentence, setSentence] = useState("");
  const [streak, setStreak] = useState(0);
  const [recentPerformance, setRecentPerformance] = useState([]); // Array of last 10 booleans
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [user, setUser] = useState(null);

  const router = useRouter();
  const supabase = createClient();
  
  // validation states: "idle", "analyzing", "success", "failure"
  const [validationState, setValidationState] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

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
        
        if (profileData && profileData.current_level) {
          setProfile({ 
            level: profileData.current_level, 
            interests: profileData.interests || [], 
            dynamicWords: profileData.dynamic_words || [] 
          });
          setStreak(profileData.streak_count || 0);
          setIsProfileReady(true);
          loadNextWord({ 
            level: profileData.current_level, 
            interests: profileData.interests || [], 
            dynamicWords: profileData.dynamic_words || [] 
          });
        }
      } else {
        const guestData = localStorage.getItem('vora_guest_profile');
        if (guestData) {
          const parsed = JSON.parse(guestData);
          setProfile({ 
            level: parsed.current_level || "Intermediate", 
            interests: parsed.interests || [], 
            dynamicWords: parsed.dynamicWords || [] 
          });
          setIsProfileReady(true);
          loadNextWord({ 
            level: parsed.current_level || "Intermediate", 
            interests: parsed.interests || [], 
            dynamicWords: parsed.dynamicWords || [] 
          });
        }
      }
    };

    checkUser();
  }, []);

  const loadNextWord = (currentProfile = profile) => {
    const tier = currentProfile.level || "Intermediate";
    const interests = currentProfile.interests || [];
    const dynamicPool = currentProfile.dynamicWords || [];
    
    const word = getRandomWord(tier, interests, dynamicPool, seenWords);
    if (word) {
      setCurrentWord(word);
      setSeenWords(prev => [...prev, word.id]);
      setSentence("");
      setValidationState("idle");
      setFeedback("");
      setShowFeedback(false);
    }
  };

  const handleSetupComplete = (config) => {
    const newProfile = { 
      level: config.level, 
      interests: config.interests, 
      dynamicWords: config.dynamicWords || [] 
    };
    setProfile(newProfile);
    setIsProfileReady(true);

    if (!user) {
      localStorage.setItem('vora_guest_profile', JSON.stringify(newProfile));
    } else {
      supabase.from('profiles').update({
        current_level: config.level,
        interests: config.interests,
        dynamic_words: config.dynamicWords || []
      }).eq('id', user.id);
    }
    
    loadNextWord(newProfile);
    setGameState("playing");
  };

  const handleAnalyze = async () => {
    if (!sentence.trim() || sentence.length < 5) return;
    
    setValidationState("analyzing");
    setShowFeedback(false);
    
    try {
      const result = await validateUserSentence(currentWord.word, sentence);
      
      const isSuccess = result.status === "SUCCESS";
      
      // Update local performance for Level Up check
      const newPerformance = [...recentPerformance, isSuccess].slice(-10);
      setRecentPerformance(newPerformance);

      // Check for Level Up (90% success in last 10)
      if (newPerformance.length >= 10 && newPerformance.filter(x => x).length >= 9) {
        setShowLevelUp(true);
      }

      if (isSuccess) {
        setValidationState("success");
        setStreak(prev => prev + 1);
        setFeedback(result.feedback);
      } else {
        setValidationState("failure");
        setStreak(0);
        setFeedback(result.feedback);
        setShowFeedback(true);
      }

      // Sync with Supabase
      setIsSyncing(true);
      await syncProgression(currentWord, isSuccess);
      setIsSyncing(false);

    } catch (err) {
      console.error("Evaluation Error", err);
      setValidationState("idle");
    }
  };

  const handleLevelUp = () => {
    setShowLevelUp(false);
    setRecentPerformance([]); // Reset after elevation
    setGameState("setup"); // Force setup to choose new level
  };

  return (
    <main className="min-h-screen bg-vora-bg flex flex-col font-sans relative">
      
      {/* Sticky Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between z-50 sticky top-0 glass shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push("/dashboard")} className="p-2 -ml-2 text-vora-text/40 hover:text-vora-primary transition-colors interactive-tap">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-[10px] uppercase tracking-widest text-vora-text/40 font-black leading-none mb-1">Context Climber</h1>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-vora-text uppercase tracking-tighter">{profile.level}</span>
              <div className="h-1 w-1 rounded-full bg-vora-text/20" />
              <div className="flex items-center space-x-1">
                <div className="text-[10px] font-bold text-vora-primary font-technical tracking-widest uppercase">Streak {streak}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-1.5 w-4 sm:w-6 rounded-full transition-all duration-300 ${i < Math.min(streak % 5 || (streak > 0 && 5), 5) ? 'bg-vora-primary' : 'bg-vora-text/10'}`} />
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-4 sm:px-8 max-w-4xl w-full mx-auto py-8">
        
        <AnimatePresence mode="wait">
          {gameState === "idle" ? (
            <motion.div
              key="idle-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-24 h-24 bg-vora-primary rounded-[2.5rem] flex items-center justify-center text-white mb-8 app-shadow rotate-12">
                <Sparkles size={48} strokeWidth={2.5} />
              </div>
              <h2 className="text-5xl font-black tracking-tighter text-vora-text mb-4">Context Climber</h2>
              <p className="text-base font-bold text-vora-text/40 max-w-sm mx-auto mb-12 uppercase tracking-widest leading-relaxed">
                Master the nuances of articulation through structural thought.
              </p>
              
              <div className="w-full max-w-xs space-y-4">
                <button
                  onClick={() => setGameState("setup")}
                  className="w-full py-6 rounded-2xl bg-vora-primary text-white text-[10px] uppercase tracking-[0.4em] font-black shadow-xl interactive-tap"
                >
                  Start Calibration
                </button>
                {isProfileReady && (
                  <button 
                    onClick={() => setGameState("playing")}
                    className="w-full py-5 rounded-2xl bg-white text-vora-text text-[10px] uppercase tracking-[0.4em] font-black app-shadow border border-vora-text/5 interactive-tap"
                  >
                    Quick Entry
                  </button>
                )}
              </div>
            </motion.div>
          ) : gameState === "setup" ? (
            <motion.div key="setup-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              <GameSetup 
                onBack={() => setGameState("idle")}
                onComplete={handleSetupComplete} 
                onLoginClick={() => router.push("/login?redirect=/games/context-climber")}
              />
            </motion.div>
          ) : gameState === "playing" ? (
            <motion.div 
              key="playing-state"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              {/* Massive Word Display */}
              <div className="text-center py-8">
                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-vora-primary/40 mb-4 block animate-pulse">Target Calibration Word</span>
                <h3 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-vora-text leading-none break-words">
                  {currentWord?.word || "..."}
                </h3>
                <div className="mt-6 flex flex-col items-center">
                  <span className="text-lg font-bold text-vora-text/60 font-serif italic mb-2 tracking-tight">"{currentWord?.definition}"</span>
                  <div className="px-4 py-1.5 bg-vora-primary/5 rounded-full border border-vora-primary/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-vora-primary">{currentWord?.level} Tier</span>
                  </div>
                </div>
              </div>

              {/* High-Legibility Input Area */}
              <div className="relative group">
                <textarea 
                  ref={inputRef}
                  value={sentence}
                  readOnly={validationState === "analyzing"}
                  onChange={(e) => setSentence(e.target.value)}
                  placeholder="Incorporate the word into a sophisticated context..."
                  disabled={validationState === "success" || validationState === "failure"}
                  className={`w-full bg-white border-4 rounded-[2rem] p-8 text-2xl sm:text-3xl font-bold tracking-tight text-vora-text placeholder:text-vora-text/10 focus:outline-none resize-none transition-all duration-500 app-shadow min-h-[200px] leading-relaxed ${
                    validationState === "success" ? "border-green-400 bg-green-50/10" :
                    validationState === "failure" ? "border-red-400 bg-red-50/10" :
                    "border-vora-text/5 focus:border-[#00bcd4] focus:ring-[12px] focus:ring-[#00bcd4]/5"
                  }`}
                  rows={4}
                />
                
                {/* Checking... Pulse Overlay */}
                <AnimatePresence>
                  {validationState === "analyzing" && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/70 backdrop-blur-md rounded-[2rem] flex flex-col items-center justify-center space-y-4"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-[#00bcd4]/20 rounded-full animate-ping absolute" />
                        <div className="w-16 h-16 border-4 border-[#00bcd4] border-t-transparent rounded-full animate-spin relative" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00bcd4] animate-pulse">Analyzing Nuance</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wide Primary Action Button */}
              <AnimatePresence mode="wait">
                {validationState === "idle" ? (
                  <motion.button 
                    key="submit"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={handleAnalyze}
                    disabled={sentence.trim().length < 5}
                    className="w-full py-6 sm:py-8 bg-vora-text text-white rounded-3xl font-black text-[10px] sm:text-xs uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all interactive-tap disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  >
                    <span>Validate Context</span>
                    <Send size={16} />
                  </motion.button>
                ) : (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Mastery Feedback Card */}
                    <div className={`rounded-3xl p-8 app-shadow border-2 transition-all duration-500 ${
                      validationState === "success" ? "bg-white border-green-100" : "bg-white border-red-100"
                    }`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          {validationState === "success" ? (
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                              <CheckCircle2 size={24} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                              <XCircle size={24} strokeWidth={3} />
                            </div>
                          )}
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${validationState === "success" ? "text-green-600" : "text-red-600"}`}>
                              {validationState === "success" ? "Lexical Mastery" : "Linguistic Fracture"}
                            </span>
                            <h4 className="text-xl font-black text-vora-text">
                              {validationState === "success" ? "Context Mastered!" : "Correction Required"}
                            </h4>
                          </div>
                        </div>
                        
                        {validationState === "success" && (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-amber-100 rounded-xl border border-amber-200">
                            <Trophy size={14} className="text-amber-600" />
                            <span className="text-[10px] font-black text-amber-600">+50 XP</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-vora-bg/50 rounded-2xl p-6 border border-vora-text/5">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-1.5 h-4 bg-vora-primary rounded-full" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-vora-text/40">Tutor Feedback</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-vora-text leading-relaxed">
                          {feedback}
                        </p>
                      </div>

                      <button 
                        onClick={() => loadNextWord()}
                        className="w-full mt-8 py-5 rounded-2xl bg-vora-bg text-vora-text text-[10px] uppercase tracking-[0.4em] font-black hover:bg-gray-100 transition-all interactive-tap border border-vora-text/5"
                      >
                        Advance to Next Calibration
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Level Up Mastery Modal */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-vora-text/60 backdrop-blur-xl"
              onClick={() => setShowLevelUp(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[3rem] p-10 sm:p-14 text-center relative z-10 app-shadow border border-white/20"
            >
              <div className="w-24 h-24 mx-auto bg-amber-400 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-amber-400/30" />
                <Trophy size={48} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-600 mb-4 block">Milestone Achieved</span>
              <h3 className="text-4xl font-black tracking-tight text-vora-text mb-4 leading-tight">Mastery Detected</h3>
              <p className="text-sm font-bold text-vora-text/50 uppercase tracking-widest mb-12 leading-relaxed">
                You have maintained a 90% accuracy rate. You are ready to elevate to the next tier of linguistic complexity.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleLevelUp}
                  className="w-full py-6 rounded-2xl bg-vora-primary text-white text-[10px] uppercase tracking-[0.4em] font-black shadow-lg interactive-tap"
                >
                  Elevate Tier
                </button>
                <button
                  onClick={() => setShowLevelUp(false)}
                  className="w-full py-4 text-[10px] uppercase tracking-widest font-black text-vora-text/30 hover:text-vora-text transition-colors interactive-tap"
                >
                  Remain in Current Flux
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>
    </main>
  );
}
