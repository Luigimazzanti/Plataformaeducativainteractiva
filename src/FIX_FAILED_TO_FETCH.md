# 🚨 SOLUCIÓN: "Failed to fetch" Error

## ⚠️ EL PROBLEMA

Estás viendo el error:
```
[EduConnect] Error de red real (TypeError): TypeError: Failed to fetch
```

Este error ocurre porque **el backend NO está desplegado** en Supabase.

---

## ✅ LA SOLUCIÓN (2 OPCIONES)

### OPCIÓN 1: Script Automatizado (RECOMENDADO) 🚀

Ejecuta el script automatizado que despliega y verifica todo:

```bash
chmod +x DEPLOY_NOW.sh
./DEPLOY_NOW.sh
```

El script hace:
- ✅ Verifica Supabase CLI
- ✅ Despliega el backend
- ✅ Espera propagación del CDN
- ✅ Verifica que funcione
- ✅ Te da instrucciones claras

---

### OPCIÓN 2: Comando Manual

Si prefieres hacerlo manualmente:

```bash
npx supabase functions deploy final_server --project-ref ldhimtgexjbmwobkmcwr
```

Luego espera 30-60 segundos y recarga la aplicación.

---

## 🔍 ¿POR QUÉ OCURRE ESTE ERROR?

### Flujo del Error:

1. **Frontend intenta conectar:**
   ```typescript
   const response = await window.fetch(
     'https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/...'
   );
   ```

2. **Backend no existe (404):**
   ```
   Error: Failed to fetch
   ```

3. **Demo mode se activa automáticamente:**
   ```typescript
   if (error.message === 'Failed to fetch') {
     enableDemoMode();
   }
   ```

4. **Funcionalidad limitada:**
   - ❌ Login real no funciona
   - ❌ IA no disponible
   - ❌ Datos no persisten
   - ✅ Solo funciona en modo demo

---

## 🧪 VERIFICACIÓN POST-DESPLIEGUE

### Test 1: Health Check
```bash
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/health
```

**Esperado:**
```json
{"status":"ok","message":"Runtime is stable"}
```

**Si recibes 404:**
- El backend aún no está desplegado
- Ejecuta el comando de despliegue

**Si recibes 500:**
- Revisa los logs en Supabase Dashboard
- Probablemente un error en el código

---

### Test 2: Login Demo
```bash
curl -X POST \
  https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@demo.com","password":"demo123"}'
```

**Esperado:**
```json
{
  "user": {
    "id": "demo-teacher-1",
    "email": "teacher@demo.com",
    "name": "Demo Teacher",
    "role": "teacher"
  },
  "token": "demo_token_demo-teacher-1"
}
```

---

### Test 3: CORS Headers
```bash
curl -I -X OPTIONS \
  https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/health \
  -H "Origin: https://figma.com"
```

**Buscar:**
```
access-control-allow-origin: *
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
```

---

## 📊 ANTES vs DESPUÉS del Despliegue

| Aspecto | ANTES (ahora) | DESPUÉS |
|---------|---------------|---------|
| **Error en Console** | ❌ Failed to fetch | ✅ Sin errores |
| **Modo Demo** | ❌ Activado forzosamente | ✅ Desactivado |
| **Login** | ❌ No funciona | ✅ Funciona |
| **IA** | ❌ No disponible | ✅ Disponible |
| **Badge** | ❌ Rojo/Gris | ✅ Verde |
| **Persistencia** | ❌ Solo en localStorage | ✅ Base de datos |

---

## 🎯 PASOS DETALLADOS

### Paso 1: Login en Supabase (si es necesario)

Si ves error de autenticación al desplegar:

```bash
npx supabase login
```

Esto abre el navegador para que autorices la CLI.

---

### Paso 2: Desplegar Backend

```bash
npx supabase functions deploy final_server --project-ref ldhimtgexjbmwobkmcwr
```

**Salida esperada:**
```
Deploying Function final_server...
Bundling function...
Deploying function to project ldhimtgexjbmwobkmcwr...
Deployed function final_server with version xxx
```

**Tiempo:** 30-60 segundos

---

### Paso 3: Esperar Propagación

Espera 30-60 segundos para que el CDN de Supabase propague los cambios.

Durante este tiempo puedes:
- ☕ Tomar un café
- 📧 Revisar emails
- 🧘 Estirar las piernas

---

### Paso 4: Verificar Health Check

```bash
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/health
```

**Si funciona:**
```json
{"status":"ok","message":"Runtime is stable"}
```

**Si falla (404):**
- Espera 1-2 minutos más
- Reintenta el comando
- Si persiste, revisa los logs en Supabase Dashboard

---

### Paso 5: Recargar la Aplicación

1. **Abre tu aplicación EduConnect**
2. **Presiona `Ctrl + Shift + R`** (recarga forzada)
3. **Verifica que NO haya errores en la consola**

**Antes:**
```javascript
[EduConnect] Error de red real (TypeError): TypeError: Failed to fetch
[EduConnect] Network error detected, enabling demo mode
```

**Después:**
```javascript
[API] ✅ Backend connected: true
[AITaskCreator] ✅ Servidor disponible - IA activa
```

---

### Paso 6: Hacer Login

Usa las credenciales demo:

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| **Admin** | `admin` | `EduConnect@Admin2024` |
| **Teacher** | `teacher@demo.com` | `demo123` |
| **Student** | `student@demo.com` | `demo123` |

---

### Paso 7: Verificar IA

1. Haz login como **teacher@demo.com**
2. Clic en **"Crear Tarea con IA"**
3. Verifica el badge:

**Antes:**
```
❌ "Servidor no disponible o no respondió a tiempo"
```

**Después:**
```
✅ "Servidor conectado - La generación con IA está disponible"
```

---

## 🛠️ TROUBLESHOOTING

### Error: "Supabase CLI not found"

```bash
npm install -g supabase
```

---

### Error: "Not logged in"

```bash
npx supabase login
```

Esto abre el navegador. Inicia sesión con tu cuenta de Supabase.

---

### Error: "Invalid project ref"

Verifica que el Project ID sea correcto:
- ID actual: `ldhimtgexjbmwobkmcwr`
- Verifica en: https://supabase.com/dashboard

---

### Error: "Deployment failed"

Revisa los logs:
```bash
npx supabase functions serve final_server
```

O en Supabase Dashboard:
```
https://supabase.com/dashboard/project/ldhimtgexjbmwobkmcwr/functions/final_server/logs
```

---

### Health Check devuelve 500

El backend está desplegado pero tiene un error. Revisa:

1. **Logs en Supabase Dashboard**
2. **Variables de entorno:**
   - `GEMINI_API_KEY` (para IA)
   - `SB_URL` (auto-configurada)
   - `SB_SERVICE_KEY` (auto-configurada)

---

### Health Check devuelve 404

El backend NO está desplegado. Opciones:

1. **Espera 2-3 minutos más** (propagación del CDN)
2. **Redespliega:**
   ```bash
   npx supabase functions deploy final_server --project-ref ldhimtgexjbmwobkmcwr
   ```
3. **Verifica el nombre de la función:**
   - Debe ser: `final_server` (no `server`)

---

### "Failed to fetch" persiste después del despliegue

1. **Limpia caché del navegador:**
   ```
   Ctrl + Shift + Delete → Limpiar todo
   ```

2. **Recarga forzada:**
   ```
   Ctrl + Shift + R
   ```

3. **Prueba en ventana de incógnito:**
   ```
   Ctrl + Shift + N
   ```

4. **Verifica DevTools Console:**
   ```javascript
   // Debe mostrar la URL correcta:
   https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/...
   ```

5. **Prueba manualmente con curl:**
   ```bash
   curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/health
   ```

---

## 📁 ARCHIVOS IMPORTANTES

### Backend:
```
/supabase/functions/final_server/index.ts    ← Backend principal
/supabase/functions/final_server/kv_store.tsx ← KV Store (protegido)
```

### Frontend:
```
/utils/api.ts           ← API Client (usa window.fetch)
/utils/demo-mode.ts     ← Gestión de modo demo
/App.tsx                ← Aplicación principal
```

### Deployment:
```
/DEPLOY_NOW.sh          ← Script automatizado ⭐
/START_HERE.txt         ← Instrucciones rápidas
```

---

## 🎉 CONFIRMACIÓN DE ÉXITO

Después del despliegue, debes ver:

### En la Terminal:
```bash
$ curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/health

{"status":"ok","message":"Runtime is stable"}
```

### En la Aplicación:
```
✅ Sin errores "Failed to fetch" en consola
✅ Login funciona sin activar modo demo
✅ Badge verde: "Servidor conectado"
✅ IA disponible
```

### En DevTools Console:
```javascript
[API] ✅ Backend connected: true
[AITaskCreator] ✅ Servidor disponible - IA activa
[EduConnect] User logged in successfully
```

---

## 📦 COMANDO RÁPIDO (COPIA Y EJECUTA)

```bash
# Opción 1: Script automatizado
chmod +x DEPLOY_NOW.sh && ./DEPLOY_NOW.sh

# Opción 2: Comando manual
npx supabase functions deploy final_server --project-ref ldhimtgexjbmwobkmcwr
```

---

## 🎯 RESUMEN EJECUTIVO

```
❌ PROBLEMA:  Failed to fetch → Backend no desplegado → Modo demo forzoso
✅ SOLUCIÓN:  Desplegar backend → Esperar 30s → Recargar app
⏱️  TIEMPO:   3-5 minutos total
🛠️ COMANDO:   ./DEPLOY_NOW.sh (automatizado)
```

---

**EJECUTA EL SCRIPT DE DESPLIEGUE AHORA** 🚀

```bash
chmod +x DEPLOY_NOW.sh
./DEPLOY_NOW.sh
```
