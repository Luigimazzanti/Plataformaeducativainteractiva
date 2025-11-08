# 🚀 EMPEZAR AQUÍ - EDUCONNECT

## ⚡ INICIO RÁPIDO (30 SEGUNDOS)

### 1. Abre la consola del navegador

**Windows:** Presiona `F12`  
**Mac:** Presiona `Cmd + Option + I`

### 2. Copia y pega esto:

```javascript
localStorage.clear(); localStorage.setItem('educonnect_demo_mode', 'true'); location.reload();
```

### 3. Presiona `Enter`

La página se recargará automáticamente.

### 4. Espera 5-7 segundos

Verás un spinner. Es normal. Solo espera.

### 5. Haz login:

- **Email:** `teacher@demo.com`
- **Password:** `demo123`

### 6. ¡Listo! 🎉

Ya estás dentro del dashboard de profesor.

---

## 📚 SI QUIERES MÁS INFORMACIÓN

| Archivo | Qué contiene |
|---------|-------------|
| `/SOLUCION_LOGIN_PROBLEMA.md` | 🔴 **SI EL LOGIN NO FUNCIONA** - Lee esto primero |
| `/USAR_AHORA_SIN_BACKEND.md` | 📖 Guía completa de uso en modo demo |
| `/COMO_RECARGAR_PAGINA.md` | 🔄 Cómo limpiar caché en tu navegador |
| `/DIAGNOSTICO_RAPIDO.js` | 🔍 Script para diagnosticar problemas |

---

## 🎯 CREDENCIALES DISPONIBLES

| Rol | Email | Password |
|-----|-------|----------|
| **Profesor** | `teacher@demo.com` | `demo123` |
| **Estudiante 1** | `student@demo.com` | `demo123` |
| **Estudiante 2** | `student2@demo.com` | `demo123` |
| **Admin** | `admin` | `EduConnect@Admin2024` |

---

## ✅ QUÉ FUNCIONA EN MODO DEMO

- ✅ Login/Logout
- ✅ Crear tareas (formulario manual)
- ✅ Asignar tareas a estudiantes
- ✅ Entregar tareas
- ✅ Calificar tareas
- ✅ Ver estadísticas
- ✅ Panel de administrador
- ✅ Cambiar idioma (5 idiomas)
- ✅ Tema claro/oscuro
- ✅ Personalizar avatar
- ✅ Formularios interactivos

## ❌ QUÉ NO FUNCIONA (Requiere backend)

- ❌ Subir archivos (PDF, imágenes, videos)
- ❌ Crear cuentas nuevas
- ❌ Persistencia de datos (se borra al recargar)

---

## 🔧 SI ALGO NO FUNCIONA

### Opción 1: Reset rápido
```javascript
localStorage.clear(); location.reload();
```

### Opción 2: Forzar modo demo
```javascript
localStorage.setItem('educonnect_demo_mode', 'true'); location.reload();
```

### Opción 3: Lee la solución completa
**Archivo:** `/SOLUCION_LOGIN_PROBLEMA.md`

---

## 🌟 PRÓXIMOS PASOS

### Para usar la app completa (con backend):

1. **Instalar CLI de Supabase:**
   ```bash
   npm install -g supabase
   ```

2. **Autenticarse:**
   ```bash
   npx supabase login
   ```

3. **Desplegar backend:**
   ```bash
   npx supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
   ```

4. **Recargar la aplicación**

¡Ya tendrás todas las funcionalidades!

---

## 💡 TIP IMPORTANTE

**¿No sabes cómo abrir la consola del navegador?**

1. Click derecho en cualquier parte de la página
2. Selecciona "Inspeccionar" o "Inspect"
3. Busca la pestaña "Console" o "Consola"
4. ¡Listo!

---

## 🎉 ¡ESO ES TODO!

EduConnect está listo para usar. El modo demo tiene todas las funcionalidades principales.

**¿Problemas?** → Lee `/SOLUCION_LOGIN_PROBLEMA.md`

**¡Disfruta de EduConnect!** 🚀📚
