# 📘 Guía Completa: Desplegar Edge Function Manualmente en Supabase

## ¿Por qué necesito esto?

El error **403** que estás viendo significa que Figma Make no tiene permisos para desplegar automáticamente tu backend a Supabase. 

**¡No te preocupes!** Tu código está perfecto. Solo necesitas copiarlo manualmente a Supabase. Es **muy fácil** y toma solo **5-10 minutos**.

---

## 📋 Resumen Visual del Proceso

```
┌─────────────────────────────────────────────────────────┐
│  PASO 1: Ir a Supabase Dashboard                       │
│  https://supabase.com/dashboard                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 2: Seleccionar proyecto                          │
│  ldhimtgexjbmwobkmcwr                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 3: Ir a Edge Functions → Crear/Editar "server"   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 4: Copiar código de index.tsx (1531 líneas)      │
│  + kv_store.tsx si es necesario                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 5: Configurar 3 variables de entorno:            │
│  • SB_URL                                              │
│  • SB_SERVICE_KEY                                      │
│  • GEMINI_API_KEY                                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 6: Presionar "Deploy" y esperar                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 7: Verificar que funcione                        │
│  Abrir: .../server/make-server-05c2b65f/health        │
│  Debe responder: {"status":"ok"}                       │
└─────────────────────────────────────────────────────────┘

        🎉 ¡LISTO! Tu backend está funcionando
```

---

## 🎯 Paso a Paso (Opción Recomendada: Dashboard Web)

### **Paso 1: Acceder a tu proyecto Supabase**

```
🌐 URL: https://supabase.com/dashboard
```

1. Abre tu navegador
2. Ve a: **https://supabase.com/dashboard**
3. Inicia sesión con tu cuenta (email/contraseña o GitHub)
4. En la lista de proyectos, **busca y haz clic** en: **`ldhimtgexjbmwobkmcwr`**

💡 **Consejo:** Si tienes muchos proyectos, usa el buscador en la parte superior.

---

### **Paso 2: Ir a Edge Functions**

Una vez dentro de tu proyecto:

```
📍 Ruta: Menú lateral → Edge Functions
```

1. Mira el **menú lateral izquierdo** (sidebar)
2. Busca la opción **"Edge Functions"** 
   - Puede tener un ícono de rayo ⚡ o función 𝑓(𝑥)
   - En inglés aparece como "Edge Functions"
   - En algunos dashboards puede estar dentro de **"Functions"**
3. Haz clic en **"Edge Functions"**

📸 **¿Cómo se ve?** Verás una lista de funciones (puede estar vacía si es la primera vez)

---

### **Paso 3: Crear o Editar la Función "server"**

Ahora tienes 2 posibles escenarios:

#### **Escenario A: La función "server" YA existe**

Si ves una función llamada **"server"** en la lista:

1. Haz clic en el nombre **"server"**
2. Se abrirá la página de detalles
3. Busca y haz clic en el botón **"Edit"** (puede decir "Edit function" o tener un ícono de lápiz ✏️)
4. Verás un editor de código con el contenido actual
5. **Selecciona TODO** el código viejo y **bórralo**

#### **Escenario B: La función NO existe (primera vez)**

Si la lista está vacía o no ves "server":

1. Haz clic en el botón **"New Function"**, **"Create Function"** o **"+ New function"**
2. Te pedirá que elijas un nombre
3. Escribe exactamente: **`server`** (todo en minúsculas, sin espacios)
4. Puede pedirte elegir una plantilla → Elige **"Blank function"** o **"Empty"**
5. Haz clic en **"Create"** o **"Continue"**
6. Se abrirá el editor de código (probablemente con código de ejemplo)
7. **Selecciona TODO** el código de ejemplo y **bórralo**

### **Paso 4: Copiar el Código Principal**

Ahora vas a copiar el código del servidor:

#### **📄 Archivo 1: index.ts (el archivo principal - 1531 líneas)**

1. En el editor de Supabase, **borra todo el código que aparece por defecto**
2. Ve a tu proyecto EduConnect en Figma Make
3. Abre el archivo: **`/supabase/functions/server/index.tsx`**
4. Haz clic en el archivo y **selecciona TODO** (Ctrl+A o Cmd+A)
5. **Copia TODO el contenido** (Ctrl+C o Cmd+C)
6. Vuelve a Supabase y **pega** el código en el editor (Ctrl+V o Cmd+V)

✅ **¡Listo!** El archivo ya tiene `Deno.serve(app.fetch);` al final, no necesitas agregar nada más.

#### **📄 Archivo 2: kv_store.tsx (utilidades de base de datos)**

**⚠️ IMPORTANTE: Este es un archivo PROTEGIDO**

El archivo `kv_store.tsx` ya está incluido en tu función de Supabase automáticamente. **NO necesitas copiarlo ni modificarlo**.

Si el editor de Supabase te permite ver archivos adicionales:
- Verifica que exista un archivo llamado `kv_store.tsx`
- Si NO existe, puedes crearlo manualmente:
  1. Busca el botón **"Add file"** o **"New file"**
  2. Nómbralo: `kv_store.tsx`
  3. Copia el contenido de `/supabase/functions/server/kv_store.tsx` de tu proyecto
  4. Pégalo y guarda

**Si NO puedes crear archivos adicionales:**
- No te preocupes, el código principal (`index.ts`) ya importa el módulo correctamente
- La función debería funcionar solo con el archivo principal

### **Paso 5: Configurar Variables de Entorno (Secrets)**

Estas son **MUY IMPORTANTES** - sin ellas, tu función no funcionará.

1. En el panel de la función, busca una sección llamada:
   - **"Secrets"** (lo más común), o
   - **"Environment Variables"**, o  
   - **"Configuration"**

2. **Verifica o agrega** estas 3 variables:

   | Variable | ¿Dónde conseguirla? | Valor |
   |----------|---------------------|-------|
   | `SB_URL` | Tu URL de proyecto | `https://ldhimtgexjbmwobkmcwr.supabase.co` |
   | `SB_SERVICE_KEY` | Settings → API en Supabase | Ver instrucciones abajo 👇 |
   | `GEMINI_API_KEY` | Google AI Studio | Ver instrucciones abajo 👇 |

---

#### **🔑 Cómo obtener SB_SERVICE_KEY:**

1. En tu proyecto de Supabase, ve al menú lateral
2. Haz clic en **"Settings"** (⚙️ icono de engranaje)
3. Selecciona **"API"**
4. Busca la sección **"Project API keys"**
5. Encuentra la clave llamada **"service_role"** (NO uses "anon")
6. Haz clic en **"Reveal"** o en el ícono del ojo 👁️
7. Copia el valor completo
8. **⚠️ ADVERTENCIA:** Esta clave da acceso completo a tu base de datos. NUNCA la compartas públicamente o la subas a Git.

---

#### **🤖 Cómo obtener GEMINI_API_KEY:**

1. Ve a: **https://aistudio.google.com/apikey** o **https://makersuite.google.com/app/apikey**
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Create API Key"** o **"Get API Key"**
4. Selecciona un proyecto de Google Cloud (o crea uno nuevo si te lo pide)
5. Copia la clave que te genera
6. Pégala como valor de `GEMINI_API_KEY`

**Nota:** El API de Gemini tiene un nivel gratuito generoso. Si es tu primera vez, probablemente no necesites pagar nada.

### **Paso 6: Guardar y Desplegar**

1. Busca el botón **"Deploy"** o **"Save"** o **"Save & Deploy"**
2. Haz clic
3. Espera 30-60 segundos mientras se despliega
4. Deberías ver un mensaje de **"Deployment successful"** o similar

### **Paso 7: Verificar que Funciona**

1. Una vez desplegada, copia la URL de tu función. Debería verse así:
   ```
   https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server
   ```

2. Prueba el health check en tu navegador:
   ```
   https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
   ```

3. Si ves `{"status":"ok"}`, **¡FUNCIONÓ!** 🎉

---

## 🛠️ Opción 2: Despliegue desde Terminal (Avanzado)

Si prefieres usar la línea de comandos:

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Iniciar sesión
supabase login

# 3. Enlazar tu proyecto
supabase link --project-ref ldhimtgexjbmwobkmcwr

# 4. Desplegar la función
supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
```

---

## ❓ Preguntas Frecuentes

### **P: ¿Dónde encuentro mi Gemini API Key?**
R: Ve a https://makersuite.google.com/app/apikey o https://aistudio.google.com/apikey

### **P: El editor me dice "syntax error" o "error de sintaxis"**
R: Verifica:
1. ✅ Haber copiado **TODO** el código (desde la primera línea `import` hasta `Deno.serve(app.fetch);`)
2. ✅ No haber dejado código viejo del ejemplo de Supabase
3. ✅ No tener código duplicado (puede pasar si pegaste dos veces)
4. ✅ El archivo debe empezar con `import { Hono } from "npm:hono";`
5. ✅ El archivo debe terminar con `Deno.serve(app.fetch);`

### **P: Veo "Module not found: kv_store.tsx" o error de módulo**
R: El archivo `kv_store.tsx` es necesario. Tienes 2 opciones:

**Opción 1 (Preferida):**
- En el dashboard de Supabase, busca cómo agregar un segundo archivo
- Crea `kv_store.tsx` como archivo adicional
- Copia su contenido desde `/supabase/functions/server/kv_store.tsx`

**Opción 2 (Si no puedes crear archivos adicionales):**
- Abre `/supabase/functions/server/kv_store.tsx` en tu proyecto
- Copia TODO su contenido
- En el editor de Supabase, pégalo **ANTES** del código de `index.tsx` (al principio)
- Busca y **elimina** esta línea: `import * as kv from "./kv_store.tsx";`
- Guarda y redespliega

### **P: ¿Necesito hacer esto cada vez que cambie el código?**
R: Solo si cambias algo en `/supabase/functions/server/`. Los cambios en el frontend (componentes, etc.) NO requieren redesplegar el backend.

---

## 🎨 Referencia Visual Rápida

### ¿Qué buscar en el Dashboard de Supabase?

```
Dashboard de Supabase
│
├── 📁 Projects
│   └── ldhimtgexjbmwobkmcwr ← TU PROYECTO
│
├── Menú lateral:
│   ├── 🏠 Home
│   ├── 📊 Table Editor
│   ├── 🔐 Authentication  
│   ├── 📦 Storage
│   ├── ⚡ Edge Functions ← HAZ CLIC AQUÍ
│   └── ⚙️ Settings
│       └── API ← AQUÍ ESTÁ LA SERVICE_ROLE KEY
│
└── Edge Functions:
    ├── server ← LA FUNCIÓN QUE CREARÁS/EDITARÁS
    │   ├── 📝 Code (editor)
    │   ├── 🔐 Secrets (variables de entorno)
    │   └── 📊 Logs (para ver errores)
    │
    └── [+ New Function] ← Si no existe "server"
```

---

## ✅ Checklist Final (Paso por Paso)

Marca cada paso cuando lo completes:

**Preparación:**
- [ ] Tengo mi cuenta de Supabase abierta en el navegador
- [ ] Tengo mi proyecto EduConnect abierto en Figma Make (para copiar código)
- [ ] Tengo un bloc de notas para guardar las API keys temporalmente

**En Supabase Dashboard:**
- [ ] Accedí a https://supabase.com/dashboard
- [ ] Seleccioné el proyecto `ldhimtgexjbmwobkmcwr`
- [ ] Hice clic en "Edge Functions" en el menú lateral
- [ ] Creé o abrí la función "server"

**Código:**
- [ ] Copié TODO el contenido de `/supabase/functions/server/index.tsx`
- [ ] Pegué el código en el editor de Supabase
- [ ] Verifiqué que empiece con `import { Hono } from "npm:hono";`
- [ ] Verifiqué que termine con `Deno.serve(app.fetch);`
- [ ] (Opcional) Copié el archivo `kv_store.tsx` si fue necesario

**Variables de Entorno:**
- [ ] Configuré `SB_URL` = `https://ldhimtgexjbmwobkmcwr.supabase.co`
- [ ] Obtuve y configuré `SB_SERVICE_KEY` desde Settings → API
- [ ] Obtuve y configuré `GEMINI_API_KEY` desde Google AI Studio

**Despliegue:**
- [ ] Presioné el botón "Deploy" o "Save & Deploy"
- [ ] Esperé a que termine el despliegue (30-60 segundos)
- [ ] Vi el mensaje de éxito ✅

**Verificación:**
- [ ] Abrí en el navegador: `https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health`
- [ ] Vi la respuesta: `{"status":"ok"}`
- [ ] Probé iniciar sesión en EduConnect y funciona

**🎉 ¡TODO COMPLETO!**

---

## 🎉 ¡Listo!

Una vez completado, tu aplicación EduConnect estará **100% funcional** con:
- ✅ Login de usuarios (admin/teacher/student)
- ✅ Sistema de tareas y calificaciones
- ✅ Subida de archivos
- ✅ **Generador de preguntas con IA de Gemini**
- ✅ Formularios interactivos
- ✅ Todo el sistema de administración

**Tu aplicación ya funciona, solo falta conectar el backend manualmente desde Supabase.**

---

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa los logs en Supabase (sección "Logs" de la función)
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el Service Role Key sea correcto
4. Comprueba que tu proyecto Supabase esté en un plan que soporte Edge Functions
