# Solución para el Error de IA en EduConnect

## Problema
Cuando intentas usar la funcionalidad de "Crear Tarea con IA", aparece el error:
```
Error al generar con IA: La generación AI no está disponible en modo demo
```

## ¿Por qué ocurre?

La aplicación EduConnect funciona en dos modos:

### 1. **Modo Servidor (con IA)** ✅
- Requiere conexión al servidor de Supabase
- Todas las funciones están disponibles: IA, subida de archivos, etc.
- Se activa automáticamente si el servidor responde

### 2. **Modo Demo (sin IA)** ⚠️
- Se activa automáticamente si el servidor NO responde en 5 segundos
- Funcionalidad básica disponible (login demo, tareas, etc.)
- **NO incluye**: Generación de IA, subida de archivos reales

## Solución

### Paso 1: Verifica el estado del servidor

Cuando abras el diálogo de "Crear Tarea con IA", verás uno de estos mensajes:

#### ✅ **Servidor conectado** (Todo funciona)
```
Servidor conectado - La generación con IA está disponible
```
→ Puedes usar la IA normalmente

#### ❌ **Servidor no disponible** (Modo demo activo)
```
La generación con IA no está disponible
El servidor no está disponible o no respondió a tiempo
```
→ Sigue los pasos de solución

### Paso 2: Verifica tu configuración

#### A. Verifica la conexión a internet
- Asegúrate de estar conectado a internet
- Prueba abrir otra página web

#### B. Verifica el Edge Function
1. Ve al dashboard de Supabase
2. Ve a "Edge Functions"
3. Verifica que la función `make-server-05c2b65f` esté **activa** y **desplegada**

#### C. Verifica la API Key de OpenAI
1. Ve al dashboard de Supabase
2. Ve a "Settings" → "Secrets"
3. Verifica que existe la variable `OPENAI_API_KEY` con tu clave de OpenAI

**Cómo obtener una clave de OpenAI:**
1. Ve a https://platform.openai.com/
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys"
4. Crea una nueva clave
5. Cópiala y agrégala en Supabase Secrets

### Paso 3: Recarga la aplicación
1. Guarda cualquier trabajo no guardado
2. **Recarga la página completamente** (Ctrl+R o Cmd+R)
3. Espera a que aparezca el mensaje de inicio de sesión
4. Inicia sesión nuevamente
5. Intenta usar la IA de nuevo

### Paso 4: Verifica los logs del navegador
1. Abre la Consola de Desarrollo (F12 o Cmd+Option+I)
2. Ve a la pestaña "Console"
3. Busca mensajes que comiencen con `[EduConnect]`
4. Deberías ver:
   ```
   [EduConnect] Verificando disponibilidad del servidor...
   [EduConnect] ✅ Servidor disponible - Todas las funciones activas
   ```

Si ves:
```
[EduConnect] ⚠️ Servidor no disponible
[EduConnect] Activando modo demo (sin IA ni subida de archivos)
```
→ El servidor no está respondiendo, verifica los pasos anteriores

## Verificación Manual del Servidor

Puedes verificar manualmente si el servidor funciona:

1. Abre una nueva pestaña del navegador
2. Ve a: `https://TU-PROYECTO.supabase.co/functions/v1/make-server-05c2b65f/health`
   (Reemplaza `TU-PROYECTO` con el ID de tu proyecto de Supabase)
3. Deberías ver: `{"status":"ok"}`

Si ves un error o la página no carga:
- El Edge Function no está desplegado
- Hay un problema con tu proyecto de Supabase
- Verifica la configuración en el dashboard de Supabase

## Notas Importantes

1. **La IA requiere créditos de OpenAI**: Asegúrate de tener créditos disponibles en tu cuenta de OpenAI
2. **El timeout es de 5 segundos**: Si tu servidor tarda más en responder, la app entra en modo demo
3. **Modo demo es automático**: No es un error, es una característica para que la app funcione sin servidor
4. **Puedes recargar para reintentar**: La verificación del servidor se hace al iniciar la app

## Modelo de IA Usado

La aplicación usa:
- **GPT-4o-mini** para texto, PDF y video (más rápido y económico)
- **GPT-4o** para imágenes (con capacidad de visión)

## Costos Aproximados

- Generar una tarea con texto: ~$0.001 - $0.01 USD
- Generar una tarea con imagen: ~$0.01 - $0.05 USD

## Contacto

Si el problema persiste después de seguir todos los pasos:
1. Verifica que tu proyecto de Supabase esté activo
2. Revisa los logs del Edge Function en Supabase
3. Contacta al administrador del sistema
