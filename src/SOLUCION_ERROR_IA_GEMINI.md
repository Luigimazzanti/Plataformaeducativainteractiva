# 🚨 SOLUCIÓN URGENTE - ERROR 401/504 en Generador de Preguntas IA

## Problema Identificado

El generador de preguntas con IA de Gemini está fallando con:
- **Error 401**: "Missing authorization header"  
- **Error 504**: Timeout en peticiones OPTIONS (CORS preflight)

## Causa Raíz

**Supabase Edge Functions requieren archivos `.ts` NO `.tsx`**

Actualmente el servidor principal está en:
- ❌ `/supabase/functions/server/index.tsx` (extensión incorrecta)
- ✅ Debe ser: `/supabase/functions/server/index.ts`

El archivo `.tsx` NO se despliega correctamente en Supabase, causando que las peticiones fallen con timeout 504.

## Solución Inmediata

### Paso 1: Renombrar el archivo del servidor

Debes renombrar manualmente el archivo en el Dashboard de Supabase:

1. Ve a **Supabase Dashboard** → **Edge Functions** → **server**
2. Abre el editor de la función
3. **Renombra** el archivo principal de `index.tsx` a `index.ts`
4. Guarda y redespliega la función

### Paso 2: Verificar que no hay archivos `.tsx` en `/supabase/functions/server/`

Archivos que deben existir:
```
/supabase/functions/server/
├── index.ts        ← (anteriormente index.tsx)
├── kv_store.ts     ← OK
└── kv_store.tsx    ← (puede ser ignorado, el .ts es el que se usa)
```

### Paso 3: Redesplegar usando Supabase CLI

```bash
# Desde la raíz del proyecto
supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
```

O desde el Dashboard de Supabase:
1. Ve a **Edge Functions** → **server**
2. Click en **Deploy**
3. Espera confirmación del despliegue exitoso

## Verificación

Después del despliegue correcto, prueba:

```bash
# Health check
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health

# Debe devolver: {"status":"ok"}
```

Luego prueba el generador de preguntas desde la aplicación:
1. Login como profesor (teacher@demo.com / demo123)
2. Crear Tarea → Generador de Preguntas con IA
3. Pegar un texto de prueba
4. Click en "Generar Preguntas"

## Por qué esto soluciona el problema

- **Edge Functions de Deno/Supabase esperan `.ts`**: El runtime de Deno espera archivos TypeScript puros (`.ts`), no archivos de React TypeScript (`.tsx`)
- **CORS Preflight Timeout**: Las peticiones OPTIONS hacían timeout porque el servidor no se desplegaba correctamente
- **Error 401**: El servidor mal desplegado no procesaba los headers de autorización

## Variables de Entorno Requeridas

Verifica que estas variables estén configuradas en Supabase:
- ✅ `GEMINI_API_KEY` - Ya proporcionada
- ✅ `SB_URL` - Ya proporcionada
- ✅ `SB_SERVICE_KEY` - Ya proporcionada

## Notas Técnicas

El endpoint de IA está implementado en el servidor en las líneas **1373-1529** del archivo `index.tsx`:
- Recibe texto, maxQuestions, includeCompletarBlancos
- Llama a Gemini API con un prompt estructurado
- Devuelve preguntas con IDs únicos y metadatos

La autenticación funciona con:
- Tokens de Supabase Auth (usuarios reales)
- Tokens demo (`demo_token_*`)
- Token de admin (`admin_token_*`)

## Si el problema persiste

1. **Verifica los logs en Supabase Dashboard**:
   - Edge Functions → server → Logs
   - Busca errores de despliegue

2. **Verifica la clave de Gemini**:
   ```bash
   # En el Dashboard de Supabase
   Settings → Edge Functions → Secrets
   # Confirma que GEMINI_API_KEY existe
   ```

3. **Prueba el endpoint directamente**:
   ```bash
   curl -X POST \
     https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/ai/generate-questions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer demo_token_demo-teacher-1" \
     -d '{"text":"La fotosíntesis es el proceso mediante el cual las plantas convierten la luz solar en energía química.","maxQuestions":5}'
   ```

---

**CRÍTICO**: El archivo DEBE llamarse `index.ts` NO `index.tsx` para que Supabase Edge Functions funcione correctamente.
