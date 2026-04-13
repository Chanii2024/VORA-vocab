"use client";

import { motion } from "framer-motion";

export default function MasteryRing({ progress = 0, label = "Mastery" }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="112"
          cy="112"
          r={radius}
          fill="none"
          stroke="#F1F5F9" // slate-100
          strokeWidth="16"
        />
        <motion.circle
          cx="112"
          cy="112"
          r={radius}
          fill="none"
          stroke="#3B58D8" // vora-primary
          strokeWidth="16"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "circOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black tracking-tighter text-vora-text">{progress}%</span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold mt-1">{label}</span>
      </div>
    </div>
  );
}
