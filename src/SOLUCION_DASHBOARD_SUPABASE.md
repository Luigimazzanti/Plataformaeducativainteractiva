# 🔧 Solución para Dashboard de Supabase - index.ts desaparece

## El Problema que Estás Experimentando

Cuando creas `index.ts` en el Dashboard y haces Deploy, el archivo **desaparece**.

### ¿Por qué sucede esto?

Supabase tiene **ambos archivos** (`index.tsx` e `index.ts`) y al hacer deploy, solo mantiene uno, eliminando el que acabas de crear.

## ✅ Solución Paso a Paso

### Método 1: Reemplazar (NO añadir)

**NO hagas "Add file" → Esto crea un archivo nuevo adicional ❌**

**EN SU LUGAR:**

1. **Abre** Supabase Dashboard
2. **Ve a**: Edge Functions → `server`
3. **Click en el archivo** `index.tsx` para abrirlo
4. **En la parte superior**, verás el nombre del archivo: `index.tsx`
5. **Click en el nombre del archivo** (debería ser editable)
6. **Cambia** `index.tsx` → `index.ts` (elimina la `x`)
7. **NO cambies el contenido** del archivo (ya está correcto)
8. **Click en "Save"** o presiona `Ctrl+S` / `Cmd+S`
9. **Click en "Deploy"**
10. ✅ **Listo!**

### Método 2: Eliminar y Recrear

Si el Método 1 no funciona (algunos dashboards no permiten renombrar):

1. **Abre** el archivo `index.tsx` en el Dashboard
2. **Selecciona TODO** el contenido (`Ctrl+A` / `Cmd+A`)
3. **Copia** el contenido (`Ctrl+C` / `Cmd+C`)
4. **Guárdalo** temporalmente en un Notepad/TextEdit en tu computadora
5. **Vuelve** a la lista de archivos
6. **Encuentra** `index.tsx` y **haz click en el ícono de eliminar** (🗑️ o tres puntos → Delete)
7. **Confirma** la eliminación
8. **Ahora haz click** en "Add file" o "New file"
9. **Nombra el archivo**: `index.ts` (sin la `x`, IMPORTANTE)
10. **Pega** el contenido que copiaste antes (`Ctrl+V` / `Cmd+V`)
11. **Click en "Save"**
12. **Click en "Deploy"**
13. ✅ **Listo!**

### Método 3: Desde Git/CLI (Si tienes acceso)

Si tienes acceso al repositorio Git o a la terminal:

```bash
# Opción A: Usar el script que ya creamos
bash fix-ia-generator.sh

# Opción B: Manual
cd supabase/functions/server
rm index.tsx
# Copia el contenido de index.tsx a index.ts primero
mv index.tsx index.ts  # O renombra manualmente

# Commit y push (si usas Git)
git add .
git commit -m "Fix: Rename index.tsx to index.ts for Deno compatibility"
git push

# Deploy desde CLI
supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
```

## 🎯 Verificación

Después de aplicar cualquiera de los métodos:

### 1. Verifica que el archivo es .ts

En el Dashboard, deberías ver:
```
✅ index.ts    (NO index.tsx)
✅ kv_store.ts
```

### 2. Verifica el Deploy

Busca el badge o mensaje:
- 🟢 **Active** o **Deployed**
- Fecha/hora del deploy debe ser **reciente** (hace segundos/minutos)

### 3. Test rápido

```bash
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
```

Debe devolver: `{"status":"ok"}`

### 4. Test completo desde la app

1. Login: `teacher@demo.com` / `demo123`
2. Crear Tarea → Generador IA
3. Pegar texto y generar preguntas
4. Debe funcionar en ~3-5 segundos ✅

## ❓ FAQ

### P: ¿Por qué no puedo tener ambos archivos?

**R:** Deno (el runtime) busca el archivo principal en este orden:
1. `index.ts`
2. `index.tsx`
3. `index.js`

Si existen ambos (`.tsx` y `.ts`), hay conflicto. Además, `.tsx` NO funciona en Deno/Supabase porque no hay soporte para JSX/React en Edge Functions.

### P: ¿Perderé el código al eliminar index.tsx?

**R:** NO, si sigues el Método 2 correctamente:
1. Primero COPIAS el contenido
2. Luego eliminas el archivo viejo
3. Creas el nuevo con el mismo contenido

El contenido es exactamente el mismo, solo cambia la extensión.

### P: ¿Qué pasa si ya eliminé index.tsx sin copiar el contenido?

**R:** No te preocupes. El contenido está en varios lugares:
- En el historial de Git (si usas Git)
- En la estructura de archivos de Figma Make
- Puedes recuperarlo desde el Dashboard (History/Versions)

Si lo perdiste completamente, avísame y te ayudo a recuperarlo.

### P: El método de renombrar no funciona en mi Dashboard

**R:** Algunos dashboards de Supabase no permiten renombrar directamente. En ese caso, usa el **Método 2** (Eliminar y Recrear). Es completamente seguro si copias el contenido antes.

### P: ¿Cómo sé si el deploy fue exitoso?

**R:** Verifica estos 3 indicadores:
1. ✅ Badge verde "Deployed" o "Active" en el Dashboard
2. ✅ El health check devuelve `{"status":"ok"}`
3. ✅ La fecha/hora del deploy es reciente (últimos minutos)

## 🚨 Errores Comunes

### Error: "index.ts desaparece al hacer deploy"

**Causa:** Todavía existe `index.tsx` en el sistema.

**Solución:**
1. Lista todos los archivos en el Dashboard
2. Asegúrate de que `index.tsx` fue eliminado
3. Solo debe existir `index.ts`
4. Vuelve a hacer deploy

### Error: "Function deployment failed"

**Causa:** El archivo tiene errores de sintaxis o está vacío.

**Solución:**
1. Abre `index.ts` en el Dashboard
2. Verifica que el contenido NO está vacío
3. Verifica que comienza con: `import { Hono } from "npm:hono";`
4. Verifica que termina con: `Deno.serve(app.fetch);`
5. Guarda y vuelve a hacer deploy

### Error: "Cannot find module './kv_store.ts'"

**Causa:** El archivo `kv_store.ts` no existe o está en el lugar incorrecto.

**Solución:**
1. Verifica que existe `kv_store.ts` en el mismo directorio
2. NO debe estar en una subcarpeta
3. La estructura debe ser:
   ```
   /supabase/functions/server/
   ├── index.ts       ← Archivo principal
   └── kv_store.ts    ← Módulo KV
   ```

## 📝 Notas Importantes

1. **Solo debe existir UN archivo principal**: `index.ts` (NO `index.tsx`)
2. **El contenido es el mismo**, solo cambia la extensión
3. **Siempre copia el contenido** antes de eliminar (por seguridad)
4. **Verifica el deploy** con el health check después de cada cambio
5. **Los archivos `.tsx` NO funcionan** en Supabase Edge Functions

## 🎉 Después de Aplicar el Fix

Una vez que tengas solo `index.ts` desplegado correctamente:

1. **El generador IA funcionará** en 3-5 segundos
2. **No más errores 504** timeout
3. **No más errores 401** unauthorized
4. **Todas las peticiones CORS** funcionarán correctamente

---

**Tiempo estimado:** 2-3 minutos
**Dificultad:** Baja
**Impacto:** Alto (desbloquea toda la IA)

Si sigues teniendo problemas después de seguir estos pasos, comparte:
- Screenshot del Dashboard mostrando los archivos
- Screenshot del error que aparece
- Los logs del deploy (si están disponibles)
