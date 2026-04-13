"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const supabase = createClient();
  const [view, setView] = useState("login"); // login, signup

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Validation States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  // Real-time validation
  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("A valid email format is required.");
    } else {
      setEmailError("");
    }

    if (password && password.length < 6) {
      setPasswordError("Credentials must be at least 6 characters.");
    } else {
      setPasswordError("");
    }
  }, [email, password]);

  const handleGuestLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vora_guest', 'true');
      document.cookie = `vora_guest=true; path=/; max-age=${30 * 24 * 60 * 60}`;
      router.push(redirect === "/dashboard" ? "/onboarding" : redirect);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!email || !password || emailError || passwordError) {
      setAuthError("Please resolve formatting issues before proceeding.");
      return;
    }

    setLoading(true);

    try {
      if (view === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        // Push safely to onboarding after forge
        router.push(redirect === "/dashboard" ? "/onboarding" : redirect);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Push safely to dashboard after auth
        router.push(redirect);
      }
    } catch (error) {
      console.error(error);
      setAuthError(error.message || "An unexpected anomaly occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key={view}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 sm:p-10 space-y-6 sm:space-y-8 app-shadow skeleton-glow"
    >
      <AnimatePresence>
        {authError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 flex items-start space-x-3"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="text-[10px] uppercase tracking-widest font-bold leading-relaxed">{authError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-[9px] uppercase tracking-[0.3em] font-bold text-vora-primary ml-1">Master Email</label>
          </div>
          <div className="relative">
            <Mail size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${emailError ? 'text-red-400' : 'text-vora-text/30'}`} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-vora-bg border-none px-12 py-4 text-xs font-medium rounded-xl transition-all outline-none focus:ring-2 ${emailError ? 'ring-2 ring-red-400/50 bg-red-50/50' : 'focus:ring-vora-primary/20'}`} 
              placeholder="artisan@vora.com"
              autoComplete="off"
            />
          </div>
          {emailError && <p className="text-[9px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-widest">{emailError}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-[0.3em] font-black text-vora-primary/60 ml-1 font-technical">Access Credentials</label>
          <div className="relative">
            <Lock size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${passwordError ? 'text-red-400' : 'text-vora-text/30'}`} />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-vora-bg border-none px-12 py-4 text-sm font-medium rounded-xl transition-all outline-none focus:ring-2 ${passwordError ? 'ring-2 ring-red-400/50 bg-red-50/50' : 'focus:ring-vora-primary/20'}`} 
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          {passwordError && <p className="text-[9px] font-black text-red-500 ml-1 mt-1 uppercase tracking-widest font-technical">{passwordError}</p>}
        </div>

        <button 
          type="submit"
          disabled={loading || emailError || passwordError}
          className="w-full py-4 mt-4 bg-vora-primary text-white rounded-xl text-[10px] uppercase tracking-[0.5em] font-bold hover:bg-vora-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : (view === "login" ? "Enter Atelier" : "Forge Identity")}
        </button>
      </form>

      <div className="text-center pt-6 border-t border-vora-bg flex flex-col space-y-4">
        <button 
          onClick={() => {
            setView(view === "login" ? "signup" : "login");
            setAuthError("");
          }}
          className="text-[9px] uppercase tracking-[0.3em] font-bold text-vora-text/40 hover:text-vora-primary transition-colors"
          type="button"
        >
          {view === "login" ? "No identity yet? Forge Profile" : "Already an artisan? Authenticate"}
        </button>
        <button 
          onClick={handleGuestLogin}
          className="text-[9px] uppercase tracking-[0.3em] font-bold text-vora-primary/60 hover:text-vora-primary transition-colors mx-auto"
          type="button"
        >
          Examine as Guest
        </button>
      </div>
    </motion.div>
  );
}

export default function Login() {
  return (
    <main className="min-h-screen bg-vora-bg flex flex-col items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[url('/noise.png')]" />

      <a href="/" className="absolute top-6 sm:top-12 left-6 sm:left-12 p-2 text-vora-text/20 hover:text-vora-primary transition-colors z-20">
        <ArrowLeft size={20} strokeWidth={1} />
      </a>

      <div className="w-full max-w-sm z-10">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-vora-text uppercase">Atelier.</h1>
          <p className="text-[10px] uppercase tracking-[0.5em] text-vora-text/30 font-black">Linguistic // Identity // Forge</p>
        </header>

        <Suspense fallback={
          <div className="bg-white rounded-3xl p-10 h-[400px] flex items-center justify-center app-shadow">
            <Loader2 size={24} className="animate-spin text-vora-primary" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>

      <footer className="absolute bottom-8 text-[9px] uppercase tracking-[0.3em] text-vora-text/20 font-bold">
        Secured by VORA Infrastructure
      </footer>
    </main>
  );
}
