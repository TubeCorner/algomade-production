"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LockedFeatureProps {
  isLocked: boolean;
  children: ReactNode;
  message?: string;
  blurIntensity?: string;
}

export default function LockedFeature({
  isLocked,
  children,
  message = "Upgrade to AlgoMade Pro to unlock full insights",
  blurIntensity = "blur-sm",
}: LockedFeatureProps) {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative group overflow-hidden">
      {/* 🔒 Blurred Content */}
      <div className={cn("pointer-events-none opacity-60 select-none", blurIntensity)}>
        {children}
      </div>

      {/* 🔒 Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-black/50
                   rounded-md backdrop-blur-sm transition"
      >
        <div className="text-center space-y-2 px-3">
          <p className="text-xs text-gray-300 font-medium">{message}</p>
          <a
            href="/pricing"
            className="inline-block mt-1 text-xs px-3 py-1 rounded 
                       bg-amber-500/20 hover:bg-amber-500/30 
                       border border-amber-400/40 text-amber-200 transition"
          >
            🚀 Upgrade Now
          </a>
        </div>
      </motion.div>
    </div>
  );
}
