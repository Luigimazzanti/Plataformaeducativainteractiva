# ✅ CHECKLIST DE VERIFICACIÓN RÁPIDA

## 🎯 USA ESTE CHECKLIST PARA VERIFICAR QUE TODO FUNCIONA

---

## PASO 1: Verificar que el Backend Esté Desplegado

### Test Manual en el Navegador:

Abre esta URL en tu navegador:
```
https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/health
```

**✅ ÉXITO:**
```json
{"status":"ok","message":"Runtime is stable"}
```

**❌ FALLO:**
- **404 Not Found** → Backend NO desplegado, ejecuta el comando de despliegue
- **500 Internal Server Error** → Backend desplegado pero con error, revisa logs
- **Timeout/No response** → Problema de red o CDN aún propagando

---

## PASO 2: Verificar Consola del Navegador

### Abrir DevTools:
- **Windows/Linux:** `F12` o `Ctrl + Shift + I`
- **Mac:** `Cmd + Option + I`

### Ir a la pestaña "Console"

**✅ ÉXITO (deberías ver):**
```javascript
[API] ✅ Backend connected: true
[AITaskCreator] ✅ Servidor disponible - IA activa
```

**❌ FALLO (NO deberías ver):**
```javascript
[EduConnect] Error de red real (TypeError): TypeError: Failed to fetch
[EduConnect] Network error detected, enabling demo mode
```

---

## PASO 3: Verificar Login

### Hacer Login:
1. Usuario: `teacher@demo.com`
2. Contraseña: `demo123`
3. Clic en "Iniciar Sesión"

**✅ ÉXITO:**
- Login exitoso sin errores
- Redirección al dashboard de profesor
- NO aparece mensaje de "modo demo"

**❌ FALLO:**
- Error en consola
- Mensaje "Conectando al servidor..."
- Se activa modo demo automáticamente

---

## PASO 4: Verificar IA

### Ir a Crear Tarea con IA:
1. Login como profesor
2. Clic en el botón "Crear Tarea con IA" (ícono de estrella)
3. Observar el badge en la parte superior

**✅ ÉXITO:**
```
✅ Badge VERDE: "Servidor conectado - La generación con IA está disponible"
```

**❌ FALLO:**
```
❌ Badge ROJO: "La generación con IA no está disponible"
❌ Badge GRIS: "Servidor no disponible o no respondió a tiempo"
```

---

## PASO 5: Verificar CORS

### Test con curl (Terminal/CMD):

```bash
curl -I -X OPTIONS \
  https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/health \
  -H "Origin: https://figma.com"
```

**✅ ÉXITO (buscar estos headers):**
```
access-control-allow-origin: *
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
access-control-allow-headers: Content-Type, Authorization, X-Requested-With, Accept
```

**❌ FALLO:**
- No aparecen los headers de CORS
- `access-control-allow-origin` NO es `*`

---

## PASO 6: Test Completo de Login API

### Test con curl:

```bash
curl -X POST \
  https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@demo.com","password":"demo123"}'
```

**✅ ÉXITO:**
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

**❌ FALLO:**
- Error 404: Backend no desplegado
- Error 500: Error en el código del backend
- Error de CORS: Headers mal configurados

---

## RESUMEN DE ESTADOS

### ✅ TODO FUNCIONA CORRECTAMENTE:

- [x] Health check devuelve 200 OK
- [x] Consola sin errores "Failed to fetch"
- [x] Login funciona sin activar modo demo
- [x] Badge de IA es verde
- [x] CORS headers presentes
- [x] Login API devuelve token

### ❌ ALGO ESTÁ MAL:

- [ ] Health check devuelve 404 → **Backend NO desplegado**
- [ ] Error "Failed to fetch" en consola → **Backend NO desplegado**
- [ ] Badge de IA rojo/gris → **Backend NO disponible**
- [ ] Login activa modo demo → **Backend NO responde**

---

## ACCIONES CORRECTIVAS

### Si el Backend NO Está Desplegado:

```bash
# Windows:
DEPLOY_WINDOWS.bat

# Mac/Linux:
chmod +x DEPLOY_NOW.sh && ./DEPLOY_NOW.sh

# Manual:
npx supabase functions deploy final_server --project-ref ldhimtgexjbmwobkmcwr
```

### Si el Backend Está Desplegado Pero Falla:

1. **Revisar logs en Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/ldhimtgexjbmwobkmcwr/functions/final_server/logs
   ```

2. **Verificar variables de entorno:**
   - `GEMINI_API_KEY` (para IA)
   - `SB_URL` (auto-configurada)
   - `SB_SERVICE_KEY` (auto-configurada)

3. **Esperar propagación del CDN:**
   - Espera 2-3 minutos
   - Limpia caché del navegador
   - Recarga forzada (Ctrl + Shift + R)

### Si Persiste el Error:

1. **Limpia caché del navegador:**
   ```
   Ctrl + Shift + Delete → Borrar caché
   ```

2. **Prueba en ventana de incógnito:**
   ```
   Ctrl + Shift + N
   ```

3. **Verifica que las URLs sean correctas:**
   - Debe contener: `/final_server/` (no `/server/`)
   - Project ID: `ldhimtgexjbmwobkmcwr`

---

## CREDENCIALES DE PRUEBA

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `EduConnect@Admin2024` |
| Teacher | `teacher@demo.com` | `demo123` |
| Student | `student@demo.com` | `demo123` |

---

## AYUDA ADICIONAL

- **Error "Failed to fetch":** [FIX_FAILED_TO_FETCH.md](FIX_FAILED_TO_FETCH.md)
- **Guía rápida:** [FIX_ERROR_AHORA.txt](FIX_ERROR_AHORA.txt)
- **Resumen visual:** [RESUMEN_VISUAL.txt](RESUMEN_VISUAL.txt)
- **README principal:** [README.md](README.md)

---

**Última actualización:** 2024-11-07  
**Versión:** 10.3.0-HEALTH-CHECK-FIXED
