"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";

export default function CancelledPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">❌ Payment Cancelled</h1>
        <p className="text-gray-400 mb-8">
          Looks like you didn’t complete your checkout.
          <br />
          No worries — you can upgrade anytime to unlock{" "}
          <span className="font-semibold text-blue-400">AlgoMade Pro</span>.
        </p>

        <div className="space-y-4">
          <Link
            href="/pricing"
            className="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
          >
            Back to Pricing 💳
          </Link>

          <Link
            href="/dashboard"
            className="block text-gray-400 hover:text-gray-200 text-sm underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
