// src/components/dashboard/UpgradeBanner.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/dashboard/UpgradeModal";

export default function UpgradeBanner() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white p-3 rounded-2xl mb-4 flex justify-between items-center shadow-md">
        <span>🚀 You’ve hit your free limit. Unlock full power with Pro!</span>
        <Button
          onClick={() => setOpen(true)}
          className="bg-white text-indigo-700 font-semibold hover:bg-gray-100"
        >
          Upgrade to Pro
        </Button>
      </div>

      {/* 🪄 Modal appears when clicked */}
      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
