"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/10 backdrop-blur-md border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-white">
            Upgrade to <span className="text-indigo-400">TubeCorner Pro</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4 text-sm text-gray-200">
          <p className="text-center">
            Unlock unlimited keyword searches, detailed trend analytics, and AI title & description generation.
          </p>

          <ul className="space-y-2">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Unlimited trend checks</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> AI title & description generator</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Early access to AI thumbnail maker</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Priority support</li>
          </ul>
        </div>

        <div className="flex flex-col items-center mt-6 space-y-3">
          <Button
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2"
            onClick={() => {
              // ⚡ Stripe integration placeholder (redirect in future)
              alert("Redirecting to Stripe checkout... (coming soon)");
            }}
          >
            Upgrade Now – $9.99/mo
          </Button>

          <button
            onClick={onClose}
            className="text-gray-400 text-sm underline hover:text-gray-300"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
