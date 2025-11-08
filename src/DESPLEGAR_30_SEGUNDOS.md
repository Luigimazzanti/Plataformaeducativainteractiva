# ⚡ DESPLIEGUE EN 30 SEGUNDOS

## 🚀 3 PASOS RÁPIDOS

### 1️⃣ Abre el Dashboard (5 segundos)
```
https://supabase.com/dashboard/project/ldhimtgexjbmwobkmcwr/functions
```

### 2️⃣ Copia y Pega (20 segundos)
- Click en `make-server-05c2b65f` (o "Deploy new function")
- Copia TODO de: `/supabase/functions/server/index.tsx` ← **Este archivo (panel izquierdo)**
- Pega en el editor del dashboard
- Click "Deploy"

### 3️⃣ Verifica (5 segundos)
```bash
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/make-server-05c2b65f/health
```
Debe responder: `{"status":"ok"}`

---

## ✅ LISTO

Refresca EduConnect → Login con `teacher@demo.com` / `demo123` → ¡Sin errores!

---

## 📖 Más Detalles

- **Checklist completo**: `CHECKLIST_DESPLIEGUE.md`
- **Troubleshooting**: `DESPLEGAR_AHORA.md`
- **Verificación**: `ESTADO_FINAL.md`
