# ✅ Checklist de Verificación Post-Fix

## Después de aplicar la solución (renombrar index.tsx → index.ts)

### 1. Verificar Estructura de Archivos

```bash
ls -la supabase/functions/server/
```

**Debe mostrar:**
```
✅ index.ts       (anteriormente index.tsx)
✅ kv_store.ts
⚠️  kv_store.tsx  (ignorar, el .ts se usa)
```

**NO debe mostrar:**
```
❌ index.tsx  (este archivo NO debe existir)
```

---

### 2. Verificar Despliegue Exitoso

**a) Usando Supabase Dashboard:**
- Ve a: **Edge Functions** → **server**
- Busca el badge: `🟢 Active` o `✅ Deployed`
- Verifica la fecha/hora del último deploy (debe ser reciente)

**b) Usando Supabase CLI:**
```bash
supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
```

**Salida esperada:**
```
✅ Deployed function server version: xxx
✅ URL: https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server
```

---

### 3. Test de Health Check

```bash
curl https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
```

**Resultado esperado:**
```json
{"status":"ok"}
```

**Si ves esto, ✅ el servidor está funcionando correctamente**

---

### 4. Test del Endpoint de IA

```bash
curl -X POST \
  https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/ai/generate-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo_token_demo-teacher-1" \
  -d '{
    "text": "La fotosíntesis es el proceso mediante el cual las plantas convierten la luz solar en energía química. Este proceso ocurre en los cloroplastos.",
    "maxQuestions": 5,
    "includeCompletarBlancos": true
  }'
```

**Resultado esperado:**
```json
{
  "questions": [
    {
      "id": "q-...",
      "pregunta": "¿Qué es la fotosíntesis?",
      "respuesta": "El proceso mediante el cual...",
      "tipo": "definicion",
      "oracionOriginal": "..."
    },
    ...
  ],
  "metadata": {
    "generatedBy": "Gemini AI",
    "generatedAt": "...",
    "questionCount": 5
  }
}
```

**Si ves preguntas generadas, ✅ el generador IA funciona correctamente**

---

### 5. Test desde la Aplicación Web

#### a) Login
1. Abre la aplicación: `http://localhost:3000` (o tu URL de producción)
2. Login como profesor: `teacher@demo.com` / `demo123`
3. **Debe funcionar** ✅

#### b) Abrir Generador IA
1. Click en **"Crear Tarea"**
2. Click en botón **"Generador de Preguntas con IA"** (ícono ⚡)
3. **Debe abrir el diálogo** ✅

#### c) Generar Preguntas
1. Pega este texto de prueba:
   ```
   La fotosíntesis es el proceso mediante el cual las plantas 
   convierten la luz solar en energía química. Este proceso ocurre 
   en los cloroplastos, que contienen clorofila, el pigmento que 
   da a las plantas su color verde. Durante la fotosíntesis, las 
   plantas absorben dióxido de carbono del aire y agua del suelo.
   ```

2. Ajusta configuración (opcional):
   - Máximo de preguntas: 20
   - Incluir completar blancos: ✅ activado

3. Click en **"Generar Preguntas"**

**Resultado esperado:**
- ⏱️ Tiempo de espera: ~3-5 segundos (NO 150 segundos)
- ✅ Mensaje: "✨ X preguntas generadas con IA de Gemini"
- ✅ Lista de preguntas visible con diferentes tipos
- ✅ Estadísticas del cuestionario visible

**Si ves esto, ✅ TODO FUNCIONA CORRECTAMENTE**

---

### 6. Verificar Logs (Opcional)

**En Supabase Dashboard:**
1. Ve a: **Edge Functions** → **server** → **Logs**
2. Click en **"Refresh"** o espera auto-refresh
3. Busca entradas recientes relacionadas con `/ai/generate-questions`

**Logs esperados (exitosos):**
```
POST | 200 | /make-server-05c2b65f/ai/generate-questions
Generating questions with Gemini AI for text length: 280
Calling Gemini API for question generation...
Gemini response received successfully for question generation
Generated 5 questions successfully
```

**NO debe haber:**
```
❌ 504 Gateway Timeout
❌ 403 Forbidden
❌ TypeError: fetch failed
❌ CORS error
```

---

### 7. Verificar Variables de Entorno

**En Supabase Dashboard:**
1. Ve a: **Settings** → **Edge Functions** → **Secrets**
2. Confirma que existen:
   - ✅ `GEMINI_API_KEY`
   - ✅ `SB_URL`
   - ✅ `SB_SERVICE_KEY`

**Si falta alguna, agrégala desde el Dashboard**

---

### 8. Test de Estrés (Opcional)

Genera múltiples cuestionarios seguidos:

1. Genera cuestionario con 10 preguntas
2. Genera cuestionario con 20 preguntas
3. Genera cuestionario con 30 preguntas

**Cada generación debe:**
- ✅ Completarse en ~3-10 segundos
- ✅ Devolver el número correcto de preguntas
- ✅ NO hacer timeout ni dar error

---

## ✅ Checklist Final

Marca cada item cuando esté verificado:

- [ ] El archivo `index.tsx` ya NO existe
- [ ] El archivo `index.ts` existe y está desplegado
- [ ] Health check devuelve `{"status":"ok"}`
- [ ] El endpoint de IA responde correctamente vía curl
- [ ] Login funciona desde la aplicación web
- [ ] El diálogo "Generador IA" se abre correctamente
- [ ] La generación de preguntas funciona (3-5 segundos)
- [ ] Se muestran las preguntas generadas en la interfaz
- [ ] Las variables de entorno están configuradas
- [ ] Los logs NO muestran errores 504/403

**Si todos los items están marcados: ✅ LA SOLUCIÓN FUE EXITOSA**

---

## ❌ Si algo falla

### Error: "Gemini API key not configured"
**Solución:** Agrega `GEMINI_API_KEY` en Dashboard → Settings → Edge Functions → Secrets

### Error: "Failed to fetch" o timeout
**Solución:** Verifica que el archivo sea `index.ts` (NO `index.tsx`) y redespliega

### Error: 401 Unauthorized
**Solución:** Verifica que estés usando un token válido (demo o real)

### Error: "No se pudieron generar preguntas"
**Solución:** 
1. Verifica que el texto tenga al menos 50 caracteres
2. Verifica la clave de Gemini API
3. Revisa los logs en el Dashboard

---

## 📞 Soporte

Si después de verificar todos los puntos el problema persiste:

1. **Revisa los logs** en Dashboard → Edge Functions → server → Logs
2. **Captura el error** exacto que aparece
3. **Verifica** que el archivo sea definitivamente `.ts` y no `.tsx`
4. **Confirma** que el despliegue fue exitoso (badge verde)

---

**Última actualización:** Sábado, 8 de noviembre de 2025
**Versión de la solución:** 1.0
**Tiempo estimado de verificación:** 5-10 minutos
