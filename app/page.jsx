"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogIn, Menu, ArrowRight, X } from "lucide-react";
import HorizontalCard from "@/components/ui/HorizontalCard";

const games = [
  { 
    id: "ascent",
    title: "The Ascent", 
    href: "/games/the-ascent",
    color: "#EFF6FF", // Blue 50
  },
  { 
    id: "attack",
    title: "Time Attack", 
    href: "/games/time-attack",
    color: "#F0FDF4", // Green 50
  },
  { 
    id: "climber",
    title: "Context Climber", 
    href: "/games/context-climber",
    color: "#FEF2F2", // Red 50
  },
];

export default function Home() {
  const [activeGame, setActiveGame] = useState({ ...games[0], color: "#F8F9FA", isDefault: true });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main className="h-[100dvh] overflow-hidden flex flex-col font-sans relative bg-vora-bg">
      {/* Immersive Global Background Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeGame.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
          style={{ backgroundColor: activeGame.color }}
        >
          
          {/* Large scale background branding */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <span className="font-bold text-[28vw] opacity-[0.03] select-none tracking-tighter uppercase text-vora-text">
              {activeGame.isDefault ? "VORA" : activeGame.title}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Header */}
      <header className="px-4 sm:px-6 md:px-10 py-4 sm:py-8 flex items-center justify-between shrink-0 z-20 relative">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-tighter text-vora-primary leading-none">VORA</h1>
          <span className="text-[10px] uppercase tracking-widest text-vora-text/40 mt-1 font-bold">Linguistic Laboratory</span>
        </div>

        <nav className="hidden lg:flex items-center space-x-12 absolute left-1/2 -translate-x-1/2">
          {["Platform", "Methodology", "Pricing"].map((item) => (
            <a key={item} href="#" className="text-xs uppercase tracking-widest text-vora-text/60 font-bold hover:text-vora-primary transition-colors interactive-tap">
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center space-x-6">
          <a href="/login" className="hidden md:flex items-center space-x-2 text-vora-text font-bold text-xs uppercase tracking-widest hover:text-vora-primary interactive-tap">
            <LogIn size={18} strokeWidth={2} />
            <span>Login</span>
          </a>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 bg-white rounded-full app-shadow interactive-tap text-vora-text hover:text-vora-primary transition-colors"
            aria-label="Toggle Menu"
          >
             {isMobileMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-24 left-4 sm:left-6 right-4 sm:right-6 bg-white/95 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-white/50 z-50 lg:hidden flex flex-col space-y-6"
          >
            {["Platform", "Methodology", "Pricing"].map((item) => (
              <a key={item} href="#" className="text-xl uppercase tracking-tighter text-vora-text font-black hover:text-vora-primary transition-colors">
                {item}
              </a>
            ))}
            <div className="pt-6 mt-2 border-t border-vora-bg">
              <a href="/login" className="flex flex-row items-center justify-between w-full p-4 rounded-2xl bg-vora-primary text-white font-black text-xs uppercase tracking-widest hover:bg-vora-primary-dark transition-all interactive-tap shadow-lg">
                <span>Enter Laboratory</span>
                <LogIn size={18} strokeWidth={2.5} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Content Container */}
      <div className="flex-1 flex flex-col relative z-10 min-h-0">
        
        {/* Middle: Hero Content */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 md:px-10 lg:px-24 min-h-0 py-8 sm:py-4 lg:pb-0">
          <div className="z-10 w-full text-left">
            <div>
              <h2 className="text-6xl sm:text-[10vw] lg:text-[8vw] font-black leading-[0.9] tracking-tighter text-vora-text flex flex-col mb-6 sm:mb-8">
                <span>Master</span>
                <span className="text-vora-primary">Syntax.</span>
              </h2>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
                 <a href="/onboarding" className="px-10 py-5 rounded-2xl bg-vora-primary text-white text-xs uppercase tracking-widest font-black interactive-tap shadow-lg text-center hover:bg-vora-primary-dark">
                    Start Learning
                 </a>
                 <a href="/login" className="px-10 py-5 rounded-2xl bg-white text-vora-text text-xs uppercase tracking-widest font-black interactive-tap app-shadow text-center hover:text-vora-primary">
                    Return to Dashboard
                 </a>
              </div>
            </div>
          </div>
          
          <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-end text-right space-y-2 opacity-20">
              <span className="text-[12px] uppercase tracking-widest font-black">System Status</span>
              <span className="text-[12px] uppercase tracking-widest font-bold text-vora-primary">Optimal</span>
          </div>
        </div>

        {/* Bottom Panel */}
        <section className="shrink-0 w-full mt-auto mb-8 sm:mb-12">
          <div className="flex flex-col lg:flex-row h-full">
            <div className="w-full lg:w-auto flex items-center px-4 sm:px-6 md:px-10 lg:px-24 py-4 lg:py-0 relative">
              <div className="flex items-center justify-between w-full lg:w-auto z-10 gap-x-12">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black tracking-tight leading-none text-vora-text mb-1">Active</h3>
                  <h3 className="text-xl font-black tracking-tight leading-none text-vora-primary">Modules</h3>
                </div>
                <motion.div whileHover={{ x: 5 }} className="hidden lg:flex p-3 bg-white rounded-full app-shadow text-vora-primary">
                  <ArrowRight size={20} strokeWidth={3} />
                </motion.div>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto no-scrollbar py-4 lg:py-0 flex items-center px-4 sm:px-6 lg:px-0 w-full min-w-0">
              <div className="flex space-x-4 sm:space-x-6 w-max pl-2 lg:pl-10">
                {games.map((game) => (
                  <HorizontalCard 
                    key={game.title}
                    onHover={() => setActiveGame(game)}
                    title={game.title}
                    href={game.href}
                  />
                ))}
                <div className="w-8 sm:w-32 flex-shrink-0" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
