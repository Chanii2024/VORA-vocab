"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function GameCard({ title, description, category, href, image, wordCount }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl p-6 flex flex-col items-center justify-between min-h-[260px] transition-all duration-300 app-shadow hover:-translate-y-1 hover:shadow-xl interactive-tap border border-transparent hover:border-vora-primary/10"
    >
      <div className="w-full flex justify-end">
        <div className="p-2 rounded-full bg-vora-bg group-hover:bg-vora-primary/10 transition-colors">
          <ArrowUpRight size={16} className="text-vora-primary" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        {image ? (
          <img src={image} alt={title} className="h-16 w-auto group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="h-16 w-16 bg-gradient-to-br from-vora-primary/5 to-vora-primary/20 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
            <span className="text-[10px] font-bold uppercase tracking-widest text-vora-primary">Module</span>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-vora-primary mb-2">{category}</p>
          <h3 className="text-xl font-bold text-vora-text tracking-tight">{title}</h3>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-vora-bg w-full flex justify-center">
          <div className="flex items-center space-x-2 px-3 py-1 bg-vora-bg rounded-full">
            <Sparkles size={10} className="text-vora-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-vora-text/40">
              {wordCount || 0} Lessons
            </span>
          </div>
      </div>
      
      <a href={href} className="absolute inset-0 z-10" aria-label={`Open ${title} game`}></a>
    </motion.div>
  );
}
