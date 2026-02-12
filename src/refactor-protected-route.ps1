# 🪄 Define project structure
$projectRoot = "C:\Users\projects\TubeCorner-SaaS\tube-corner-frontend\src"
$dashboardPath = "$projectRoot\app\(dashboard)"
$componentsPath = "$projectRoot\components"
$sharedPath = "$componentsPath\shared"
$dashboardComponents = "$componentsPath\dashboard"

# 🧭 Create necessary folders if not exist
if (!(Test-Path $dashboardComponents)) { New-Item -ItemType Directory -Path $dashboardComponents | Out-Null }
if (!(Test-Path $sharedPath)) { New-Item -ItemType Directory -Path $sharedPath | Out-Null }

# 🧰 Backup existing dashboard page
if (Test-Path "$dashboardPath\page.tsx") {
    Copy-Item "$dashboardPath\page.tsx" "$dashboardPath\page.backup.$(Get-Date -Format 'yyyyMMddHHmmss').tsx"
}

# 🧱 Create ProtectedRoute.tsx
@"
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/SupabaseProvider";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        router.replace("/");
      }
      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        router.replace("/");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-500">
        Checking authentication...
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
"@ | Set-Content "$sharedPath\ProtectedRoute.tsx"

# 🧭 Create DashboardPageContent.tsx (empty placeholder for now)
@"
"use client";

export default function DashboardPageContent() {
  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold'>🚀 Dashboard Loaded Successfully</h1>
      <p className='text-gray-600 mt-2'>You can move your dashboard code here.</p>
    </div>
  );
}
"@ | Set-Content "$dashboardComponents\DashboardPageContent.tsx"

# 🧭 Update page.tsx to use ProtectedRoute
@"
"use client";

import ProtectedRoute from "@/components/shared/ProtectedRoute";
import DashboardPageContent from "@/components/dashboard/DashboardPageContent";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
}
"@ | Set-Content "$dashboardPath\page.tsx"

Write-Host "`n✅ ProtectedRoute, DashboardPageContent, and updated page.tsx have been created successfully!"
Write-Host "📂 Backup of old page.tsx saved. You can move your existing dashboard code into DashboardPageContent.tsx."
Write-Host "🚀 Run 'npm run dev' to test the updated flow."
