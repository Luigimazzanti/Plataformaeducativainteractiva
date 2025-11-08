# 🚀 INSTRUCCIONES DE DESPLIEGUE FINAL - EDUCONNECT

## ✅ CAMBIOS APLICADOS

### **1. Función Renombrada**
- **Antes:** `/server/`
- **Ahora:** `/final_server/`
- **Razón:** Evitar problemas de caché de Supabase

### **2. Archivos Actualizados**

#### ✅ Frontend (`/utils/api.ts`)
```typescript
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/final_server/make-server-05c2b65f`;
```

#### ✅ App Principal (`/App.tsx`)
```typescript
const response = await window.fetch(
  `https://${projectId}.supabase.co/functions/v1/final_server/make-server-05c2b65f/health`,
  { method: "GET", signal: controller.signal }
);
```

#### ✅ Backend Creado (`/supabase/functions/final_server/index.ts`)
- Código completo (1053 líneas)
- Variables de entorno: `SB_URL` y `SB_SERVICE_KEY` ✅
- KV Store neutralizado (mock seguro) ✅
- Endpoint de IA incluido (`/ai/generate-task`) ✅
- Deno.serve al final ✅

---

## 🎯 COMANDO DE DESPLIEGUE

Ejecuta **UNO** de estos comandos:

### Opción 1: Comando directo
```bash
npx supabase functions deploy final_server --project-ref ldhimtgexjbmwobkmcwr
```

### Opción 2: Script automatizado
```bash
bash DESPLEGAR_FINAL_SERVER.sh
```

---

## 🧪 VERIFICACIÓN POST-DESPLIEGUE

### 1. Test del Health Check
```bash
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/health
```

**Respuesta esperada:**
```json
{"status":"ok","message":"Runtime is stable"}
```

### 2. Test del Login
```bash
curl -X POST https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/final_server/make-server-05c2b65f/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@demo.com","password":"demo123"}'
```

**Respuesta esperada:**
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

## 📋 ESTRUCTURA DEL PROYECTO

```
/supabase/functions/
├── server/          ← ANTIGUO (puedes eliminarlo después)
│   ├── index.ts
│   ├── index.tsx
│   └── kv_store.tsx
└── final_server/    ← NUEVO (desplegado)
    └── index.ts
```

---

## 🎉 RESULTADO ESPERADO

Después del despliegue exitoso:

1. ✅ El frontend se conectará a `/final_server/`
2. ✅ El login funcionará sin "Failed to fetch"
3. ✅ NO se activará modo demo automáticamente
4. ✅ Todas las credenciales demo funcionarán:
   - **Admin:** `admin` / `EduConnect@Admin2024`
   - **Teacher:** `teacher@demo.com` / `demo123`
   - **Student:** `student@demo.com` / `demo123`

---

## 🔧 TROUBLESHOOTING

### Error: "Function not found"
**Solución:** Verifica que el nombre sea exactamente `final_server` (con guion bajo, no guion medio)

### Error: "Failed to fetch" persiste
**Solución:** 
1. Limpia caché del navegador (Ctrl + Shift + R)
2. Verifica la URL del health check
3. Revisa los logs en Supabase Dashboard

### Error: "GEMINI_API_KEY not configured"
**Solución:** 
```bash
npx supabase secrets set GEMINI_API_KEY=tu_clave_aqui --project-ref ldhimtgexjbmwobkmcwr
```

---

## 📞 SIGUIENTE PASO

**EJECUTA EL COMANDO DE DESPLIEGUE AHORA:**

```bash
npx supabase functions deploy final_server --project-ref ldhimtgexjbmwobkmcwr
```

Después del despliegue, recarga la aplicación y verás que funciona sin activar modo demo. 🎉
