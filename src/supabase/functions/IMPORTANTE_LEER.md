# ⚠️ IMPORTANTE: Edge Functions de Supabase

## 🚨 REGLA CRÍTICA

**Supabase Edge Functions SOLO acepta archivos `.ts` (TypeScript)**

❌ **NO usar:** `.tsx` (no funciona)  
✅ **SÍ usar:** `.ts` (funciona)

---

## 📂 Estructura Actual

```
supabase/functions/
└── server/
    ├── index.tsx    ← ⚠️ EXTENSIÓN INCORRECTA (protegido por Figma)
    └── kv_store.tsx ← ⚠️ EXTENSIÓN INCORRECTA (protegido por Figma)
```

**PROBLEMA:** Los archivos tienen extensión `.tsx` pero Supabase requiere `.ts`

---

## ✅ Solución para Desplegar

Cuando vayas a desplegar en Supabase Dashboard:

### Opción 1: Copiar y Pegar (RECOMENDADO)

1. **Abre** `/supabase/functions/server/index.tsx` en tu editor
2. **Copia TODO** el contenido (Ctrl+A, Ctrl+C)
3. **Ve a** Supabase Dashboard → Edge Functions
4. **Click** "Create a new function"
5. **Nombre:** `server` (exactamente así)
6. **Pega** el código
7. **Click** "Deploy"

### Opción 2: CLI de Supabase (Avanzado)

Si usas Supabase CLI, crea manualmente:

```bash
# Crear carpeta
mkdir -p supabase/functions/server_deploy

# Copiar contenido pero renombrar
cp supabase/functions/server/index.tsx supabase/functions/server_deploy/index.ts

# Desplegar
supabase functions deploy server_deploy
```

---

## 📝 Contenido a Desplegar

### Archivo: `index.ts`

Copia el contenido de `/supabase/functions/server/index.tsx`

**Endpoints incluidos:**
- `GET /health` - Health check
- `POST /login` - Autenticación
- `POST /signup` - Registro
- `GET /user` - Obtener usuario actual
- `POST /generate-questions` - Generador de IA (NUEVO)
- `POST /assignments` - Crear tarea
- `GET /assignments` - Listar tareas

---

## 🔧 Configuración Necesaria

Antes de desplegar, asegúrate de tener en **Supabase Secrets:**

```bash
GEMINI_API_KEY=tu_api_key_aqui
```

**Cómo agregar:**
1. Supabase Dashboard → Settings → Edge Functions
2. Scroll a "Secrets"
3. Click "Add new secret"
4. Name: `GEMINI_API_KEY`
5. Value: (tu API key de Gemini)
6. Save

---

## 🎯 Resumen

**NO puedes usar los archivos `.tsx` directamente**

**Debes:**
1. Copiar el código de `index.tsx`
2. Crear función en Supabase Dashboard
3. Pegar código
4. Desplegar

**El archivo `kv_store.tsx`** está protegido y es usado internamente por Figma. No necesitas desplegarlo por separado.

---

## ✅ Verificar que Funciona

Después de desplegar, prueba:

```
https://TU_PROJECT_ID.supabase.co/functions/v1/server/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "educonnect-backend"
}
```

---

**📌 NOTA FINAL:**

Los archivos `.tsx` en este proyecto son para referencia y desarrollo en Figma Make. Para Supabase, SIEMPRE usa `.ts` cuando despliegues manualmente.
