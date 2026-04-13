"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Heart, 
  Volume2, 
  ChevronUp, 
  ChevronRight, 
  Check, 
  X, 
  Loader2,
  RefreshCw,
  Trophy,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getRandomWord, getSynonymOptions } from "@/lib/word-utils";
import { analyzeMistake, validateSentence } from "@/lib/ai-service";
import { validateUserSentence, syncProgression } from "@/app/actions/ai-actions";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GameSetup from "@/components/ui/GameSetup";
import { words } from "@/lib/data/words";

const WORDS_PER_LEVEL = 5;
const MAX_LIVES = 3;
const LEVELS = [
  "Abyss", "Foothills", "Basecamp", "Ridge", "Crag", 
  "Plateau", "Summit", "Stratosphere", "Exosphere", "Zenith"
];

const LEVEL_HIERARCHY = ["Beginner", "Intermediate", "Elite", "Master"];

export default function TheAscent() {
  const [gameState, setGameState] = useState("idle"); // idle, setup, playing, level-up, game-over, win
  const [currentLevel, setCurrentLevel] = useState(0);
  const [progressInLevel, setProgressInLevel] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ 
    level: "Intermediate", 
    interests: [],
    dynamicWords: []
  });
  const [seenWords, setSeenWords] = useState([]);

  const router = useRouter();
  const supabase = createClient();
  
  // Rationale State
  const [showRationale, setShowRationale] = useState(false);
  const [aiRationale, setAiRationale] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Initialize Profile
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
          setIsProfileReady(true);
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
        }
      }
    };

    checkUser();
  }, []);

  // Word Loading Logic
  useEffect(() => {
    if (gameState === "playing" && !currentWord) {
      loadNextWord();
    }
  }, [gameState, currentWord]);

  const loadNextWord = (currentProfile = profile) => {
    const tier = LEVELS[currentLevel];
    const interests = currentProfile.interests || [];
    const dynamicPool = currentProfile.dynamicWords || [];
    
    // Pass seenWords to avoid immediate repeats
    const word = getRandomWord(tier, interests, dynamicPool, seenWords);
    if (word) {
      setCurrentWord(word);
      setOptions(getSynonymOptions(word, dynamicPool));
      setSeenWords(prev => [...prev, word.id]);
      setSelectedAnswer(null);
      setShowRationale(false);
      setAiRationale("");
    }
  };

  const handleAnswer = async (choice) => {
    if (selectedAnswer || showRationale) return;

    const isCorrect = currentWord.synonyms.map(s => s.toLowerCase()).includes(choice.toLowerCase());
    setSelectedAnswer({ choice, isCorrect });

    if (isCorrect) {
      setScore(prev => prev + (currentLevel + 1) * 10);
      const newProgress = progressInLevel + 1;
      
      // Update persistent profile
      syncProgression(currentWord, true);

      if (newProgress >= WORDS_PER_LEVEL) {
        setTimeout(() => {
          if (currentLevel >= LEVELS.length - 1) {
            setGameState("win");
          } else {
            setGameState("level-up");
          }
        }, 600);
      } else {
        setProgressInLevel(newProgress);
        setTimeout(loadNextWord, 800);
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      
      // Update persistent profile & failed words
      syncProgression(currentWord, false);

      setAiLoading(true);
      setShowRationale(true);
      const data = await analyzeMistake(currentWord.word, currentWord.word, choice);
      setAiRationale(data.rationale);
      setAiLoading(false);

      if (newLives <= 0) {
        // Allow time to read rationale before termination
        setTimeout(() => setGameState("game-over"), 5000);
      }
    }
  };

  const nextLevel = () => {
    const nextIdx = Math.min(currentLevel + 1, LEVELS.length - 1);
    setCurrentLevel(nextIdx);
    setProgressInLevel(0);
    setGameState("playing");
    loadNextWord();
  };

  const handleSetupComplete = (config) => {
    const startIdx = LEVEL_HIERARCHY.indexOf(config.level);
    const spread = [0, 3, 6, 9];
    const initialAltitude = spread[startIdx] || 0;
    setCurrentLevel(initialAltitude);

    const newProfile = { level: config.level, interests: config.interests, dynamicWords: config.dynamicWords || [] };
    setProfile(newProfile);
    setIsProfileReady(true);

    if (!user) {
      localStorage.setItem('vora_guest_profile', JSON.stringify(newProfile));
    } else {
      supabase.from('profiles').update({
        current_level: config.level,
        interests: config.interests,
        dynamic_words: config.dynamicWords
      }).eq('id', user.id);
    }
    
    setGameState("playing");
  };

  const resetGame = () => {
    setLives(MAX_LIVES);
    setScore(0);
    setGameState("idle");
    setProgressInLevel(0);
    setCurrentWord(null);
  };

  // Atmosphere Gradients
  const atmosphereGradients = [
    "from-slate-50 to-slate-200",    // Abyss
    "from-slate-100 to-slate-300",   // Foothills
    "from-blue-50 to-blue-200",      // Basecamp
    "from-blue-100 to-blue-300",     // Ridge
    "from-cyan-50 to-cyan-200",      // Crag
    "from-cyan-100 to-blue-300",     // Plateau
    "from-sky-100 to-indigo-300",    // Summit
    "from-indigo-100 to-indigo-500", // Stratosphere
    "from-indigo-400 to-indigo-900", // Exosphere
    "from-slate-900 to-black"        // Zenith
  ];

  return (
    <main className={`min-h-[100dvh] w-full bg-gradient-to-b ${atmosphereGradients[currentLevel]} flex flex-col font-sans relative transition-colors duration-[2500ms]`}>
      
      {/* Premium Technical Header */}
      <header className="fixed top-0 left-0 right-0 px-8 py-6 flex items-center justify-between z-[60] glass shadow-sm">
        <div className="flex items-center space-x-6">
          <button onClick={() => {
             if (gameState === "playing") setGameState("idle");
             else router.push("/dashboard");
          }} className="p-3 bg-white/10 rounded-full text-vora-text hover:text-vora-primary transition-all interactive-tap hover:scale-110">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[10px] uppercase tracking-[0.4em] text-vora-text/40 font-black mb-1">Ascension Expedition</h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-black text-vora-text uppercase tracking-tighter">{profile.level} Tier</span>
              <div className="w-1 h-1 rounded-full bg-vora-text/20" />
              <div className="text-[11px] font-bold text-vora-primary font-technical tracking-widest uppercase">Altitude {currentLevel + 1}/10 • {LEVELS[currentLevel]}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          {/* Progress Markers */}
          <div className="hidden sm:flex space-x-1 items-center">
            {LEVELS.map((_, i) => (
              <div 
                key={`header-altitude-${i}`} 
                className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i <= currentLevel ? 'bg-vora-primary' : 'bg-vora-text/10'}`} 
              />
            ))}
          </div>

          {/* Oxygen Reserve Bar */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-vora-text/40 mb-2">Oxygen Level</span>
            <div className="flex space-x-1.5">
              {[...Array(MAX_LIVES)].map((_, i) => (
                <motion.div 
                  key={`header-oxygen-${i}`} 
                  animate={i < lives ? { scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 0.2 }}
                  transition={i < lives ? { repeat: Infinity, duration: 2, delay: i * 0.3 } : {}}
                  className={`h-6 w-2 rounded-full transition-all duration-1000 ${i < lives ? 'bg-vora-primary shadow-[0_0_15px_rgba(197,162,125,0.6)]' : 'bg-vora-text/10'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Expedition Floor - Full Bleed */}
      <div className="flex-1 w-full relative z-10 flex flex-col lg:flex-row items-center justify-between px-8 lg:px-20 pt-32 pb-10">
        
        {/* Left Anchor: Secondary Metrics (Desktop) */}
        <div className="hidden lg:flex flex-col items-start space-y-12 w-64">
           <div className="space-y-4">
             <span className="text-[10px] uppercase font-black tracking-widest text-vora-text/30">Vertical Displacement</span>
             <div className="w-2 h-64 bg-black/5 rounded-full relative overflow-hidden">
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 bg-vora-primary"
                  animate={{ height: `${((currentLevel * WORDS_PER_LEVEL + progressInLevel) / (LEVELS.length * WORDS_PER_LEVEL)) * 100}%` }}
                  transition={{ type: "spring", stiffness: 40 }}
                />
             </div>
             <span className="text-[10px] font-bold text-vora-primary uppercase">Zenith Goal</span>
           </div>
           
           <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 w-full shadow-inner">
             <span className="text-[10px] font-black uppercase tracking-widest text-vora-text/40 block mb-3">Score Buffer</span>
             <div className="text-3xl font-black text-vora-text font-technical">{score}</div>
           </div>
        </div>

        {/* Center Stage: The Word */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-10">
          <AnimatePresence mode="wait">
            {gameState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto bg-vora-bg rounded-3xl flex items-center justify-center text-vora-primary mb-10 shadow-2xl rotate-12 relative">
                  <ChevronUp size={56} strokeWidth={3} className="animate-pulse" />
                </div>
                <h2 className="text-7xl font-black tracking-tighter text-vora-text mb-6">The Ascent</h2>
                <p className="text-sm font-bold text-vora-text/40 max-w-sm mx-auto mb-16 uppercase tracking-[0.3em] leading-relaxed">
                   Conquer linguistic tiers through precise contextual alignment.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                  <button onClick={() => setGameState("setup")} className="px-12 py-6 bg-vora-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl interactive-tap">Initiate Calibration</button>
                  {isProfileReady && (
                    <button onClick={() => setGameState("playing")} className="px-10 py-5 bg-white/20 backdrop-blur-md text-vora-text border border-white/30 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] interactive-tap">Resume Quick Ascent</button>
                  )}
                </div>
              </motion.div>
            )}

            {gameState === "setup" && (
               <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl">
                 <GameSetup onBack={() => setGameState("idle")} onComplete={handleSetupComplete} onLoginClick={() => router.push("/login?redirect=/games/the-ascent")} />
               </motion.div>
            )}

            {gameState === "playing" && currentWord && (
              <motion.div
                key={currentWord.id}
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
                className="w-full h-full flex flex-col"
              >
                <div className="text-center mb-20 relative">
                  <span className="text-[10px] uppercase font-black tracking-[0.8em] text-vora-primary/40 mb-6 block animate-pulse">Vertical Target Detected</span>
                  <h3 className="text-8xl sm:text-9xl lg:text-[10rem] font-black tracking-tighter text-vora-text leading-none break-words select-none transition-all">
                    {currentWord.word}
                  </h3>
                  <div className="mt-10 flex flex-col items-center">
                    <button 
                      onClick={() => {
                        const utterance = new SpeechSynthesisUtterance(currentWord.word);
                        utterance.rate = 0.8;
                        window.speechSynthesis.speak(utterance);
                      }}
                      className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-vora-primary transition-all interactive-tap mb-4"
                    >
                      <Volume2 size={24} />
                    </button>
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-vora-text/30">{currentWord.phonetic || "Phonetic Calibration Pending"}</span>
                  </div>
                </div>

                {/* Bottom Anchored Synchronicity Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
                   {options.map((option, idx) => {
                      const isTarget = currentWord.synonyms.includes(option);
                      const isSelected = selectedAnswer?.choice === option;
                      
                      let btnClass = "bg-white/10 backdrop-blur-md border border-white/10 text-vora-text";
                      if (selectedAnswer) {
                        if (isTarget) btnClass = "bg-green-500 text-white shadow-[0_0_25px_rgba(34,197,94,0.5)] border-green-400 scale-105";
                        else if (isSelected) btnClass = "bg-red-500 text-white opacity-40 border-red-400 strike";
                        else btnClass = "opacity-20 grayscale brightness-50";
                      }

                      return (
                        <button
                          key={`${option}-${idx}`}
                          onClick={() => handleAnswer(option)}
                          className={`py-8 px-8 rounded-3xl text-sm sm:text-base font-black uppercase tracking-[0.3em] border-2 transition-all duration-500 interactive-tap ${btnClass} hover:border-vora-primary/50 hover:bg-white/20`}
                        >
                          {option}
                        </button>
                      );
                   })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Anchor: Intelligence Feedback (Desktop) */}
        <div className="hidden lg:flex flex-col items-end space-y-12 w-64 mt-12">
            <AnimatePresence>
               {gameState === "playing" && !showRationale && (
                 <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="p-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-[2.5rem] shadow-2xl">
                    <div className="w-12 h-12 bg-vora-primary/10 rounded-2xl flex items-center justify-center text-vora-primary mb-6">
                      <Zap size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-vora-primary block mb-3">Linguistic Sherpa</span>
                    <p className="text-[13px] font-bold text-vora-text/60 leading-relaxed italic">
                      {currentLevel < 3 ? '"The abyss is deep, but your trajectory is sound. Breathe through the foothills."' : 
                       currentLevel < 7 ? '"The air thins at altitude. Precision is your only anchor now."' : 
                       '"Behold the Zenith. You are among the linguistic pioneers."'}
                    </p>
                 </motion.div>
               )}
            </AnimatePresence>
            
            <div className="flex flex-col items-center">
               <span className="text-[10px] font-black uppercase tracking-widest text-vora-text/20 mb-4">Vertical Progress</span>
               <div className="flex -space-x-3">
                 {LEVELS.slice(0, 5).map((l, i) => (
                   <div key={`altitude-node-${i}`} className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black tracking-tighter ${i <= currentLevel ? 'bg-vora-primary text-white' : 'bg-vora-bg text-vora-text/20'}`}>
                      {i + 1}
                   </div>
                 ))}
               </div>
            </div>
        </div>
      </div>

      {/* Persistence & Feedback Overlays */}
      <AnimatePresence mode="wait">
         {showRationale ? (
           <motion.div 
             key="rationale-overlay"
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/40 backdrop-blur-2xl"
           >
              <motion.div 
                initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-white rounded-[3rem] p-12 sm:p-20 text-center app-shadow border border-white/20"
              >
                 <div className="w-20 h-20 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-10">
                    <X size={32} strokeWidth={3} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 mb-6 block">Intelligence Rationale</span>
                 <p className="text-xl sm:text-2xl font-bold text-vora-text leading-relaxed italic mb-12">
                   "{aiRationale || "Calibrating the nuances of your choice..."}"
                 </p>
                 {lives > 0 ? (
                    <button onClick={loadNextWord} className="w-full py-6 bg-vora-text text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.5em] interactive-tap">Continue Sequence</button>
                 ) : (
                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-8 animate-pulse">Oxygen Depleted • Recovery Impending</div>
                 )}
              </motion.div>
           </motion.div>
         ) : gameState === "level-up" ? (
            <motion.div 
              key="levelup-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-8"
            >
               <div className="absolute inset-0 bg-vora-primary/95 backdrop-blur-3xl" />
               <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative z-10 text-center max-w-lg">
                  <div className="w-24 h-24 mx-auto bg-white/10 rounded-[2rem] flex items-center justify-center text-white mb-12 border border-white/20 shadow-2xl">
                    <ChevronUp size={56} strokeWidth={3} className="animate-bounce" />
                  </div>
                  <h2 className="text-white text-[10px] uppercase tracking-[0.6em] font-black opacity-60 mb-6">Ascension Confirmed</h2>
                  <h3 className="text-6xl sm:text-8xl font-black text-white tracking-tighter mb-8 leading-none">Altitude Reached.</h3>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em] mb-16 leading-relaxed">Ambient atmospheric pressure normalization in progress.</p>
                  <button onClick={nextLevel} className="px-16 py-7 rounded-2xl bg-white text-vora-primary text-[11px] uppercase tracking-[0.4em] font-black shadow-2xl interactive-tap">Advance to {LEVELS[currentLevel + 1]}</button>
               </motion.div>
            </motion.div>
         ) : null}
      </AnimatePresence>

      <AnimatePresence>
         {gameState === "game-over" && (
            <motion.div key="game-over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[130] flex items-center justify-center p-8 bg-red-900/95 backdrop-blur-2xl">
               <div className="text-center max-w-md">
                 <div className="w-24 h-24 mx-auto bg-white/10 text-white rounded-full flex items-center justify-center mb-10 border border-white/20">
                    <X size={48} strokeWidth={3} />
                 </div>
                 <h2 className="text-4xl font-black text-white tracking-tight mb-4">Expedition Failure</h2>
                 <p className="text-sm text-white/40 mb-16 font-bold uppercase tracking-widest">Oxygen reserves depleted. Base extraction complete.</p>
                 <button onClick={resetGame} className="w-full py-6 rounded-2xl bg-white text-red-900 text-[10px] uppercase tracking-[0.4em] font-black shadow-2xl">Return to Abyss</button>
               </div>
            </motion.div>
         )}

         {gameState === "win" && (
            <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[140] flex items-center justify-center p-8 bg-amber-500/95 backdrop-blur-3xl">
               <div className="text-center max-w-xl">
                 <div className="w-24 h-24 mx-auto bg-white/20 text-white rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl">
                    <Trophy size={56} strokeWidth={3} />
                 </div>
                 <h2 className="text-7xl font-black text-white tracking-tighter mb-4 leading-none">Zenith Reached</h2>
                 <p className="text-sm text-white/60 mb-16 font-black uppercase tracking-[0.3em] max-w-xs mx-auto">You have mastered the highest altitude of the current lexicon flux.</p>
                 <button onClick={resetGame} className="px-20 py-7 rounded-2xl bg-white text-amber-600 text-[11px] uppercase tracking-[0.4em] font-black shadow-2xl hover:bg-amber-50">Base Extraction</button>
               </div>
            </motion.div>
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
