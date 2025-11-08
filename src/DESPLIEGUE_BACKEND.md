# 🚀 GUÍA DE DESPLIEGUE DEL BACKEND

## ⚡ Despliegue Rápido (1 Comando)

```bash
npx supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
```

---

## 📋 Requisitos Previos

### 1. Supabase CLI Instalado
```bash
# Si no lo tienes instalado:
npm install -g supabase

# O con npx (no requiere instalación):
npx supabase --version
```

### 2. Autenticación con Supabase
```bash
# Login (abrirá navegador):
npx supabase login

# O con access token:
npx supabase login --token YOUR_ACCESS_TOKEN
```

**Obtener tu Access Token:**
1. Ir a: https://app.supabase.com/account/tokens
2. Crear un nuevo token
3. Copiarlo y usarlo en el comando de login

---

## 🔧 Pasos Detallados de Despliegue

### Paso 1: Verificar Estructura de Archivos
```
/supabase/
  /functions/
    /server/          ← La función a desplegar
      index.tsx       ← Código principal
      kv_store.tsx    ← Utilidades de KV
```

✅ **Verificado:** La estructura existe.

### Paso 2: Desplegar la Función
```bash
cd /ruta/a/tu/proyecto

npx supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
```

**Salida esperada:**
```
Deploying Function...
Deployed Function server (version: xxx)
URL: https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server
```

### Paso 3: Verificar Despliegue
```bash
# Health check:
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
```

**Respuesta esperada:**
```json
{"status":"ok"}
```

---

## 🧪 Pruebas Post-Despliegue

### Test 1: Health Check
```bash
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
```

**✅ Esperado:** `{"status":"ok"}`

### Test 2: Login con Credenciales Demo
```bash
curl -X POST \
  https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@demo.com","password":"demo123"}'
```

**Opciones de respuesta:**

**✅ Si el usuario existe:**
```json
{
  "user": { "id": "...", "email": "teacher@demo.com", "name": "Demo Teacher", "role": "teacher" },
  "token": "eyJhbGc..."
}
```

**⚠️ Si el usuario NO existe (esperado si no se ha creado):**
```json
{
  "error": "Invalid login credentials"
}
```

### Test 3: Crear Usuario Demo (Si es necesario)
```bash
curl -X POST \
  https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@demo.com",
    "password": "demo123",
    "name": "Demo Teacher",
    "role": "teacher"
  }'
```

---

## 🔍 Verificar en Supabase Dashboard

### 1. Ir a Edge Functions
```
https://app.supabase.com/project/ldhimtgexjbmwobkmcwr/functions
```

### 2. Verificar que "server" aparece en la lista
- Debe mostrar estado: **Deployed**
- Version: La más reciente
- Last deployed: Fecha y hora actual

### 3. Ver Logs
- Click en la función "server"
- Ir a "Logs" tab
- Deberías ver requests entrantes

---

## 🛠️ Solución de Problemas

### Problema 1: "Login required"
```bash
# Solución:
npx supabase login
```

### Problema 2: "Project not found"
```bash
# Verificar project ID:
npx supabase projects list

# Si es correcto, usar:
npx supabase link --project-ref ldhimtgexjbmwobkmcwr
```

### Problema 3: "Deployment failed"
```bash
# Ver logs detallados:
npx supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr --debug

# O revisar sintaxis del código:
deno check /supabase/functions/server/index.tsx
```

### Problema 4: "CORS errors" después del despliegue
**Solución:** El código ya tiene CORS configurado correctamente:
```typescript
app.use("/*", cors({ 
  origin: "*", 
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
```

Si sigue fallando, verificar en Supabase Dashboard > Settings > API > CORS

---

## 📊 Checklist de Despliegue

- [ ] Supabase CLI instalado (`npx supabase --version`)
- [ ] Autenticado con Supabase (`npx supabase login`)
- [ ] Función desplegada (`npx supabase functions deploy server`)
- [ ] Health check funciona (curl al endpoint /health)
- [ ] Función visible en Dashboard de Supabase
- [ ] Logs muestran requests entrantes
- [ ] Login funciona desde el frontend

---

## 🎯 Resultado Esperado

### Después del Despliegue Exitoso:

1. **Frontend puede conectarse al backend**
   ```
   ✅ Health check: 200 OK
   ✅ Login endpoint: 200 OK (o 401 si credenciales inválidas)
   ✅ Signup endpoint: 200 OK
   ```

2. **Logs en consola del navegador:**
   ```
   [EduConnect] Build Version: 9.2.0-NUCLEAR-URL-FIXED-20241107
   [EduConnect] 🔧 Backend URL Fixed: true (/server/ not /gemini-handler/)
   [EduConnect] Verificando disponibilidad del servidor...
   [EduConnect] Servidor disponible, autenticación remota habilitada ✅
   ```

3. **Login funciona:**
   - Admin: `admin` / `EduConnect@Admin2024`
   - Si hay usuarios reales creados, sus credenciales
   - Si backend no disponible → Modo demo automático

---

## 🔄 Re-despliegue (Actualizar Cambios)

Si haces cambios en el código del backend:

```bash
# Re-desplegar:
npx supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr

# No es necesario hacer nada más, Supabase actualiza automáticamente
```

---

## 📚 Recursos

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Deno Deploy Docs](https://deno.com/deploy/docs)

---

## ⚠️ Importante

### Variables de Entorno
El Edge Function tiene acceso automático a:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**NO es necesario configurarlas manualmente.**

### Secretos Adicionales
Si el Edge Function necesita secretos adicionales (ej: `GEMINI_API_KEY`):

```bash
npx supabase secrets set GEMINI_API_KEY=tu_api_key_aqui --project-ref ldhimtgexjbmwobkmcwr
```

**Ya configurado:**
- `GEMINI_API_KEY` (para el generador de tareas con IA)

---

**Fecha:** 2024-11-07  
**Comando Principal:** `npx supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr`  
**Tiempo Estimado:** 1-2 minutos  
**Dificultad:** Fácil ⭐
