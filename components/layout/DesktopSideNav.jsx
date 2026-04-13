"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, User, BookOpen, LogOut, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Modules", icon: Gamepad2, href: "#" },
  { label: "Arsenal", icon: BookOpen, href: "#" },
  { label: "Profile", icon: User, href: "#" },
  { label: "Settings", icon: Settings, href: "#" },
];

export default function DesktopSideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vora_guest');
      localStorage.removeItem('vora_guest_profile');
      document.cookie = "vora_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-[260px] fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-vora-bg app-shadow">
      <div className="p-8 pb-10">
        <h1 className="text-3xl font-black tracking-tighter text-vora-primary">VORA</h1>
        <p className="text-[10px] uppercase tracking-widest text-vora-text/40 font-bold mt-1">Laboratory</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 font-bold interactive-tap relative group",
                isActive 
                  ? "bg-vora-primary/10 text-vora-primary" 
                  : "text-vora-text/50 hover:bg-vora-bg hover:text-vora-text"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavDesktop"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-lg bg-vora-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 3 : 2} className={isActive ? "text-vora-primary" : "text-vora-text/40 group-hover:text-vora-text/70 transition-colors"} />
              <span className="text-sm tracking-widest uppercase">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 pb-8 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-red-500/70 hover:bg-red-50 hover:text-red-500 font-bold transition-all interactive-tap group"
        >
          <LogOut size={20} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm tracking-widest uppercase">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
