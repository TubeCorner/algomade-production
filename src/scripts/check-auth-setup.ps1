Write-Host "🚀 Starting authentication & project route structure check..." -ForegroundColor Cyan

# ===============================
# 1️⃣ Check authOptions Export
# ===============================
$authFile = "src/app/api/auth/[...nextauth]/route.ts"
if (Test-Path $authFile) {
    $hasAuthOptions = Select-String -Path $authFile -Pattern "export const authOptions" -SimpleMatch
    if ($hasAuthOptions) {
        Write-Host "✅ authOptions export FOUND in $authFile" -ForegroundColor Green
    } else {
        Write-Host "❌ authOptions export NOT found in $authFile" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Auth route file not found: $authFile" -ForegroundColor Red
}

# ===============================
# 2️⃣ Check Projects Route Import
# ===============================
$projectsFile = "src/app/api/projects/route.ts"
if (Test-Path $projectsFile) {
    $hasImport = Select-String -Path $projectsFile -Pattern "import { authOptions } from" -SimpleMatch
    if ($hasImport) {
        Write-Host "✅ authOptions import FOUND in $projectsFile" -ForegroundColor Green
    } else {
        Write-Host "❌ authOptions import NOT found in $projectsFile" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Projects route file not found: $projectsFile" -ForegroundColor Red
}

# ===============================
# 3️⃣ Check .env Variables
# ===============================
$envFile = ".env"
$requiredVars = @(
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
)

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=") {
            Write-Host "✅ $var found in .env" -ForegroundColor Green
        } else {
            Write-Host "❌ $var missing in .env" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ .env file not found in project root" -ForegroundColor Red
}

# ===============================
# 4️⃣ Check SessionProviderWrapper
# ===============================
$sessionFile = "src/components/shared/SessionProviderWrapper.tsx"
if (Test-Path $sessionFile) {
    $hasSessionProvider = Select-String -Path $sessionFile -Pattern "SessionProvider" -SimpleMatch
    if ($hasSessionProvider) {
        Write-Host "✅ SessionProviderWrapper uses SessionProvider" -ForegroundColor Green
    } else {
        Write-Host "❌ SessionProvider not found in SessionProviderWrapper.tsx" -ForegroundColor Red
    }
} else {
    Write-Host "❌ SessionProviderWrapper.tsx file not found" -ForegroundColor Red
}

# ===============================
# 5️⃣ Check Layout Wrap
# ===============================
$layoutFile = "src/app/layout.tsx"
if (Test-Path $layoutFile) {
    $hasWrapper = Select-String -Path $layoutFile -Pattern "SessionProviderWrapper" -SimpleMatch
    if ($hasWrapper) {
        Write-Host "✅ Layout wraps with SessionProviderWrapper" -ForegroundColor Green
    } else {
        Write-Host "❌ SessionProviderWrapper not found in layout.tsx" -ForegroundColor Red
    }
} else {
    Write-Host "❌ layout.tsx file not found" -ForegroundColor Red
}

Write-Host "`n🎯 Check completed. Review any ❌ items above to fix issues." -ForegroundColor Yellow
