"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, Target, Zap, ChevronUp, Ghost, Check, X, Loader2, Info } from "lucide-react";
import ChronoRing from "@/components/ui/ChronoRing";
import { getRandomWord, getSynonymOptions } from "@/lib/word-utils";
import { analyzeMistake } from "@/lib/ai-service";
import GameSetup from "@/components/ui/GameSetup";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getNextLevel } from "@/lib/progression";

const GAME_DURATION = 60;

export default function TimeAttack() {
  const [gameState, setGameState] = useState("idle"); // idle, setup, playing, finished
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [attempts, setAttempts] = useState({ correct: 0, total: 0 });
  const [personalBestWPM, setPersonalBestWPM] = useState(0);
  const [mistakesLog, setMistakesLog] = useState([]);
  
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showElevation, setShowElevation] = useState(false);
  const [profile, setProfile] = useState({ level: "Intermediate", interests: [], dynamicWords: [] });
  const [seenWords, setSeenWords] = useState([]);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [user, setUser] = useState(null);
  
  const router = useRouter();
  const supabase = createClient();
  
  // Review Mode States
  const [reviewingMistakes, setReviewingMistakes] = useState(false);
  const [currentMistakeIndex, setCurrentMistakeIndex] = useState(0);
  const [aiRationale, setAiRationale] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    const pb = localStorage.getItem("vora_timeattack_wpm_pb") || 0;
    setPersonalBestWPM(parseInt(pb));
    
    // Check if logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Load profile from DB
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData && profileData.current_level) {
          setProfile({ 
            level: profileData.current_level, 
            interests: profileData.interests || [] 
          });
          setIsProfileReady(true);
        }
      } else {
        // Check guest profile
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
    
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSetupComplete = (config) => {
    const newProfile = { level: config.level, interests: config.interests };
    setProfile(newProfile);
    setIsProfileReady(true);
    
    // Persist as guest if not logged in
    if (!user) {
      localStorage.setItem('vora_guest_profile', JSON.stringify({
        current_level: config.level,
        interests: config.interests
      }));
    } else {
      // Sync with Supabase (simplified)
      supabase.from('profiles').update({
        current_level: config.level,
        interests: config.interests
      }).eq('id', user.id);
    }
    
    // Merge AI synthesized words into the session profile
    setProfile({ ...newProfile, dynamicWords: config.dynamicWords || [] });
    startGame({ ...newProfile, dynamicWords: config.dynamicWords || [] });
  };

  const handleElevate = async () => {
    const elevatedLevel = getNextLevel(profile.level);
    const newProfile = { ...profile, level: elevatedLevel };
    setProfile(newProfile);
    setShowElevation(false);
    
    if (!user) {
      localStorage.setItem('vora_guest_profile', JSON.stringify({
        current_level: elevatedLevel,
        interests: profile.interests
      }));
    } else {
      await supabase.from('profiles').update({
        current_level: elevatedLevel
      }).eq('id', user.id);
    }
    
    startGame(newProfile);
  };

  const startGame = (currentProfile = profile) => {
    setGameState("playing");
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setStreak(0);
    setMultiplier(1);
    setAttempts({ correct: 0, total: 0 });
    setMistakesLog([]);
    setSeenWords([]);
    setSelectedAnswer(null);
    setShowElevation(false);
    setReviewingMistakes(false);
    loadNextWord(currentProfile);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const loadNextWord = (currentProfile = profile) => {
    const tier = currentProfile.level || "Intermediate";
    const interests = currentProfile.interests || [];
    const dynamicPool = currentProfile.dynamicWords || [];
    
    // Leverage word-filtering utility with dynamic pool and history exclusion
    const nextWord = getRandomWord(tier, interests, dynamicPool, seenWords);
    
    if (nextWord) {
      setCurrentWord(nextWord);
      setOptions(getSynonymOptions(nextWord, dynamicPool));
      setSelectedAnswer(null);
      setSeenWords(prev => [...prev, nextWord.id]);
    }
  };

  const handleAnswer = (choice) => {
    if (selectedAnswer) return;

    const isCorrect = currentWord.synonyms.includes(choice);
    setSelectedAnswer({ choice, isCorrect });
    
    setAttempts(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      if (newStreak >= 3) {
        setMultiplier(2);
        setTimeout(() => setMultiplier(1), 5000);
      }
      setScore(prev => prev + (10 * multiplier));
    } else {
      setStreak(0);
      setMultiplier(1);
      setMistakesLog(prev => [...prev, { word: currentWord.word, correct: currentWord.synonyms[0], userChoice: choice }]);
    }

    setTimeout(() => {
      loadNextWord();
    }, 400);
  };

  const endGame = () => {
    setGameState("finished");
    const accuracy = attempts.total > 0 ? (attempts.correct / attempts.total) * 100 : 0;
    if (accuracy >= 85 && attempts.total >= 10) {
      setTimeout(() => setShowElevation(true), 1500);
    }
  };

  const getVoraRating = (wpm) => {
    if (wpm < 10) return "Novice";
    if (wpm < 20) return "Articulate";
    if (wpm < 30) return "Fluent";
    if (wpm < 40) return "Eloquent";
    return "Stellar";
  };

  const handleReviewMistakes = async () => {
    if (mistakesLog.length === 0) return;
    setReviewingMistakes(true);
    loadMistakeRationale(0);
  };

  const loadMistakeRationale = async (index) => {
    setCurrentMistakeIndex(index);
    setAiLoading(true);
    setAiRationale("");
    const mistake = mistakesLog[index];
    const data = await analyzeMistake(mistake.word, mistake.correct, mistake.userChoice);
    setAiRationale(data.rationale);
    setAiLoading(false);
  };

  return (
    <main className="min-h-screen bg-vora-bg flex flex-col font-sans relative select-none">

      <header className="px-6 py-4 flex items-center justify-between z-50 sticky top-0 glass shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push("/dashboard")} className="p-2 -ml-2 text-vora-text/40 hover:text-vora-primary transition-colors interactive-tap">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-[10px] uppercase tracking-widest text-vora-text/40 font-black leading-none mb-1">Time Attack</h1>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-vora-text uppercase tracking-tighter">{profile.level}</span>
              <div className="h-1 w-1 rounded-full bg-vora-text/20" />
              <div className="text-[10px] font-bold text-vora-primary font-technical tracking-widest uppercase">Score {score}</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {multiplier > 1 && (
             <motion.div 
               initial={{ scale: 0.8 }} animate={{ scale: 1 }}
               className="px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center"
             >
               <Zap size={10} className="mr-1" /> x{multiplier}
             </motion.div>
          )}
          <div className="flex items-center space-x-1">
             <div className={`h-10 w-10 flex items-center justify-center rounded-full border-2 ${timeLeft < 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-vora-text/10 text-vora-text'}`}>
                <span className="text-sm font-black font-technical">{timeLeft}s</span>
             </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col relative z-10 px-4 md:px-8 max-w-4xl w-full mx-auto pb-8">
        <AnimatePresence mode="wait">
          {gameState === "idle" ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-3xl app-shadow p-8 my-8"
            >
              <div className="w-24 h-24 mb-8 bg-vora-bg rounded-full flex items-center justify-center text-vora-primary shadow-inner">
                 <RefreshCw size={40} strokeWidth={2} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-vora-text">Ready for the Sprint?</h2>
              <p className="text-[10px] uppercase tracking-widest text-vora-text/50 font-bold mb-12">Match synonyms. Stay precise. Break your record.</p>
              
              <div className="flex flex-col space-y-4 w-full md:w-auto">
                <button 
                  onClick={() => setGameState("setup")}
                  className="px-12 py-5 rounded-2xl bg-vora-primary text-white text-xs uppercase tracking-widest hover:bg-vora-primary-dark transition-all font-bold interactive-tap shadow-lg"
                >
                  Start Setup & Play
                </button>
                
                {isProfileReady && (
                  <button 
                    onClick={() => startGame()}
                    className="px-12 py-4 rounded-2xl bg-vora-bg text-vora-text text-xs uppercase tracking-widest hover:bg-gray-100 transition-all font-bold interactive-tap border border-vora-text/5"
                  >
                    Quick Start ({profile.level})
                  </button>
                )}
              </div>
            </motion.div>
          ) : gameState === "setup" ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex-1 w-full"
            >
              <GameSetup 
                onBack={() => setGameState("idle")}
                onComplete={handleSetupComplete} 
                onLoginClick={() => router.push("/login?redirect=/games/time-attack")}
              />
            </motion.div>
          ) : gameState === "playing" ? (
            <motion.div
              key="playing-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col w-full"
            >
              {personalBestWPM > 0 && (
                <div className="w-full max-w-sm mx-auto h-1.5 bg-vora-text/5 rounded-full mt-2 relative -translate-y-4">
                  <div className="absolute right-0 -top-5 text-[9px] uppercase tracking-widest font-black text-vora-text/30">PB: {personalBestWPM} WPM</div>
                  
                  <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 text-vora-text/20 z-10"
                    animate={{ left: `${Math.min(100, ((GAME_DURATION - timeLeft) / GAME_DURATION) * 100)}%` }}
                    transition={{ ease: "linear", duration: 1 }}
                  >
                    <Ghost size={14} fill="currentColor" />
                  </motion.div>

                  <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-vora-primary shadow-[0_0_8px_rgba(59,88,216,0.8)] z-20"
                    animate={{ left: `${Math.min(100, (attempts.correct / Math.max(personalBestWPM, 1)) * 100)}%` }}
                    transition={{ type: "spring" }}
                  />
                </div>
              )}

              <div className="flex justify-center mt-2">
                <ChronoRing timeLeft={timeLeft} totalTime={GAME_DURATION} />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-8">
                <motion.div
                  key={currentWord?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 w-full"
                >
                  <p className="text-xs uppercase tracking-widest text-vora-primary font-black mb-2">Find Synonym</p>
                  <h3 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-vora-text break-words">
                    {currentWord?.word}
                  </h3>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mt-auto">
                {options.map((option, idx) => {
                  let bgColor = "bg-white hover:bg-vora-bg";
                  let textColor = "text-vora-text";
                  let borderColor = "border-transparent";

                  if (selectedAnswer) {
                    if (option === currentWord.synonyms[0]) {
                      bgColor = "bg-green-500 scale-105 shadow-xl";
                      textColor = "text-white font-black";
                    } else if (selectedAnswer.choice === option) {
                      bgColor = "bg-red-500 scale-95 opacity-50";
                      textColor = "text-white line-through";
                    } else {
                      bgColor = "bg-gray-100 opacity-30";
                    }
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: selectedAnswer ? 1 : 0.95 }}
                      onClick={() => handleAnswer(option)}
                      className={`h-20 md:h-28 lg:h-32 rounded-3xl flex items-center justify-center text-xl md:text-2xl font-bold uppercase tracking-wider transition-all duration-300 app-shadow ${bgColor} ${textColor} ${borderColor}`}
                    >
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : reviewingMistakes ? (
            <motion.div
              key="mistakes-review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center w-full"
            >
              <div className="w-full max-w-xl bg-white rounded-3xl p-8 md:p-10 app-shadow relative">
                <div className="absolute top-4 right-4 text-[10px] font-bold text-gray-300">
                   {currentMistakeIndex + 1} / {mistakesLog.length}
                </div>
                <h2 className="text-[10px] uppercase font-bold tracking-widest text-vora-text/40 mb-6 flex items-center">
                  <Target size={14} className="mr-2" /> Post-Sprint Analysis
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-vora-primary">Target Word</span>
                    <h3 className="text-4xl font-black tracking-tighter text-vora-text mt-1">{mistakesLog[currentMistakeIndex].word}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-red-400 block mb-1">You Selected</span>
                        <div className="flex items-center text-red-600 font-bold text-lg"><X size={16} className="mr-1"/> {mistakesLog[currentMistakeIndex].userChoice}</div>
                     </div>
                     <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-green-500 block mb-1">True Synonym</span>
                        <div className="flex items-center text-green-600 font-bold text-lg"><Check size={16} className="mr-1"/> {mistakesLog[currentMistakeIndex].correct}</div>
                     </div>
                  </div>

                  <div className="bg-vora-bg p-6 rounded-2xl min-h-[120px] flex items-center justify-center">
                     {aiLoading ? (
                       <Loader2 size={24} className="animate-spin text-vora-primary" />
                     ) : (
                       <p className="text-sm font-medium text-vora-text tracking-normal leading-relaxed italic border-l-2 border-vora-primary pl-4">
                         "{aiRationale}"
                       </p>
                     )}
                  </div>
                </div>

                <div className="mt-10 flex space-x-3">
                  <button 
                    onClick={() => setReviewingMistakes(false)}
                    className="flex-1 py-5 rounded-2xl bg-vora-text text-white text-[10px] uppercase font-black tracking-widest interactive-tap"
                  >
                    Exit Intel
                  </button>
                  <button 
                    onClick={() => {
                      const next = (currentMistakeIndex + 1) % mistakesLog.length;
                      loadMistakeRationale(next);
                    }}
                    className="flex-1 py-5 rounded-2xl bg-vora-primary text-white text-[10px] uppercase font-black tracking-widest interactive-tap"
                  >
                    Next Insight
                  </button>
                </div>
              </div>
            </motion.div>
          ) : gameState === "finished" ? (
            <motion.div
              key="results-dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex max-w-lg mx-auto items-center justify-center w-full"
            >
              <div className="w-full bg-white rounded-3xl app-shadow p-8 md:p-12 relative overflow-hidden flex flex-col font-mono text-vora-text shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                <div className="text-center pb-6 border-b-2 border-dashed border-gray-100">
                   <h2 className="text-[10px] uppercase tracking-[0.5em] font-black mb-2 text-vora-primary/60">SPRINT ANALYSIS</h2>
                   <h3 className="text-4xl font-black tracking-tighter text-vora-text font-technical">DATA_CORE</h3>
                   <p className="text-[9px] mt-1 text-gray-400 font-bold uppercase tracking-widest">{new Date().toLocaleDateString()} // SESSION_SYNC</p>
                </div>

                 <div className="py-8 space-y-6 border-b-2 border-dashed border-gray-100">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-vora-text/40">Lexical Velocity</span>
                        <span className="text-3xl font-black font-technical">{attempts.correct} <span className="text-[10px] text-gray-300 ml-1">WPM</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-vora-text/40">Total Queries</span>
                        <span className="text-xl font-bold font-technical">{attempts.total}</span>
                    </div>
                    <div className="flex justify-between items-center bg-vora-bg/50 p-4 rounded-2xl border border-vora-text/5">
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-vora-primary">Accuracy</span>
                        <span className="text-2xl font-black text-vora-primary font-technical">{attempts.total > 0 ? Math.round((attempts.correct/attempts.total)*100) : 0}%</span>
                    </div>
                </div>

                 <div className="py-8 text-center border-b-2 border-dashed border-gray-100">
                    <span className="block text-[10px] uppercase font-black tracking-[0.3em] text-vora-text/20 mb-3">Linguistic Tier</span>
                    <span className="text-5xl font-black uppercase tracking-tighter text-vora-accent drop-shadow-sm">{getVoraRating(attempts.correct)}</span>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 font-sans">
                   {mistakesLog.length > 0 && (
                     <button 
                       onClick={handleReviewMistakes}
                       className="w-full py-4 rounded-xl bg-black text-white text-[10px] uppercase tracking-widest font-bold interactive-tap shadow-lg flex items-center justify-center hover:bg-gray-800"
                     >
                       <Info size={14} className="mr-2" /> Review Mistakes ({mistakesLog.length})
                     </button>
                   )}
                   <button 
                    onClick={startGame}
                    className="w-full py-4 rounded-xl bg-vora-primary text-white text-[10px] uppercase tracking-widest font-bold interactive-tap shadow-lg flex items-center justify-center hover:bg-vora-primary-dark"
                   >
                     <RefreshCw size={14} className="mr-2" /> Retry Sprint
                   </button>
                </div>
              </div>
            </motion.div>
          ) : gameState === "finished" && showElevation && !reviewingMistakes ? (
            <motion.div
              key="elevation"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md rounded-3xl"
            >
              <div className="text-center p-8 max-w-sm">
                <motion.div 
                  initial={{ scale: 0.5, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.6 }}
                  className="w-24 h-24 mx-auto bg-vora-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-vora-primary/30 mb-8"
                >
                  <ChevronUp size={48} strokeWidth={3} />
                </motion.div>
                <h2 className="text-4xl font-black tracking-tighter text-vora-text mb-4">Ready for Elevation?</h2>
                <p className="text-sm font-bold text-vora-text/50 mb-10 leading-relaxed">
                  Your accuracy consistently breaks 80%. It's time to test your mastery in the <strong className="text-vora-primary">Elite</strong> tier.
                </p>
                <div className="space-y-4">
                  <button 
                    onClick={handleElevate}
                    className="w-full py-5 rounded-2xl bg-vora-primary text-white text-xs uppercase tracking-widest font-bold shadow-xl hover:bg-vora-primary-dark interactive-tap transition-all"
                  >
                    Elevate to {getNextLevel(profile.level)}
                  </button>
                  <button 
                    onClick={() => setShowElevation(false)}
                    className="w-full py-5 rounded-2xl bg-vora-bg text-vora-text text-xs uppercase tracking-widest font-bold interactive-tap hover:bg-gray-200 transition-all"
                  >
                    Stay Intermediate
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
