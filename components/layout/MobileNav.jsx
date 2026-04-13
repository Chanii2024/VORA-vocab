"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, User, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Modules", icon: Gamepad2, href: "#" },
  { label: "Arsenal", icon: BookOpen, href: "#" },
  { label: "Profile", icon: User, href: "#" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      <div className="mx-4 mb-4 bg-white rounded-3xl app-shadow flex items-center justify-around h-20 px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border border-vora-bg">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full interactive-tap"
            >
              <div
                className={cn(
                  "p-3 rounded-2xl transition-all duration-300",
                  isActive ? "bg-vora-primary/10 text-vora-primary shadow-inner" : "text-vora-text/30 hover:bg-vora-bg hover:text-vora-text"
                )}
              >
                <Icon size={26} strokeWidth={isActive ? 3 : 2} />
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="activeNavMobile"
                  className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-vora-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
