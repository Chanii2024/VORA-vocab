"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check, BookOpen, Atom, Brush, MessageSquare, Swords, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const INTERESTS = [
  { id: "academic", label: "Academic Research", icon: BookOpen },
  { id: "science", label: "Scientific Inquiry", icon: Atom },
  { id: "art", label: "Creative Arts", icon: Brush },
  { id: "donghua", label: "Cultivation // Donghua", icon: Swords },
  { id: "convo", label: "Daily Articulation", icon: MessageSquare },
];

const LEVELS = ["Beginner", "Intermediate", "Elite", "Master"];

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [level, setLevel] = useState("Intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleInterest = (id) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => setStep(prev => prev + 1);

  const handleEstablishProfile = async () => {
    setLoading(true);
    setError("");

    try {
      if (typeof window !== 'undefined' && localStorage.getItem('vora_guest') === 'true') {
        localStorage.setItem('vora_guest_profile', JSON.stringify({
          interests: selectedInterests,
          current_level: level,
          xp: 0
        }));
        setStep(3);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to establish profile.");

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          interests: selectedInterests,
          current_level: level,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setStep(3); // Proceed to Welcome Screen
      
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to establish profile.");
      setStep(2); // Stay on step 2
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-vora-bg flex flex-col items-center justify-center p-4 sm:p-8 font-sans overflow-x-hidden relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.03] bg-[url('/noise.png')]" />
      
      <div className="w-full max-w-xl relative py-12">
        <header className="text-center mb-12 relative z-10">
          <p className="text-[10px] uppercase tracking-[0.5em] text-vora-primary font-bold mb-4">The Orientation</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-vora-text">Define Your Path.</h1>
        </header>

        <div className="relative min-h-[500px] z-50">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-16 left-0 right-0 bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 flex items-start space-x-3 z-50"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="text-[10px] uppercase tracking-widest font-bold leading-relaxed">{error}</span>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Curate Your Interests</h2>
                  <p className="text-[10px] uppercase tracking-widest text-vora-text/40 font-bold mb-2">Select at least two fields of study</p>
                  {selectedInterests.length < 2 && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="text-[9px] font-bold text-vora-primary uppercase tracking-widest"
                    >
                      Waiting for {2 - selectedInterests.length} more selection{selectedInterests.length === 0 ? 's' : ''}...
                    </motion.p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {INTERESTS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => toggleInterest(id)}
                      className={`p-6 rounded-2xl flex items-center justify-between transition-all duration-300 group interactive-tap border-2 ${
                        selectedInterests.includes(id) 
                          ? 'bg-vora-primary text-white app-shadow border-transparent scale-[1.02]' 
                          : 'bg-white text-vora-text border-vora-bg hover:border-vora-primary/20'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <Icon size={16} className={selectedInterests.includes(id) ? 'text-white' : 'text-vora-primary'} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
                      </div>
                      {selectedInterests.includes(id) && <Check size={14} className="text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>

                <div className="pt-8 flex justify-center">
                  <button
                    disabled={selectedInterests.length < 2}
                    onClick={handleNext}
                    className="flex items-center space-x-4 px-8 py-4 rounded-full bg-vora-primary text-white text-[10px] uppercase tracking-[0.5em] disabled:opacity-20 disabled:scale-100 transition-all font-bold group interactive-tap hover:bg-vora-primary-dark"
                  >
                    <span>Proceed</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Architect Your Foundation</h2>
                  <p className="text-[10px] uppercase tracking-widest text-vora-text/40 font-bold">Where does your journey begin?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 transition-all duration-300 interactive-tap ${
                        level === lvl 
                          ? 'bg-white border-2 border-vora-primary shadow-lg -translate-y-1' 
                          : 'bg-white/50 border border-transparent hover:bg-white hover:border-vora-primary/20'
                      }`}
                    >
                      <span className={`text-[9px] uppercase tracking-[0.4em] font-bold ${level === lvl ? 'text-vora-primary' : 'text-vora-text/30'}`}>
                        Tier
                      </span>
                      <span className="text-xl font-bold tracking-tight text-vora-text">{lvl}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-8 flex justify-center">
                  <button
                    onClick={handleEstablishProfile}
                    disabled={loading}
                    className="flex items-center space-x-4 px-10 py-4 rounded-full bg-vora-primary text-white text-[10px] uppercase tracking-[0.5em] font-bold interactive-tap hover:bg-vora-primary-dark disabled:opacity-50 transition-all"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Establish Profile</span>}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center space-y-8 sm:space-y-10 py-8 sm:py-12 bg-white rounded-3xl p-6 sm:p-10 app-shadow text-center"
              >
                <div className="w-24 h-24 rounded-full bg-vora-bg flex items-center justify-center shadow-inner">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={32} className="text-vora-accent" strokeWidth={2} />
                  </motion.div>
                </div>
                
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight text-vora-text">Welcome to the Atelier.</h2>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-vora-text/40 font-bold leading-relaxed max-w-xs mx-auto">
                    Your linguistic identity is being woven into the fabric of VORA.
                  </p>
                </div>

                <a
                  href="/dashboard"
                  className="px-10 py-4 rounded-full bg-vora-primary text-white text-[10px] uppercase tracking-[0.5em] font-bold hover:bg-vora-primary-dark transition-all interactive-tap w-full mt-4 block"
                >
                  Enter Dashboard
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
