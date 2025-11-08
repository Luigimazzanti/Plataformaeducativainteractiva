#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# EDUCONNECT - SCRIPT DE DESPLIEGUE
# ═══════════════════════════════════════════════════════════════════════════
#
# Este script despliega el Edge Function "server" a Supabase con los cambios:
# - Login con admin especial (admin / EduConnect@Admin2024)
# - Login con usuarios demo (teacher@demo.com / demo123, etc.)
# - Inicialización automática de datos demo en KV store
#
# ═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  EDUCONNECT - DESPLIEGUE DE EDGE FUNCTION                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Verificar que Supabase CLI está disponible
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx no está instalado"
    echo "   Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

echo "✅ npx detectado"
echo ""

# Variables
PROJECT_REF="ldhimtgexjbmwobkmcwr"
FUNCTION_NAME="server"

echo "📋 Configuración:"
echo "   Project ID: $PROJECT_REF"
echo "   Function:   $FUNCTION_NAME"
echo ""

# Verificar autenticación
echo "🔐 Verificando autenticación con Supabase..."
npx supabase projects list &> /dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  No estás autenticado con Supabase"
    echo "   Ejecutando: npx supabase login"
    echo ""
    npx supabase login
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: No se pudo autenticar"
        exit 1
    fi
fi

echo "✅ Autenticación verificada"
echo ""

# Desplegar función
echo "🚀 Desplegando Edge Function '$FUNCTION_NAME'..."
echo ""

npx supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  ✅ DESPLIEGUE EXITOSO                                    ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 Detalles del despliegue:"
    echo "   Function: $FUNCTION_NAME"
    echo "   URL: https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME"
    echo ""
    echo "🧪 Prueba el health check:"
    echo "   curl https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/make-server-05c2b65f/health"
    echo ""
    echo "🔑 Credenciales de prueba:"
    echo "   Admin:    admin / EduConnect@Admin2024"
    echo "   Teacher:  teacher@demo.com / demo123"
    echo "   Student:  student@demo.com / demo123"
    echo ""
    echo "📚 Documentación:"
    echo "   - FIX_LOGIN_401.md - Detalles del fix de login"
    echo "   - DESPLIEGUE_BACKEND.md - Guía completa de despliegue"
    echo ""
    
    # Hacer health check automático
    echo "🏥 Ejecutando health check automático..."
    HEALTH_RESPONSE=$(curl -s "https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/make-server-05c2b65f/health")
    
    if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
        echo "✅ Health check exitoso: $HEALTH_RESPONSE"
        echo "✅ Datos demo inicializados automáticamente"
    else
        echo "⚠️  Health check respuesta inesperada: $HEALTH_RESPONSE"
    fi
    
    echo ""
    echo "🎉 ¡Listo! La aplicación debería funcionar ahora."
    
else
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  ❌ ERROR EN DESPLIEGUE                                   ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "🔍 Posibles causas:"
    echo "   1. No tienes permisos para el proyecto $PROJECT_REF"
    echo "   2. El project-ref es incorrecto"
    echo "   3. Error en el código del Edge Function"
    echo ""
    echo "📚 Consulta la documentación en:"
    echo "   - DESPLIEGUE_BACKEND.md"
    echo "   - FIX_LOGIN_401.md"
    echo ""
    exit 1
fi
