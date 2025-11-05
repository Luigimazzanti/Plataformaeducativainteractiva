# ✅ Verificación Rápida del Estado de EduConnect

## 🎯 Checklist de 2 Minutos

### 1. ¿La aplicación carga?
- [ ] Sí → Continúa
- [ ] No → Recarga la página (Ctrl+R)

### 2. ¿Puedes hacer login?
- [ ] Sí → Continúa
- [ ] No → Usa credenciales demo:
  - Profesor: `teacher@demo.com` / `demo123`
  - Estudiante: `student@demo.com` / `demo123`

### 3. ¿En qué modo estás?

**Abre la Consola del Navegador (F12)** y busca:

```
[EduConnect] ✅ Servidor disponible - Todas las funciones activas
```
- ✅ **Ves este mensaje** → **Modo Servidor (Todo funciona)**

```
[EduConnect] ⚠️ Servidor no disponible
[EduConnect] Activando modo demo (sin IA ni subida de archivos)
```
- ⚠️ **Ves este mensaje** → **Modo Demo (Funcionalidad limitada)**

### 4. ¿Necesitas la IA?

**SI ESTÁS EN MODO SERVIDOR:**
1. Ve a "Dashboard del Profesor"
2. Click en "✨ Crear con IA"
3. Deberías ver: "✅ Servidor conectado - La generación con IA está disponible"
4. Si funciona → ✅ Todo perfecto

**SI ESTÁS EN MODO DEMO:**
1. Necesitas desplegar el Edge Function
2. Ver `DESPLIEGUE_EDGE_FUNCTION.md`

## 🚨 Problemas Comunes y Soluciones Rápidas

| Problema | Solución Rápida |
|----------|----------------|
| Error 403 al desplegar | ✅ **Ignóralo** si la app ya funciona |
| "Modo demo" todo el tiempo | Despliega Edge Function manualmente |
| IA no disponible | Verifica `OPENAI_API_KEY` en Supabase Secrets |
| No puedo subir archivos | Estás en modo demo, despliega Edge Function |
| Login no funciona | Usa credenciales demo (arriba) |

## 🔍 Verificación Manual del Servidor

**Método 1: Desde el navegador**

Abre esta URL en una nueva pestaña:
```
https://TU-PROYECTO-ID.supabase.co/functions/v1/make-server-05c2b65f/health
```

Reemplaza `TU-PROYECTO-ID` con tu ID real de Supabase.

**Resultado esperado:**
```json
{"status":"ok"}
```

- ✅ Ves esto → Servidor funcionando
- ❌ Error 404/403 → Servidor no desplegado
- ❌ Sin respuesta → Problema de red

**Método 2: Desde la consola del navegador**

Pega esto en la consola (F12):
```javascript
fetch('https://TU-PROYECTO-ID.supabase.co/functions/v1/make-server-05c2b65f/health')
  .then(r => r.json())
  .then(data => console.log('✅ Servidor OK:', data))
  .catch(err => console.error('❌ Servidor NO disponible:', err))
```

## 🎨 Estados Visuales en la App

### Modo Servidor ✅
- **Dashboard**: Colores vibrantes (verde #84cc16, azul #3b82f6)
- **Botón IA**: "✨ Crear con IA" habilitado
- **Diálogo IA**: Alerta verde "Servidor conectado"
- **Subida de archivos**: Funciona normalmente

### Modo Demo 💾
- **Dashboard**: Funciona normal (datos locales)
- **Botón IA**: Visible pero puede no funcionar
- **Diálogo IA**: Alerta roja "Servidor no disponible"
- **Subida de archivos**: Muestra URL de placeholder

## 📊 Tabla de Funcionalidades por Modo

| Funcionalidad | Modo Servidor | Modo Demo |
|--------------|---------------|-----------|
| Login/Signup | ✅ Real | ✅ Local |
| Crear tareas | ✅ BD Real | ✅ localStorage |
| Asignar tareas | ✅ BD Real | ✅ localStorage |
| Ver calificaciones | ✅ BD Real | ✅ localStorage |
| Subir archivos | ✅ Supabase Storage | ❌ Placeholder |
| IA - Generar tareas | ✅ OpenAI | ❌ No disponible |
| IA - Analizar PDFs | ✅ OpenAI | ❌ No disponible |
| IA - Analizar imágenes | ✅ GPT-4o | ❌ No disponible |
| Cambiar avatar | ✅ Guardado | ✅ localStorage |
| Multilingüe | ✅ Sí | ✅ Sí |
| Tema día/noche | ✅ Sí | ✅ Sí |

## ⚡ Solución Ultra-Rápida

**Si algo no funciona:**

```bash
# 1. Recarga la página
Ctrl+R (Windows/Linux) o Cmd+R (Mac)

# 2. Borra caché del navegador
Ctrl+Shift+Delete → Borrar todo

# 3. Prueba en modo incógnito
Ctrl+Shift+N (Chrome) o Ctrl+Shift+P (Firefox)
```

**Si NADA funciona:**
1. Cierra todas las pestañas de la app
2. Abre la consola del navegador (F12)
3. Escribe: `localStorage.clear()`
4. Presiona Enter
5. Recarga la página
6. Haz login de nuevo

## 🆘 Ayuda Adicional

- **Error 403**: Ver `DESPLIEGUE_EDGE_FUNCTION.md`
- **IA no funciona**: Ver `SOLUCION_IA.md`
- **Guía completa**: Ver `COMO_USAR.md`

## ✅ Todo está bien si...

1. ✅ Puedes hacer login
2. ✅ Ves el dashboard
3. ✅ Puedes crear tareas
4. ✅ Puedes asignar estudiantes
5. ✅ Los cambios se guardan

**La IA es opcional** - Si no la necesitas, la app funciona perfectamente sin ella.

---

💡 **Tip Pro**: La app está diseñada para funcionar sin servidor como respaldo. El "modo demo" no es un error, es una característica para que siempre puedas trabajar.
