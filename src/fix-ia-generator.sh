#!/bin/bash

#═══════════════════════════════════════════════════════════════════════════
# Script de solución automática - Error generador IA
#═══════════════════════════════════════════════════════════════════════════

echo "🔧 EduConnect - Fix Generador IA de Gemini"
echo "════════════════════════════════════════════"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "supabase/functions/server" ]; then
  echo "❌ Error: No se encontró el directorio supabase/functions/server"
  echo "   Asegúrate de ejecutar este script desde la raíz del proyecto"
  exit 1
fi

# Verificar que existe el archivo .tsx
if [ ! -f "supabase/functions/server/index.tsx" ]; then
  echo "⚠️  El archivo index.tsx no existe"
  
  # Verificar si ya está como .ts
  if [ -f "supabase/functions/server/index.ts" ]; then
    echo "✅ El archivo index.ts ya existe - la corrección ya está aplicada"
    exit 0
  else
    echo "❌ No se encontró ni index.tsx ni index.ts"
    exit 1
  fi
fi

echo "📋 Paso 1: Renombrando index.tsx → index.ts..."
cd supabase/functions/server/
mv index.tsx index.ts
echo "✅ Archivo renombrado correctamente"
echo ""

echo "📋 Paso 2: Verificando el archivo..."
if [ -f "index.ts" ]; then
  echo "✅ index.ts existe y está listo"
else
  echo "❌ Error al crear index.ts"
  exit 1
fi
cd ../../..
echo ""

echo "📋 Paso 3: Verificando estructura..."
ls -la supabase/functions/server/
echo ""

echo "════════════════════════════════════════════"
echo "✅ ¡Corrección aplicada exitosamente!"
echo "════════════════════════════════════════════"
echo ""
echo "📤 SIGUIENTE PASO: Redesplegar la Edge Function"
echo ""
echo "Opción 1: Supabase CLI"
echo "  supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr"
echo ""
echo "Opción 2: Supabase Dashboard"
echo "  1. Ve a: Edge Functions → server"
echo "  2. Click en 'Deploy' o 'Redeploy'"
echo "  3. Espera confirmación de despliegue exitoso"
echo ""
echo "🧪 Verificación:"
echo "  curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health"
echo "  Debe devolver: {\"status\":\"ok\"}"
echo ""
echo "════════════════════════════════════════════"
