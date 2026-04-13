"use client";

import { motion } from "framer-motion";

export default function CategoryItem({ label, rate }) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-gray-400">
        <span>{label}</span>
        <span className="text-vora-text">{rate}% Win Rate</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-vora-primary rounded-full shadow-[0_0_8px_rgba(59,88,216,0.3)]"
        />
      </div>
    </div>
  );
}
