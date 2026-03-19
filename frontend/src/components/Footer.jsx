"use client";

import { Newspaper } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-black text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-[1280px] mx-auto px-6 md:px-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-white">
            <div className="size-8 bg-[#1a355b] rounded-lg flex items-center justify-center text-white">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">PressLog</h2>
          </div>
          
          <nav className="flex gap-6 text-sm font-medium">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            <Link href="/sign-up" className="hover:text-white transition-colors">Get Started</Link>
          </nav>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col items-center justify-center">
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500 text-center">
            © {new Date().getFullYear()} PressLog Systems Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
