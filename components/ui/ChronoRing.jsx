"use client";

import { motion } from "framer-motion";

export default function ChronoRing({ timeLeft, totalTime = 60 }) {
  const progress = timeLeft / totalTime;
  
  // Strong Blue for active, stark Red when time is low
  const strokeColor = progress > 0.25 ? "#3B58D8" : "#EF4444"; // vora-primary vs red-500

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 drop-shadow-md">
        {/* Background Track */}
        <circle
          cx="64"
          cy="64"
          r="56"
          fill="none"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth="6"
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx="64"
          cy="64"
          r="56"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 1 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 1, ease: "linear" }}
          style={{ strokeDasharray: "351.85", strokeDashoffset: "0" }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="text-4xl font-bold tracking-tight text-vora-text">{timeLeft}</span>
        <span className="text-[10px] uppercase tracking-widest text-vora-text/40 font-bold mt-0.5">Sec</span>
      </div>
    </div>
  );
}
