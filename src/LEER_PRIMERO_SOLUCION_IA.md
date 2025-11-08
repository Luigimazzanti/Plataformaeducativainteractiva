# 🔧 Solución Error Generador IA - LEER PRIMERO

## El Problema

El generador de preguntas con IA está fallando con:
- ❌ **Error 401**: "Missing authorization header"
- ❌ **Error 504**: Timeout (150 segundos)

## La Causa

**El archivo del servidor tiene extensión `.tsx` cuando debe ser `.ts`**

```
❌ Actual:  /supabase/functions/server/index.tsx
✅ Correcto: /supabase/functions/server/index.ts
```

Supabase Edge Functions **NO SOPORTAN** archivos `.tsx` (React TypeScript).
Solo funcionan con `.ts` (TypeScript puro) o `.js` (JavaScript).

## La Solución (2 minutos)

### Opción A: Desde Supabase Dashboard (Recomendado)

1. **Abre** Supabase Dashboard
2. **Ve a**: Edge Functions → `server`
3. **Encuentra** el archivo `index.tsx`
4. **Selecciona TODO** el contenido (Ctrl+A / Cmd+A)
5. **Copia** el contenido
6. **Elimina** el archivo `index.tsx`
7. **Crea** un nuevo archivo llamado `index.ts` (sin la x)
8. **Pega** el contenido copiado
9. **Guarda** y **Deploy** la función
10. ✅ **Listo!**

### Opción B: Desde Terminal (si tienes Supabase CLI)

```bash
# En /supabase/functions/server/
mv index.tsx index.ts

# Despliega
supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
```

## Verificación

Después de renombrar y redesplegar, prueba:

```bash
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
```

Debe devolver: `{"status":"ok"}`

Luego desde la app:
1. Login: `teacher@demo.com` / `demo123`
2. Crear Tarea → Generador IA
3. Pegar texto de prueba
4. Click "Generar Preguntas"
5. ✅ Debe generar preguntas correctamente

## ¿Por qué funciona?

| Extensión | Runtime | Resultado |
|-----------|---------|-----------|
| `.tsx` | Deno | ❌ No se despliega → Timeout 504 |
| `.ts` | Deno | ✅ Se despliega → Funciona perfectamente |

Los archivos `.tsx` son para componentes React (JSX).
Los archivos `.ts` son para servidores Deno/Node.

El backend de EduConnect usa **Hono** (servidor web), NO React, por lo que debe ser `.ts`.

## Documentación Adicional

- `FIX_URGENTE_GENERADOR_IA.txt` - Guía detallada paso a paso
- `SOLUCION_ERROR_IA_GEMINI.md` - Explicación técnica completa

## ¿Necesitas Ayuda?

Si después de renombrar a `.ts` sigue sin funcionar:
1. Verifica los logs en Dashboard → Edge Functions → server → Logs
2. Confirma que `GEMINI_API_KEY` existe en Settings → Edge Functions → Secrets
3. Prueba el endpoint directamente con curl (ver documentos arriba)

---

**TL;DR**: Renombra `index.tsx` → `index.ts` y redespliega. Eso es todo.
