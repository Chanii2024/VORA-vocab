"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function HorizontalCard({ title, image, href, onHover }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      onMouseEnter={onHover}
      className="flex-shrink-0 w-[140px] md:w-[200px] h-[180px] md:h-[240px] bg-white rounded-3xl flex flex-col items-center justify-between p-6 transition-all duration-300 app-shadow relative cursor-pointer group"
    >
      <div className="flex-1 flex items-center justify-center w-full mb-2">
        {image ? (
          <img src={image} alt={title} className="max-h-[80px] w-auto object-contain transition-all duration-300" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-vora-bg text-vora-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
             <Play size={24} className="ml-1" strokeWidth={3} />
          </div>
        )}
      </div>
      
      <div className="w-full text-center">
        <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-vora-text font-black">{title}</h4>
        <div className="w-6 h-1 bg-vora-primary mx-auto mt-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <a href={href} className="absolute inset-0 z-10" aria-label={`Play ${title}`}></a>
    </motion.div>
  );
}
