"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  MessageCircle, 
  FlaskConical, 
  Sparkles, 
  Swords, 
  Briefcase, 
  ChevronRight, 
  Check, 
  LogIn,
  Info,
  AlertCircle,
  Loader2
} from "lucide-react";
import { generateContextualLexicon } from "@/lib/ai-service";

const CATEGORIES = [
  { id: "convo", label: "Daily Conversation", icon: MessageCircle, description: "Common words for everyday life." },
  { id: "academic", label: "Academic", icon: BookOpen, description: "Advanced vocabulary for studies & research." },
  { id: "science", label: "Science & Tech", icon: FlaskConical, description: "Terminology for STEM enthusiasts." },
  { id: "anime", label: "Anime / Manga", icon: Sparkles, description: "Terms common in Japanese media." },
  { id: "donghua", label: "Donghua / Cultivation", icon: Swords, description: "Specific terms for Chinese fantasy." },
  { id: "art", label: "Art & Culture", icon: Briefcase, description: "Creative and descriptive lexicon." },
];

const LEVELS = [
  { id: "Beginner", label: "Beginner", description: "I know some words but need the basics." },
  { id: "Intermediate", label: "Conversational", description: "I can speak but want to be more precise." },
  { id: "Elite", label: "Academic Elite", description: "I read a lot and want sophisticated words." },
  { id: "Master", label: "Domain Master", description: "I want complex, subject-specific mastery." },
];

export default function GameSetup({ onComplete, onLoginClick, onBack }) {
  const [step, setStep] = useState(1); // 1: Interests, 2: Levels
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const toggleInterest = (id) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    if (errors.interests) setErrors(prev => ({ ...prev, interests: null }));
  };

  const handleNext = async () => {
    if (step === 1) {
      if (selectedInterests.length === 0) {
        setErrors({ interests: "Select at least one focus to begin." });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedLevel) {
        setErrors({ level: "Choose your linguistic tier." });
        return;
      }
      
      // Phase 3: AI Synthesis
      setStep(3);
      setIsSynthesizing(true);
      
      try {
        const dynamicWords = await generateContextualLexicon(selectedLevel, selectedInterests, 8);
        onComplete({ 
          interests: selectedInterests, 
          level: selectedLevel,
          dynamicWords 
        });
      } catch (err) {
        console.error("Synthesis Failed", err);
        // Fallback to static only if AI fails
        onComplete({ interests: selectedInterests, level: selectedLevel, dynamicWords: [] });
      } finally {
        setIsSynthesizing(false);
      }
    }
  };

  const StepIndicator = ({ current }) => (
    <div className="flex items-center justify-center space-x-2 mb-12 sm:mb-16">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center">
          <div className={`h-1.5 transition-all duration-500 rounded-full ${i === current ? "w-12 bg-vora-primary" : "w-6 bg-vora-text/10"}`} />
          {i === 1 && <div className="mx-2 text-[10px] font-black tracking-widest text-vora-text/20 uppercase">Calibration</div>}
          {i === 2 && <div className="mx-2 text-[10px] font-black tracking-widest text-vora-text/20 uppercase">Sync</div>}
          {i === 3 && <div className="mx-2 text-[10px] font-black tracking-widest text-vora-text/20 uppercase">Synthesis</div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col justify-center px-4 py-8 md:py-16">
      <StepIndicator current={step} />
      
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="text-[10px] font-black uppercase tracking-widest text-vora-primary mb-6 block mx-auto interactive-tap opacity-60 hover:opacity-100"
                >
                  ← Back to Start
                </button>
              )}
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-vora-text leading-tight">What's your focus?</h2>
              <p className="text-[10px] md:text-xs font-bold text-vora-text/40 uppercase tracking-[0.2em]">
                Tailor your vocabulary pool with specialized domains.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedInterests.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleInterest(cat.id)}
                    className={`relative p-6 rounded-3xl text-left transition-all duration-300 group border-2 ${
                      isSelected 
                        ? "bg-vora-primary border-vora-primary shadow-xl shadow-vora-primary/20 scale-[1.02]" 
                        : "bg-white border-transparent hover:border-vora-primary/20 hover:shadow-lg"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                      isSelected ? "bg-white/20 text-white" : "bg-vora-bg text-vora-primary"
                    }`}>
                      <cat.icon size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className={`text-xl font-black mb-1 ${isSelected ? "text-white" : "text-vora-text"}`}>
                      {cat.label}
                    </h3>
                    <p className={`text-xs font-medium leading-relaxed ${isSelected ? "text-white/70" : "text-vora-text/40"}`}>
                      {cat.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-4 right-4 text-white">
                        <Check size={20} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {errors.interests && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center space-x-2 text-red-500 font-bold text-sm"
              >
                <AlertCircle size={16} />
                <span>{errors.interests}</span>
              </motion.div>
            )}

            <div className="flex flex-col items-center space-y-6 pt-4">
              <button
                onClick={handleNext}
                className="w-full md:w-auto px-12 py-5 rounded-2xl bg-vora-text text-white text-xs uppercase tracking-widest font-black hover:bg-vora-text/90 transition-all flex items-center justify-center shadow-2xl"
              >
                Continue <ChevronRight size={18} className="ml-2" />
              </button>

              <button 
                onClick={onLoginClick}
                className="flex items-center space-x-2 text-vora-primary font-bold text-xs uppercase tracking-widest hover:underline group"
              >
                <LogIn size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span>Already have an account? Sync Profile</span>
              </button>
            </div>
          </motion.div>
        ) : step === 2 ? (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <button 
                onClick={() => setStep(1)}
                className="text-[10px] font-black uppercase tracking-widest text-vora-primary mb-6 block mx-auto interactive-tap opacity-60 hover:opacity-100"
              >
                ← Back to Focus
              </button>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-vora-text leading-tight">What's your level?</h2>
              <p className="text-[10px] md:text-xs font-bold text-vora-text/40 uppercase tracking-[0.2em]">
                Select your initial calibration tier.
              </p>
            </div>

            <div className="flex flex-col space-y-4 max-w-xl mx-auto w-full">
              {LEVELS.map((level) => {
                const isSelected = selectedLevel === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => {
                      setSelectedLevel(level.id);
                      if (errors.level) setErrors(prev => ({ ...prev, level: null }));
                    }}
                    className={`relative p-6 rounded-3xl text-left transition-all duration-300 border-2 flex items-center justify-between ${
                      isSelected 
                        ? "bg-vora-primary border-vora-primary shadow-xl shadow-vora-primary/20 scale-[1.02]" 
                        : "bg-white border-transparent hover:border-vora-primary/20 hover:shadow-lg"
                    }`}
                  >
                    <div className="space-y-1">
                      <h3 className={`text-xl font-black ${isSelected ? "text-white" : "text-vora-text"}`}>
                        {level.label}
                      </h3>
                      <p className={`text-xs font-medium leading-relaxed ${isSelected ? "text-white/70" : "text-vora-text/40"}`}>
                        {level.description}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-white bg-white text-vora-primary" : "border-vora-bg bg-vora-bg"
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-vora-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {errors.level && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center space-x-2 text-red-500 font-bold text-sm"
              >
                <AlertCircle size={16} />
                <span>{errors.level}</span>
              </motion.div>
            )}

            <div className="flex flex-col items-center pt-8">
              <button
                onClick={handleNext}
                className="w-full md:w-auto px-16 py-6 rounded-2xl bg-vora-primary text-white text-xs uppercase tracking-widest font-black hover:bg-vora-primary-dark transition-all flex items-center justify-center shadow-2xl scale-110 active:scale-105"
              >
                Initialize Vora <Check size={20} className="ml-2" />
              </button>
              
              <div className="mt-12 p-6 bg-vora-bg rounded-2xl border border-vora-text/5 flex items-start space-x-4 max-w-md">
                <div className="mt-1 p-2 bg-white rounded-lg text-vora-primary">
                  <Info size={16} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-vora-text/60">Pro Tip</h4>
                  <p className="text-[11px] font-bold text-vora-text/40 italic leading-snug">
                    "Choose a level that feels slightly beyond your comfort zone. Vora's algorithms adapt to your speed and accuracy in real-time."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 space-y-8"
          >
            <div className="relative">
              <div className="w-24 h-24 border-2 border-vora-primary/10 rounded-full animate-ping absolute" />
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center app-shadow z-10 relative">
                <Loader2 size={32} className="text-vora-primary animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-vora-text mb-2">Lexicon Synthesis</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-vora-primary animate-pulse">
                VORA is weaving interest-aligned vocabulary...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
