# 🔧 Solución de Problemas - Despliegue Edge Function

## 🎯 Guía de Diagnóstico Rápido

### ❌ Error: "Module not found: kv_store.tsx"

**Causa:** El archivo `kv_store.tsx` no está presente en la función.

**Solución 1 (Recomendada):**
```
1. En el panel lateral del editor, busca [+ New file]
2. Crea un archivo llamado: kv_store.tsx
3. Abre /supabase/functions/server/kv_store.tsx en tu proyecto
4. Copia TODO su contenido
5. Pega en el nuevo archivo de Supabase
6. Guarda (Ctrl+S)
7. Redespliega la función
```

**Solución 2 (Si no puedes crear archivos):**
```
1. Abre /supabase/functions/server/kv_store.tsx
2. Copia TODO su contenido
3. En Supabase, abre index.ts
4. PEGA el contenido de kv_store.tsx AL INICIO (línea 1)
5. Busca y ELIMINA esta línea:
   import * as kv from "./kv_store.tsx";
6. Guarda y redespliega
```

---

### ❌ Error: "Invalid API key" o "Gemini API error 401/403"

**Causa:** La API key de Gemini no está configurada o es inválida.

**Solución:**
```
1. Ve a: https://aistudio.google.com/apikey
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key" o "Get API Key"
4. Copia la clave completa
5. En Supabase: Edge Functions → server → Secrets
6. Busca GEMINI_API_KEY (o créala si no existe)
7. Pega el valor
8. Guarda y redespliega
```

**Verificación:**
```bash
# La clave debe verse así:
GEMINI_API_KEY=AIzaSy...........................
```

---

### ❌ Error: "Unauthorized" o "Auth error 401"

**Causa:** Las credenciales de Supabase están mal configuradas.

**Solución:**
```
1. Ve a: Settings → API en tu proyecto de Supabase
2. Copia la URL del proyecto:
   https://ldhimtgexjbmwobkmcwr.supabase.co
3. Copia la "service_role" key (haz clic en "Reveal" primero)
4. En Edge Functions → server → Secrets:
   
   SB_URL = https://ldhimtgexjbmwobkmcwr.supabase.co
   SB_SERVICE_KEY = (pega la service_role key aquí)
   
5. Guarda y redespliega
```

**⚠️ IMPORTANTE:**
- NO uses la "anon" key, usa la "service_role"
- La service_role key es MUY larga (empieza con "eyJ...")
- NO compartas esta clave públicamente

---

### ❌ Error: "Syntax error" o "Unexpected token"

**Causa:** El código copiado está incompleto o tiene errores.

**Solución:**
```
1. En Supabase, BORRA TODO el código del editor
2. Abre /supabase/functions/server/index.tsx en tu proyecto
3. Selecciona TODO (Ctrl+A o Cmd+A)
4. Copia TODO (Ctrl+C o Cmd+C)
5. Pega en Supabase (Ctrl+V o Cmd+V)
6. Verifica que:
   - Primera línea: import { Hono } from "npm:hono";
   - Última línea: Deno.serve(app.fetch);
   - Total: 1531 líneas
7. Guarda y redespliega
```

---

### ❌ Error: "Failed to fetch" al llamar la función

**Causa:** CORS no está configurado o la URL es incorrecta.

**Solución:**
```
1. Verifica que el código incluye estas líneas (cerca del inicio):
   
   app.use("/*", cors({ 
     origin: "*", 
     allowHeaders: ["Content-Type", "Authorization"],
     allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
   }));

2. Verifica la URL en tu código frontend:
   Debe ser: https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server
   
3. Si falta, agrega y redespliega
```

---

### ❌ Error: "Rate limit exceeded" (429)

**Causa:** Has superado el límite de solicitudes de Gemini API.

**Solución:**
```
Tier Gratuito de Gemini:
- 15 requests por minuto
- 1500 requests por día

Si excediste:
1. Espera unos minutos
2. O actualiza tu plan en Google Cloud
3. O implementa un sistema de caché (avanzado)
```

---

### ❌ Error: La función se despliega pero no responde

**Causa:** Puede haber un error en tiempo de ejecución.

**Diagnóstico:**
```
1. Ve a: Edge Functions → server → Logs
2. Activa "Real-time" logs
3. Haz una petición a la función
4. Observa los logs en tiempo real
5. Busca mensajes de ERROR
```

**Logs comunes:**

```
✅ BUENO:
   INFO  Function started
   INFO  GET /make-server-05c2b65f/health
   INFO  Health check successful

❌ MALO:
   ERROR  Module not found
   ERROR  Invalid API key
   ERROR  Database connection failed
```

---

### ❌ Error: El health check no funciona

**URL correcta para probar:**
```
https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
```

**Respuesta esperada:**
```json
{"status":"ok"}
```

**Si NO funciona:**
```
1. Verifica que la función esté desplegada (icono verde en Supabase)
2. Revisa los logs por errores
3. Verifica las variables de entorno
4. Espera 1-2 minutos después del despliegue (puede tardar)
```

---

### ❌ Error: "Function not found" o 404

**Causa:** La función no está desplegada o el nombre es incorrecto.

**Solución:**
```
1. En Supabase Dashboard → Edge Functions
2. Verifica que aparezca una función llamada "server"
3. Debe tener un badge verde o "Active"
4. Si no existe, créala de nuevo
5. Si existe pero no responde, redespliégala
```

---

### ❌ El frontend no puede conectarse al backend

**Verificaciones:**

```javascript
// En tu código frontend, verifica que uses:

const API_URL = `https://${projectId}.supabase.co/functions/v1/server`;

// Donde projectId = "ldhimtgexjbmwobkmcwr"

// La URL completa debe ser:
https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/login
```

**Si aún falla:**
```
1. Abre la consola del navegador (F12)
2. Ve a Network
3. Busca la petición fallida
4. Revisa:
   - URL (debe ser correcta)
   - Method (GET/POST)
   - Headers (debe incluir Authorization)
   - Response (qué error devuelve)
```

---

## 🧪 Pruebas Paso a Paso

### Test 1: Health Check

```bash
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
```

**Esperado:** `{"status":"ok"}`

---

### Test 2: Login con usuario demo

```bash
curl -X POST \
  https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@demo.com","password":"demo123"}'
```

**Esperado:** JSON con `user` y `token`

---

### Test 3: Generador de IA

```bash
curl -X POST \
  https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/ai/generate-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo_token_demo-teacher-1" \
  -d '{"text":"La fotosíntesis es el proceso...","maxQuestions":5}'
```

**Esperado:** JSON con array de `questions`

---

## 📋 Checklist de Verificación

Si nada funciona, revisa esta lista en orden:

- [ ] ✅ Estoy en el proyecto correcto: `ldhimtgexjbmwobkmcwr`
- [ ] ✅ La función se llama exactamente: `server` (minúsculas)
- [ ] ✅ El código está completo (1531 líneas)
- [ ] ✅ Primera línea: `import { Hono } from "npm:hono";`
- [ ] ✅ Última línea: `Deno.serve(app.fetch);`
- [ ] ✅ Existe el archivo `kv_store.tsx` o su contenido está integrado
- [ ] ✅ Variable `SB_URL` = `https://ldhimtgexjbmwobkmcwr.supabase.co`
- [ ] ✅ Variable `SB_SERVICE_KEY` tiene la service_role key (no anon)
- [ ] ✅ Variable `GEMINI_API_KEY` tiene una clave válida de Google
- [ ] ✅ La función está desplegada (estado "Active" o verde)
- [ ] ✅ Esperé 1-2 minutos después del despliegue
- [ ] ✅ El health check responde `{"status":"ok"}`

---

## 🆘 Si NADA Funciona

### Opción 1: Empezar de Cero

```
1. En Supabase Edge Functions, ELIMINA la función "server"
2. Espera 30 segundos
3. Crea una nueva función "server" desde cero
4. Sigue la guía GUIA_DESPLIEGUE_MANUAL_SUPABASE.md paso a paso
5. No te saltes ningún paso
```

---

### Opción 2: Verificar Estado del Servicio

```
1. Ve a: https://status.supabase.com
2. Verifica que todos los servicios estén "Operational"
3. Si hay problemas, espera a que se resuelvan
```

---

### Opción 3: Revisar Límites del Plan

```
1. Ve a: Settings → Billing en Supabase
2. Verifica que no hayas excedido:
   - Storage limit
   - Database size
   - API requests
3. Si es necesario, actualiza el plan o limpia datos
```

---

## 📞 Soporte

Si después de todo esto aún tienes problemas:

1. **Revisa los logs** en Edge Functions → server → Logs
2. **Copia el mensaje de error exacto**
3. **Anota los pasos que seguiste**
4. **Verifica la versión de tu navegador**

---

## ✅ Señales de Éxito

Sabrás que TODO está funcionando cuando:

✅ Health check responde OK  
✅ Puedes hacer login con teacher@demo.com  
✅ El generador de IA crea preguntas  
✅ No hay errores en los logs  
✅ El frontend se conecta sin problemas  

🎉 **¡Tu backend está listo!**
