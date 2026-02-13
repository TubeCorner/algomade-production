import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import SessionProviderWrapper from "@/components/shared/SessionProviderWrapper";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import SessionLoader from "@/components/shared/SessionLoader";
import Navbar from "@/components/shared/Navbar";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";

// Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata = {
  title: "AlgoMade",
  description: "AI tools for creators — keywords, thumbnails, and trend insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${grotesk.variable} font-inter bg-[#0B0F19] text-white min-h-screen`}
      >
        {/* Background layer */}
        <div className="fixed inset-0 -z-10 bg-[#0B0F19]">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] bg-[length:100px_100px] bg-repeat" />

          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px]" />
        </div>

        <SessionProviderWrapper>
          <SupabaseProvider>
            <SessionLoader>
              <Navbar />

              <main className="min-h-screen pt-16 relative z-10">
                {children}
              </main>

              <Toaster
                position="top-center"
                richColors
                closeButton
                expand
                duration={4000}
              />
              {/* ✅ ADD THIS LINE */}
      <Analytics />
            </SessionLoader>
          </SupabaseProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
