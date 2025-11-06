# 🚀 Solución Definitiva: Error "AI Generation Not Available"

## ✅ Estado del Código

**CONFIRMADO**: Los endpoints de IA ya están completamente implementados en `/supabase/functions/server/index.tsx`:

- ✅ `/make-server-05c2b65f/ai/generate-task` (Líneas 721-971)
- ✅ `/make-server-05c2b65f/ai/generate-task-pdf` (Líneas 973-1034)
- ✅ Integración con OpenAI API (GPT-4o y GPT-4o-mini)
- ✅ Soporte para texto, PDF, imagen y video
- ✅ Configuración de nivel de español y dificultad

## 🔴 El Problema Real

El error "La generación con IA no está disponible" ocurre porque:

1. **El Edge Function no está desplegado en Supabase**, o
2. **La variable OPENAI_API_KEY no está configurada correctamente en el entorno de producción**

## 🛠️ Solución Paso a Paso

### Paso 1: Verificar el Despliegue del Edge Function

El código del servidor debe desplegarse como un Edge Function de Supabase. Verifica:

```bash
# Estructura requerida:
supabase/
└── functions/
    └── server/
        ├── index.tsx      ✅ (Ya existe)
        └── kv_store.tsx   ✅ (Ya existe)
```

### Paso 2: Configurar la API Key de OpenAI

**Opción A - Configurar en Supabase Dashboard:**

1. Ve a tu proyecto en Supabase Dashboard: `https://supabase.com/dashboard/project/[tu-proyecto-id]`
2. Navega a **Settings** → **Edge Functions** → **Environment Variables**
3. Añade una nueva variable:
   - **Nombre**: `OPENAI_API_KEY`
   - **Valor**: Tu API key de OpenAI (ej: `sk-proj-...`)
4. Guarda los cambios

**Opción B - Configurar vía CLI:**

```bash
# Configurar el secreto
supabase secrets set OPENAI_API_KEY=sk-proj-tu-api-key-aqui

# Verificar que se configuró
supabase secrets list
```

### Paso 3: Desplegar el Edge Function

**Desde la línea de comandos:**

```bash
# Asegúrate de estar autenticado
supabase login

# Vincula tu proyecto (si no lo has hecho)
supabase link --project-ref [tu-proyecto-id]

# Despliega el Edge Function
supabase functions deploy server

# Deberías ver:
# ✓ Deployed Function server (v1) in [tiempo]
```

### Paso 4: Verificar el Despliegue

**Prueba el health endpoint:**

```bash
curl -X GET "https://[tu-proyecto-id].supabase.co/functions/v1/make-server-05c2b65f/health"

# Respuesta esperada:
# {"status":"ok"}
```

**Prueba el endpoint de IA (con autenticación):**

```bash
curl -X POST "https://[tu-proyecto-id].supabase.co/functions/v1/make-server-05c2b65f/ai/generate-task" \
  -H "Authorization: Bearer [tu-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": "La fotosíntesis es el proceso...",
    "spanishLevel": "standard",
    "difficulty": "normal"
  }'
```

### Paso 5: Verificar la API Key de OpenAI

**Asegúrate de que tu API key de OpenAI:**

1. ✅ Es válida y activa en https://platform.openai.com/api-keys
2. ✅ Tiene créditos disponibles en tu cuenta
3. ✅ Tiene permisos para usar los modelos `gpt-4o` y `gpt-4o-mini`
4. ✅ No ha sido revocada o deshabilitada

**Verifica tu balance:**
- Ve a https://platform.openai.com/usage
- Asegúrate de tener créditos disponibles

### Paso 6: Ver Logs para Debugging

**Ver logs del Edge Function en tiempo real:**

```bash
supabase functions logs server --follow
```

O en el Dashboard de Supabase:
- Ve a **Edge Functions** → **server** → **Logs**

## 🔍 Diagnóstico de Errores Comunes

### Error: "OpenAI API key not configured"

**Causa**: La variable `OPENAI_API_KEY` no está disponible en el entorno del Edge Function.

**Solución**:
```bash
supabase secrets set OPENAI_API_KEY=tu-api-key
supabase functions deploy server
```

### Error: 401 Unauthorized de OpenAI

**Causa**: La API key es inválida o ha expirado.

**Solución**:
1. Genera una nueva API key en https://platform.openai.com/api-keys
2. Actualiza el secreto:
   ```bash
   supabase secrets set OPENAI_API_KEY=nueva-api-key
   supabase functions deploy server
   ```

### Error: 429 Rate Limit de OpenAI

**Causa**: Has excedido el límite de solicitudes o no tienes créditos.

**Solución**:
1. Verifica tu plan en OpenAI
2. Añade créditos a tu cuenta si es necesario
3. Espera unos minutos si alcanzaste el límite de tasa

### Error: "Failed to fetch" en el frontend

**Causa**: El Edge Function no está desplegado o hay un error de CORS.

**Solución**:
1. Verifica que el Edge Function esté desplegado
2. El código ya incluye configuración CORS correcta (línea 9 de index.tsx)

## ✅ Checklist de Verificación

Antes de probar la funcionalidad de IA, asegúrate de que:

- [ ] El Edge Function está desplegado en Supabase
- [ ] `OPENAI_API_KEY` está configurada como secreto en Supabase
- [ ] La API key de OpenAI es válida y tiene créditos
- [ ] El health endpoint responde correctamente
- [ ] Los logs del Edge Function no muestran errores

## 🎯 Resultado Esperado

Una vez completados estos pasos:

1. El botón "Generar con IA" en la aplicación debería estar habilitado
2. Al proporcionar contenido (texto, PDF, imagen o video), la IA generará una tarea educativa estructurada
3. Las tareas incluirán:
   - Título y descripción adaptados al nivel de español seleccionado
   - 5-10 preguntas con la dificultad especificada
   - Opciones múltiples, verdadero/falso, respuestas cortas y ensayos
   - Puntuación para cada pregunta

## 📞 Soporte Adicional

Si después de seguir todos estos pasos el problema persiste:

1. **Revisa los logs detallados**:
   ```bash
   supabase functions logs server --follow
   ```

2. **Verifica la conexión desde el navegador**:
   - Abre DevTools (F12) → Console
   - Busca mensajes que comiencen con `[AITaskCreator]` o `[EduConnect]`

3. **Prueba con contenido simple**:
   - Usa el tipo "texto"
   - Ingresa un texto corto (ej: "El agua hierve a 100 grados")
   - Configura nivel estándar y dificultad normal

## 📝 Notas Importantes

- **Modelo GPT-4o**: Se usa para análisis de imágenes (requiere modelo con visión)
- **Modelo GPT-4o-mini**: Se usa para texto, PDF y video (más rápido y económico)
- **Timeout**: El frontend espera 5 segundos para el health check
- **Modo Demo**: Si el servidor no está disponible, la app automáticamente entra en modo demo (sin IA)

## 🎓 Para Desarrollo Local

Si quieres probar localmente:

```bash
# Inicia Supabase localmente
supabase start

# Configura la API key localmente
supabase secrets set OPENAI_API_KEY=tu-api-key --project-ref local

# Sirve el Edge Function localmente
supabase functions serve server

# Prueba en: http://localhost:54321/functions/v1/make-server-05c2b65f/health
```

---

**Última actualización**: Noviembre 2025  
**Estado**: Código completo ✅ | Requiere despliegue ⚠️
