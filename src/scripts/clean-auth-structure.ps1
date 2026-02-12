# ================================
# TubeCorner — Clean Auth Structure Script
# ================================
Write-Host "🚀 Starting TubeCorner Auth Cleanup..."

# 1️⃣ Update Root Layout (SessionProvider only)
$layoutPath = "src/app/layout.tsx"
if (Test-Path $layoutPath) {
    $layoutContent = @'
import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/shared/Navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TubeCorner",
  description: "YouTube keyword optimization SaaS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <Navbar />
          {children}
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#fff",
                fontSize: "0.875rem",
                padding: "12px 16px",
                borderRadius: "8px",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
'@
    $layoutContent | Set-Content $layoutPath -Encoding UTF8
    Write-Host "✅ layout.tsx updated with clean SessionProvider."
} else {
    Write-Host "⚠️ layout.tsx not found. Skipping..."
}

# 2️⃣ Create or overwrite dashboard/layout.tsx with ProtectedRoute
$dashboardLayoutPath = "src/app/dashboard/layout.tsx"
$protectedRouteLayout = @'
import ProtectedRoute from "@/components/shared/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
'@
$protectedRouteLayout | Set-Content $dashboardLayoutPath -Encoding UTF8
Write-Host "✅ dashboard/layout.tsx added with ProtectedRoute."

# 3️⃣ Clean Navbar.tsx
$navbarPath = "src/components/shared/Navbar.tsx"
if (Test-Path $navbarPath) {
    $navbarContent = @'
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow-sm">
      <Link href="/" className="text-xl font-bold text-indigo-600">
        TubeCorner
      </Link>

      {status === "authenticated" && session?.user ? (
        <div className="flex items-center gap-4">
          <span className="text-gray-700">
            {session.user.name || session.user.email}
          </span>
          <button
            onClick={() => signOut()}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn("google")}
          className="px-4 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Sign In
        </button>
      )}
    </nav>
  );
}
'@
    $navbarContent | Set-Content $navbarPath -Encoding UTF8
    Write-Host "✅ Navbar.tsx cleaned to use NextAuth only."
} else {
    Write-Host "⚠️ Navbar.tsx not found. Skipping..."
}

# 4️⃣ Remove stale Supabase Auth imports in ProtectedRoute.tsx and rewrite clean
$protectedRoutePath = "src/components/shared/ProtectedRoute.tsx"
if (Test-Path $protectedRoutePath) {
    $protectedRouteContent = @'
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Checking authentication...
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
'@
    $protectedRouteContent | Set-Content $protectedRoutePath -Encoding UTF8
    Write-Host "✅ ProtectedRoute.tsx simplified to NextAuth only."
} else {
    Write-Host "⚠️ ProtectedRoute.tsx not found. Skipping..."
}

Write-Host "🎉 Auth cleanup completed successfully!"
Write-Host "👉 Next steps:"
Write-Host "   1. Run 'npm run dev' again."
Write-Host "   2. Clear cookies and localStorage."
Write-Host "   3. Try logging in and out once."
Write-Host "   4. Flicker should be gone and routes stable."
