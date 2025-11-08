@echo off
cls

echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                                                                           ║
echo ║              EDUCONNECT V10.3 - WINDOWS DEPLOYMENT                       ║
echo ║                                                                           ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

set PROJECT_ID=ldhimtgexjbmwobkmcwr
set FUNCTION_NAME=final_server
set HEALTH_URL=https://%PROJECT_ID%.supabase.co/functions/v1/%FUNCTION_NAME%/make-server-05c2b65f/health

echo 📋 DEPLOYMENT INFORMATION
echo ────────────────────────────────────────────────────────────────────────────
echo   Project ID:      %PROJECT_ID%
echo   Function:        %FUNCTION_NAME%
echo   Health Check:    %HEALTH_URL%
echo ────────────────────────────────────────────────────────────────────────────
echo.

echo 🚀 Step 1/3: Deploying backend to Supabase...
echo ────────────────────────────────────────────────────────────────────────────
call npx supabase functions deploy %FUNCTION_NAME% --project-ref %PROJECT_ID% --no-verify-jwt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Deployment failed!
    echo.
    echo Common issues:
    echo   • Not logged in: Run 'npx supabase login'
    echo   • Wrong project ID: Check your Supabase dashboard
    echo   • Network issues: Check your internet connection
    echo.
    pause
    exit /b 1
)

echo ────────────────────────────────────────────────────────────────────────────
echo.
echo ✅ Deployment completed!
echo.

echo ⏳ Step 2/3: Waiting for CDN propagation (30 seconds)...
timeout /t 30 /nobreak >nul
echo ✅ Wait complete
echo.

echo 🧪 Step 3/3: Verifying deployment...
echo ────────────────────────────────────────────────────────────────────────────
curl -s %HEALTH_URL%
echo.
echo ────────────────────────────────────────────────────────────────────────────
echo.

echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                                                                           ║
echo ║                   ✅  DEPLOYMENT COMPLETE! 🎉                            ║
echo ║                                                                           ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.
echo 🎯 NEXT STEPS:
echo.
echo   1. Reload your application (Ctrl + Shift + R)
echo   2. The "Failed to fetch" error should be gone
echo   3. Login with demo credentials:
echo.
echo      Admin:   admin / EduConnect@Admin2024
echo      Teacher: teacher@demo.com / demo123
echo      Student: student@demo.com / demo123
echo.
echo   4. Verify the AI badge is green: "Servidor conectado ✓"
echo.
echo ────────────────────────────────────────────────────────────────────────────
echo.
echo 🚀 Your EduConnect platform is now live!
echo.
pause
