# 🔍 Verificación Rápida del Servidor

## Pruebas para verificar que el servidor funciona correctamente

### 1️⃣ Health Check (Básico)

**URL:**
```
https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/health
```

**Respuesta esperada:**
```json
{"status":"ok"}
```

**Qué significa:**
- ✅ El servidor está desplegado y funcionando
- ✅ Los usuarios demo se inicializaron correctamente
- ✅ El KV store está conectado

---

### 2️⃣ Test de Login (Demo User)

Abre la consola del navegador (F12) y ejecuta:

```javascript
fetch('https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'teacher@demo.com',
    password: 'demo123'
  })
})
.then(r => r.json())
.then(data => console.log('Login exitoso:', data))
.catch(err => console.error('Error:', err));
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

### 3️⃣ Test del Generador de IA

**Pre-requisito:** Primero obtén un token de login (usa el test anterior)

```javascript
const token = 'demo_token_demo-teacher-1'; // Usar el token del test anterior

fetch('https://ldhimtgexjbmwobkmcwr.supabase.co/functions/v1/server/make-server-05c2b65f/ai/generate-questions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    text: 'La fotosíntesis es el proceso mediante el cual las plantas verdes producen glucosa a partir de dióxido de carbono y agua, utilizando la luz solar. Este proceso ocurre en los cloroplastos. Las plantas liberan oxígeno como subproducto.',
    maxQuestions: 5,
    includeCompletarBlancos: true
  })
})
.then(r => r.json())
.then(data => console.log('Preguntas generadas:', data))
.catch(err => console.error('Error:', err));
```

**Respuesta esperada:**
```json
{
  "questions": [
    {
      "id": "q-...",
      "pregunta": "¿Qué es la fotosíntesis?",
      "respuesta": "Es el proceso mediante el cual las plantas verdes producen glucosa...",
      "tipo": "definicion"
    },
    // ... más preguntas
  ],
  "metadata": {
    "generatedBy": "Gemini AI",
    "generatedAt": "2024-11-08T...",
    "textLength": 234,
    "questionCount": 5
  }
}
```

---

### 4️⃣ Verificar Variables de Entorno

Si el generador de IA falla, verifica las variables:

**Error esperado si falta GEMINI_API_KEY:**
```json
{
  "error": "La clave de API de Gemini no está configurada"
}
```

**Solución:**
1. Ve a Functions → server → Secrets
2. Agrega `GEMINI_API_KEY` con tu clave de https://aistudio.google.com/apikey

---

## 📊 Tabla de Diagnóstico

| Test | Estado | Solución si falla |
|------|--------|-------------------|
| Health Check | ❓ | Desplegar el servidor |
| Login Demo | ❓ | Verificar SB_URL y SB_SERVICE_KEY |
| Generador IA | ❓ | Verificar GEMINI_API_KEY |

---

## 🎯 Checklist de Verificación

- [ ] Health check responde `{"status":"ok"}`
- [ ] Login devuelve un token válido
- [ ] Generador de IA devuelve preguntas
- [ ] No hay errores en los logs del servidor
- [ ] La aplicación frontend se conecta sin errores

---

## 🔥 Troubleshooting Rápido

### Error 404 - "Function not found"
→ El servidor NO está desplegado. Sigue las instrucciones de `FIX_ERROR_DESCONOCIDO_APLICADO.md`

### Error 500 - "Server error"
→ Hay un problema con las variables de entorno. Verifica:
- `SB_URL` = `https://ldhimtgexjbmwobkmcwr.supabase.co`
- `SB_SERVICE_KEY` = (tu service_role key)
- `GEMINI_API_KEY` = (tu API key de Gemini)

### Error 401 - "Unauthorized"
→ El token no es válido. Usa el login demo para obtener uno nuevo.

### Error 403 - "Forbidden"
→ CORS no está configurado. El servidor debe tener:
```typescript
cors({ origin: "*", ... })
```

---

## 🚀 Siguiente Paso

Una vez que todos los tests pasen:

1. **Recarga la aplicación** (Ctrl+Shift+R)
2. **Inicia sesión** con teacher@demo.com / demo123
3. **Crea una tarea** y prueba el generador de preguntas
4. **Verifica que todo funciona** ✅

---

**Última actualización:** Noviembre 8, 2024
