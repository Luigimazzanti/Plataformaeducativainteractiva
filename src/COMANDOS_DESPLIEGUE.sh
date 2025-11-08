#!/bin/bash

# 🚀 Script de Despliegue Rápido para EduConnect
# Este script automatiza el despliegue de la función edge a Supabase

echo "🎓 EduConnect - Despliegue Automático"
echo "======================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si Supabase CLI está instalado
echo -e "${BLUE}Verificando Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null
then
    echo -e "${RED}❌ Supabase CLI no está instalado${NC}"
    echo ""
    echo "Instálalo con uno de estos comandos:"
    echo "  macOS/Linux: brew install supabase/tap/supabase"
    echo "  Windows: scoop install supabase"
    echo "  NPM: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI encontrado${NC}"
echo ""

# Login a Supabase
echo -e "${BLUE}Iniciando sesión en Supabase...${NC}"
supabase login

# Vincular proyecto
echo ""
echo -e "${BLUE}Vinculando proyecto...${NC}"
supabase link --project-ref ldhimtgexjbmwobkmcwr

# Crear estructura de carpetas
echo ""
echo -e "${BLUE}Preparando archivos...${NC}"
mkdir -p supabase/functions/make-server

# Información sobre los archivos
echo ""
echo -e "${YELLOW}⚠️  ACCIÓN REQUERIDA:${NC}"
echo "Debes copiar manualmente estos archivos:"
echo ""
echo "1. Copia el contenido de: supabase/functions/server/index.tsx"
echo "   A: supabase/functions/make-server/index.ts"
echo ""
echo "2. Copia el contenido de: supabase/functions/server/kv_store.tsx"
echo "   A: supabase/functions/make-server/kv_store.ts"
echo ""
echo -e "${YELLOW}Nota: Cambia la extensión de .tsx a .ts${NC}"
echo ""
read -p "Presiona Enter cuando hayas copiado los archivos..."

# Desplegar función
echo ""
echo -e "${BLUE}Desplegando función edge...${NC}"
supabase functions deploy make-server

# Verificar despliegue
echo ""
echo -e "${BLUE}Verificando despliegue...${NC}"
supabase functions list

# Probar función
echo ""
echo -e "${BLUE}Probando función...${NC}"
RESPONSE=$(curl -s https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/make-server-05c2b65f/health)
if [ "$RESPONSE" = '{"status":"ok"}' ]; then
    echo -e "${GREEN}✅ Función desplegada correctamente${NC}"
else
    echo -e "${RED}❌ Error al probar la función${NC}"
    echo "Respuesta: $RESPONSE"
fi

# Recordatorio de variables de entorno
echo ""
echo -e "${YELLOW}📝 RECORDATORIO IMPORTANTE:${NC}"
echo "Configura las siguientes variables de entorno en Supabase Dashboard:"
echo "  Settings > Edge Functions > Environment Variables"
echo ""
echo "Variables requeridas:"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - SUPABASE_ANON_KEY"
echo ""

echo ""
echo -e "${GREEN}🎉 ¡Despliegue completado!${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Configura las variables de entorno en Supabase Dashboard"
echo "2. Prueba el login con: teacher@demo.com / demo123"
echo "3. Consulta EMPEZAR_AQUI.md para más información"
echo ""
