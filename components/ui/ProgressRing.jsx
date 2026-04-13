"use client";

import { motion } from "framer-motion";

export default function ProgressRing({ progress = 75, label = "Complete" }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        {/* Background Track (Dark Blue/Translucent) */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="12"
        />
        {/* Animated Progress Ring (Yellow) */}
        <motion.circle
          cx="96"
          cy="96"
          r={radius}
          fill="none"
          stroke="#EAB308" /* Yellow-500 */
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-4xl font-bold tracking-tight">{progress}%</span>
        <span className="text-[10px] uppercase tracking-widest text-white/50 mt-1">{label}</span>
      </div>
    </div>
  );
}
