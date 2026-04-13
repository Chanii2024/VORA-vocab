"use client";

import { motion } from "framer-motion";

export default function XPBar({ current, total, level }) {
  const percentage = Math.min(100, (current / total) * 100);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Next Elevation: {level}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{current} / {total} XP</span>
      </div>
      <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
        />
      </div>
    </div>
  );
}
