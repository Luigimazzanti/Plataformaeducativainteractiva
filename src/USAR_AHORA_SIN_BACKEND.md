# 🚀 CÓMO USAR EDUCONNECT AHORA (SIN DESPLEGAR BACKEND)

## ✅ LA APLICACIÓN FUNCIONA EN MODO DEMO

EduConnect tiene un **sistema de modo demo completo** que funciona sin necesidad de backend desplegado.

---

## 📝 CREDENCIALES DE PRUEBA

### 👨‍🏫 Profesor (Teacher)
```
Email:    teacher@demo.com
Password: demo123
```

### 👨‍🎓 Estudiante 1 (Student)
```
Email:    student@demo.com
Password: demo123
```

### 👨‍🎓 Estudiante 2 (Student)
```
Email:    student2@demo.com
Password: demo123
```

### 👑 Administrador (Admin)
```
Usuario:  admin
Password: EduConnect@Admin2024
```

---

## 🔧 PASOS PARA USAR LA APLICACIÓN AHORA

### 1️⃣ LIMPIAR CACHÉ Y RECARGAR

#### Windows:
```
1. Presiona F12 para abrir DevTools
2. Click derecho en el botón de recargar (🔄)
3. Selecciona "Vaciar caché y volver a cargar la página"
```

#### Mac:
```
1. Presiona Cmd + Option + I para abrir DevTools
2. Presiona Cmd + Shift + R para recargar con caché limpio
```

#### Método Universal:
```
1. Abre la consola del navegador (F12 en Windows, Cmd+Option+I en Mac)
2. Escribe esto y presiona Enter:
   
   localStorage.clear(); location.reload();
```

---

### 2️⃣ ESPERAR A QUE CARGUE

Verás un spinner de carga mientras la app:
- ✅ Intenta conectar con el backend (fallará, es normal)
- ✅ Activa el modo demo automáticamente
- ✅ Muestra la pantalla de login

**Tiempo esperado:** 5-7 segundos

---

### 3️⃣ INICIAR SESIÓN

1. **Introduce las credenciales** (ejemplo: `teacher@demo.com` / `demo123`)
2. **Click en "Iniciar Sesión"**
3. **¡Listo!** Entrarás al dashboard

---

## ⚠️ SI EL LOGIN NO FUNCIONA

### Problema: "No se conecta" o "Infinito loading"

**Solución:**
```javascript
// Abre la consola (F12) y ejecuta:
localStorage.setItem('educonnect_demo_mode', 'true');
location.reload();
```

---

### Problema: "Credenciales incorrectas"

**Verifica que estés usando:**
- ✅ `teacher@demo.com` (NO `teacher` solo)
- ✅ `demo123` (minúsculas, sin espacios)

---

### Problema: "La página no carga"

**Solución completa:**
```javascript
// Abre la consola (F12) y ejecuta ESTO:
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('educonnect');
location.reload();
```

---

## 🎯 QUÉ PUEDES HACER EN MODO DEMO

### ✅ FUNCIONALIDADES DISPONIBLES:

- ✅ **Login/Logout** con diferentes roles
- ✅ **Crear tareas** (formulario manual completo)
- ✅ **Asignar tareas** a estudiantes
- ✅ **Ver tareas** como estudiante
- ✅ **Entregar tareas** (con datos demo)
- ✅ **Calificar tareas** como profesor
- ✅ **Ver calificaciones** como estudiante
- ✅ **Panel de admin** (asignar profesores, etc.)
- ✅ **Cambiar idioma** (5 idiomas disponibles)
- ✅ **Cambiar tema** (claro/oscuro)
- ✅ **Personalizar avatar**
- ✅ **Crear formularios interactivos**
- ✅ **Ver estadísticas**

### ❌ FUNCIONALIDADES NO DISPONIBLES (Requieren backend):

- ❌ **Subida de archivos** (PDF, imágenes, videos)
- ❌ **Generación con IA** (ya eliminada)
- ❌ **Almacenamiento persistente** (los datos se borran al recargar)
- ❌ **Crear cuentas nuevas** (solo cuentas demo pre-creadas)

---

## 📊 VERIFICAR QUE MODO DEMO ESTÁ ACTIVO

Abre la consola del navegador (F12) y busca estos mensajes:

```
[EduConnect] ⚠️ Servidor no disponible: Failed to fetch
[EduConnect] Activando modo demo (sin IA ni subida de archivos)
[Login] 🔧 Backend no disponible, activando modo demo...
[Login] ✅ Modo demo activado, usuario autenticado
```

Si ves estos mensajes, **¡todo está funcionando correctamente!**

---

## 🚀 FLUJO TÍPICO DE USO (MODO DEMO)

### Como Profesor:

1. **Login:** `teacher@demo.com` / `demo123`
2. **Dashboard:** Verás 0 tareas inicialmente
3. **Crear tarea:** Click en "Nueva Tarea"
   - Título: "Matemáticas - Ecuaciones"
   - Descripción: "Resolver ecuaciones de segundo grado"
   - Fecha límite: Cualquier fecha futura
   - Click en "Crear"
4. **Asignar tarea:** 
   - Click en los tres puntos (...) de la tarea
   - "Asignar a estudiantes"
   - Selecciona "Demo Student"
   - Click en "Asignar"
5. **Ver estudiantes:** Click en "Mis Estudiantes" en el menú
6. **Calificar:** Cuando un estudiante entregue, podrás calificar

### Como Estudiante:

1. **Login:** `student@demo.com` / `demo123`
2. **Dashboard:** Verás tareas asignadas por el profesor
3. **Ver tarea:** Click en una tarea
4. **Entregar:** Click en "Entregar tarea"
   - Escribe tu respuesta
   - Click en "Enviar"
5. **Ver nota:** Una vez calificada, aparecerá tu nota

### Como Admin:

1. **Login:** `admin` / `EduConnect@Admin2024`
2. **Dashboard:** Verás todos los usuarios
3. **Asignar estudiantes:** 
   - Busca un estudiante
   - Click en "Asignar a profesor"
   - Selecciona el profesor
4. **Gestionar usuarios:** Bloquear, eliminar, etc.

---

## 🔍 DEBUGGING

### Ver logs en la consola:

```javascript
// Abre DevTools (F12) y ve a la pestaña "Console"
// Deberías ver logs como:
[EduConnect] Build Version: 9.2.0-NUCLEAR-URL-FIXED-20241107
[EduConnect] ⚠️ Servidor no disponible
[Login] 🔧 Backend no disponible, activando modo demo...
[Login] ✅ Modo demo activado, usuario autenticado
```

### Ver datos en localStorage:

```javascript
// En la consola, ejecuta:
console.log('Token:', localStorage.getItem('educonnect_token'));
console.log('User ID:', localStorage.getItem('educonnect_user_id'));
console.log('Demo Mode:', localStorage.getItem('educonnect_demo_mode'));
```

---

## ⚡ SOLUCIÓN RÁPIDA TODO-EN-UNO

Si nada funciona, **copia y pega esto en la consola**:

```javascript
// RESET COMPLETO
console.clear();
localStorage.clear();
sessionStorage.clear();

// ACTIVAR MODO DEMO
localStorage.setItem('educonnect_demo_mode', 'true');

// RECARGAR
console.log('✅ Recargando en modo demo...');
setTimeout(() => location.reload(), 500);
```

---

## 📞 SIGUIENTE PASO: DESPLEGAR BACKEND

Si quieres las funcionalidades completas (subida de archivos, almacenamiento persistente), necesitas desplegar el backend:

```bash
npx supabase functions deploy server --project-ref ldhimtgexjbmwobkmcwr
```

**Nota:** Requiere tener instalado el CLI de Supabase y estar autenticado.

---

## ✅ RESUMEN

| Acción | Comando/Credenciales |
|--------|---------------------|
| **Limpiar todo** | `localStorage.clear(); location.reload();` |
| **Login Profesor** | `teacher@demo.com` / `demo123` |
| **Login Estudiante** | `student@demo.com` / `demo123` |
| **Login Admin** | `admin` / `EduConnect@Admin2024` |
| **Forzar Demo** | `localStorage.setItem('educonnect_demo_mode', 'true');` |

---

## 🎉 ¡LISTO PARA USAR!

Con estos pasos, EduConnect funcionará perfectamente en modo demo. Todas las funcionalidades principales están disponibles para probar y demostrar la plataforma.

**¿Problemas?** Revisa la consola del navegador (F12) para ver mensajes de error específicos.
