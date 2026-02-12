"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">🎉 Payment Successful!</h1>
        <p className="text-gray-400 mb-8">
          Thank you for upgrading to{" "}
          <span className="font-semibold text-blue-400">AlgoMade Pro</span>!
          <br />
          Your account has been upgraded automatically. You can now access all
          premium features.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
          >
            Go to Dashboard 🚀
          </Link>

          <Link
            href="/pricing"
            className="block text-gray-400 hover:text-gray-200 text-sm underline"
          >
            View other plans
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
