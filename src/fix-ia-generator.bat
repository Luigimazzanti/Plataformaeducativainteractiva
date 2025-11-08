@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Script de solución automática - Error generador IA (Windows)
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ============================================================
echo  EduConnect - Fix Generador IA de Gemini
echo ============================================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "supabase\functions\server" (
  echo [ERROR] No se encontró el directorio supabase\functions\server
  echo         Asegúrate de ejecutar este script desde la raíz del proyecto
  pause
  exit /b 1
)

REM Verificar que existe el archivo .tsx
if not exist "supabase\functions\server\index.tsx" (
  echo [AVISO] El archivo index.tsx no existe
  
  REM Verificar si ya está como .ts
  if exist "supabase\functions\server\index.ts" (
    echo [OK] El archivo index.ts ya existe - la corrección ya está aplicada
    pause
    exit /b 0
  ) else (
    echo [ERROR] No se encontró ni index.tsx ni index.ts
    pause
    exit /b 1
  )
)

echo [1/3] Renombrando index.tsx --^> index.ts...
cd supabase\functions\server
ren index.tsx index.ts
if errorlevel 1 (
  echo [ERROR] No se pudo renombrar el archivo
  cd ..\..\..
  pause
  exit /b 1
)
echo [OK] Archivo renombrado correctamente
echo.

echo [2/3] Verificando el archivo...
if exist "index.ts" (
  echo [OK] index.ts existe y está listo
) else (
  echo [ERROR] Error al crear index.ts
  cd ..\..\..
  pause
  exit /b 1
)
cd ..\..\..
echo.

echo [3/3] Verificando estructura...
dir supabase\functions\server
echo.

echo ============================================================
echo  Corrección aplicada exitosamente!
echo ============================================================
echo.
echo SIGUIENTE PASO: Redesplegar la Edge Function
echo.
echo Opción 1: Supabase CLI
echo   supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
echo.
echo Opción 2: Supabase Dashboard
echo   1. Ve a: Edge Functions -^> server
echo   2. Click en 'Deploy' o 'Redeploy'
echo   3. Espera confirmación de despliegue exitoso
echo.
echo Verificación:
echo   curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
echo   Debe devolver: {"status":"ok"}
echo.
echo ============================================================
echo.
pause
