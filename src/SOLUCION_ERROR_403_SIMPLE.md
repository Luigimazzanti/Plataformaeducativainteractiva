# ⚡ Solución Rápida al Error 403 - 3 Minutos

## 🎯 El Problema

```
❌ Error while deploying: XHR for "/api/integrations/supabase/.../deploy" failed with status 403
```

**Traducción:** Figma Make no puede desplegar tu backend automáticamente.

**Solución:** Hazlo manualmente desde Supabase (es fácil).

---

## ✅ La Solución en 3 Pasos

### 1️⃣ Ir a Supabase y Crear la Función

1. Abre: **https://supabase.com/dashboard**
2. Selecciona tu proyecto: **ldhimtgexjbmwobkmcwr**
3. Menú lateral → **Edge Functions**
4. Click en **"New Function"** (o edita "server" si ya existe)
5. Nombre: **`server`**

---

### 2️⃣ Copiar el Código

⚠️ **IMPORTANTE:** El archivo en Supabase DEBE llamarse `index.ts` (NO `index.tsx`)

1. En el editor de Supabase, **borra todo** el código que aparezca
2. En tu proyecto EduConnect, abre: **`/supabase/functions/server/index.tsx`**
3. **Copia TODO** el contenido (las 1531 líneas completas)
4. **Pega** en el editor de Supabase
5. **Asegúrate** de que el archivo en Supabase se llame `index.ts` (sin la x)

---

### 3️⃣ Configurar Secrets (Variables de Entorno)

En la sección **"Secrets"** de la función, agrega:

| Nombre | Valor | ¿Dónde lo consigo? |
|--------|-------|--------------------|
| `SB_URL` | `https://ldhimtgexjbmwobkmcwr.supabase.co` | Aquí mismo 👈 |
| `SB_SERVICE_KEY` | (tu clave secreta) | Supabase → Settings → API → "service_role" |
| `GEMINI_API_KEY` | (tu clave de Gemini) | https://aistudio.google.com/apikey |

---

## 🚀 Desplegar

1. Click en **"Deploy"** o **"Save & Deploy"**
2. Espera 30-60 segundos
3. Verás un mensaje de éxito ✅

---

## ✔️ Verificar que Funciona

Abre esta URL en tu navegador:

```
https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
```

**Si ves esto, ¡FUNCIONÓ!** 🎉

```json
{"status":"ok"}
```

---

## 🆘 ¿Tienes problemas?

### Error: "Module not found: kv_store.ts"

**Solución:**
1. En Supabase, crea un segundo archivo llamado `kv_store.ts` (SIN la x)
2. Copia el contenido de `/supabase/functions/server/kv_store.ts`
3. Pégalo y guarda

⚠️ **NOTA:** El archivo DEBE llamarse `kv_store.ts`, no `.tsx`

### Error: "Invalid API key" o "Gemini error"

**Solución:**
- Ve a https://aistudio.google.com/apikey
- Crea una nueva API key
- Cópiala y pégala en la variable `GEMINI_API_KEY`

### Error: "Unauthorized" o 401

**Solución:**
- Ve a Supabase → Settings → API
- Copia la clave **"service_role"** (NO la "anon")
- Pégala en la variable `SB_SERVICE_KEY`

---

## 📚 ¿Necesitas más detalles?

Lee la guía completa: **`GUIA_DESPLIEGUE_MANUAL_SUPABASE.md`**

---

## 🎉 Resultado Final

Una vez desplegado, tu aplicación EduConnect tendrá:

✅ Login con admin/teacher/student  
✅ Sistema de tareas y calificaciones  
✅ Subida de archivos y videos  
✅ **Generador de preguntas con IA de Gemini** 🤖  
✅ Formularios interactivos  
✅ Dashboard de administración completo  

**¡Tu aplicación está lista para usarse!**
