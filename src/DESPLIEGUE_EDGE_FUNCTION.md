# Solución para Error 403 al Desplegar Edge Function

## El Error

```
Error while deploying: XHR for "/api/integrations/supabase/E7J6LgLX6mNjR68wJoshaJ/edge_functions/make-server/deploy" failed with status 403
```

## ¿Por qué ocurre?

Este error 403 (Forbidden) ocurre porque:

1. **El sistema está intentando desplegar automáticamente** el Edge Function desde Figma Make
2. **No tiene los permisos necesarios** para realizar el despliegue automático
3. **Es una limitación conocida** de la plataforma Figma Make con Supabase

## ✅ Solución: El Edge Function NO necesita redespliegue

**IMPORTANTE**: Si la aplicación ya está funcionando (puedes hacer login, crear tareas, etc.), entonces el Edge Function **ya está desplegado correctamente** y puedes **ignorar este error**.

Este error aparece cuando Figma Make intenta redesplegar automáticamente, pero no afecta la funcionalidad existente.

## ¿Cómo verificar si el Edge Function está funcionando?

### Opción 1: Desde la aplicación
1. Abre la aplicación en tu navegador
2. Abre la Consola de Desarrollo (F12)
3. Mira los logs en la pestaña "Console"
4. Busca este mensaje:
   ```
   [EduConnect] ✅ Servidor disponible - Todas las funciones activas
   ```
5. Si ves este mensaje, **el Edge Function está funcionando correctamente**

### Opción 2: Verificación manual
1. Abre una nueva pestaña del navegador
2. Ve a esta URL (reemplaza con tu proyecto):
   ```
   https://TU-PROYECTO-ID.supabase.co/functions/v1/make-server-05c2b65f/health
   ```
3. Si ves `{"status":"ok"}`, **el Edge Function está funcionando**

## 🔧 Si el Edge Function NO está funcionando

Si verificaste y el Edge Function realmente NO está funcionando, necesitas desplegarlo manualmente:

### Paso 1: Instala Supabase CLI

**En Windows:**
```powershell
scoop install supabase
# O con npm:
npm install -g supabase
```

**En Mac:**
```bash
brew install supabase/tap/supabase
# O con npm:
npm install -g supabase
```

**En Linux:**
```bash
brew install supabase/tap/supabase
# O descarga el binario desde: https://github.com/supabase/cli/releases
```

### Paso 2: Inicia sesión en Supabase

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

### Paso 3: Vincula tu proyecto

```bash
supabase link --project-ref TU-PROYECTO-ID
```

Reemplaza `TU-PROYECTO-ID` con el ID de tu proyecto de Supabase (lo puedes ver en la URL del dashboard).

### Paso 4: Prepara los archivos

Asegúrate de que tu estructura sea:

```
supabase/
└── functions/
    └── make-server-05c2b65f/
        ├── index.ts  (o index.tsx)
        └── kv_store.tsx
```

**IMPORTANTE**: La carpeta debe llamarse `make-server-05c2b65f`, NO `server`.

Si tu carpeta se llama `server`, renómbrala a `make-server-05c2b65f`:

```bash
# En tu directorio del proyecto
cd supabase/functions
mv server make-server-05c2b65f
```

### Paso 5: Despliega el Edge Function

```bash
supabase functions deploy make-server-05c2b65f
```

### Paso 6: Configura las variables de entorno

El Edge Function necesita estas variables:

```bash
supabase secrets set OPENAI_API_KEY=tu-clave-openai
supabase secrets set RESEND_API_KEY=tu-clave-resend
supabase secrets set RESEND_ADMIN_EMAIL=tu-email@ejemplo.com
```

**Para obtener la API key de OpenAI:**
1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva clave
3. Cópiala y úsala en el comando de arriba

**Las claves de Resend son opcionales** (solo si planeas usar funciones de email).

### Paso 7: Verifica el despliegue

```bash
supabase functions list
```

Deberías ver `make-server-05c2b65f` en la lista con estado "ACTIVE".

## 🎯 Resumen Rápido

| Situación | Acción |
|-----------|--------|
| La app funciona y puedes usar todo | ✅ **Ignora el error 403** |
| La app muestra "modo demo" siempre | ❌ **Despliega manualmente** (sigue los pasos arriba) |
| Solo la IA no funciona | ⚠️ **Verifica las variables de entorno** (especialmente `OPENAI_API_KEY`) |

## 🆘 Solución de Emergencia: Modo Demo

Si no puedes desplegar el Edge Function ahora mismo, la aplicación tiene un **modo demo** que funciona sin servidor:

- ✅ Puedes hacer login con credenciales demo
- ✅ Puedes crear y ver tareas
- ✅ Puedes gestionar estudiantes
- ❌ NO puedes usar la IA
- ❌ NO puedes subir archivos reales

**Credenciales demo:**
- **Profesor**: `teacher@demo.com` / `demo123`
- **Estudiante**: `student@demo.com` / `demo123`
- **Admin**: `admin` / `EduConnect@Admin2024`

## 📝 Notas Importantes

1. **El error 403 no es un bug** - Es una limitación de permisos de despliegue automático
2. **El Edge Function solo necesita desplegarse UNA VEZ** - No necesitas redesplegar cada vez
3. **Si ya funcionaba, sigue funcionando** - El error no afecta funcionalidad existente
4. **El modo demo es automático** - Si el servidor no responde, entra en modo demo

## 🔗 Enlaces Útiles

- [Documentación de Supabase CLI](https://supabase.com/docs/guides/cli)
- [Edge Functions en Supabase](https://supabase.com/docs/guides/functions)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Troubleshooting Supabase](https://supabase.com/docs/guides/platform/troubleshooting)

## Contacto

Si sigues teniendo problemas:
1. Verifica los logs en el dashboard de Supabase (Logs > Edge Functions)
2. Revisa la consola del navegador (F12) para más detalles
3. Asegúrate de que tu proyecto de Supabase esté en un plan que soporte Edge Functions
