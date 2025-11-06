# 🚀 Inicio Rápido - EduConnect

## ¡Bienvenido a EduConnect!

Esta guía te ayudará a empezar a usar la plataforma en **menos de 2 minutos**.

## ✅ La App Está 100% Funcional

**No necesitas configurar nada para empezar a usar EduConnect.**

La aplicación funciona en dos modos automáticamente:

### 🌐 Modo Servidor (Completo)
- **Con servidor configurado** → Todas las funcionalidades
- Incluye: IA, subida de archivos, almacenamiento real

### 💾 Modo Demo (Local)  
- **Sin servidor configurado** → Funcionalidad básica
- Incluye: Login, tareas, calificaciones, gestión de usuarios
- Datos guardados en tu navegador

**La app detecta automáticamente qué modo usar.**

## 🎯 Paso 1: Iniciar Sesión

### Credenciales de Prueba

Usa cualquiera de estas cuentas para probar:

**👨‍💼 Administrador**
```
Usuario: admin
Contraseña: EduConnect@Admin2024
```
Puede: Gestionar usuarios, asignar profesores a estudiantes, bloquear perfiles

**👨‍🏫 Profesor**
```
Email: teacher@demo.com
Contraseña: demo123
```
Puede: Crear tareas, asignar estudiantes, calificar, subir materiales, usar IA

**👨‍🎓 Estudiante**
```
Email: student@demo.com
Contraseña: demo123
```
Puede: Ver tareas, entregar trabajos, ver calificaciones, acceder a materiales

## 📊 Paso 2: Explorar el Dashboard

### Como Profesor:

1. **"Mis Estudiantes"** → Ver estudiantes asignados
2. **"Tareas"** → Crear y gestionar tareas
3. **"✨ Crear con IA"** → Generar tareas automáticamente (requiere servidor)
4. **"Materiales"** → Subir archivos, videos, notas
5. **"Calificaciones"** → Ver progreso de estudiantes

### Como Estudiante:

1. **"Tareas"** → Ver tareas pendientes y completadas
2. **"Materiales"** → Acceder a recursos del profesor
3. **"Mis Entregas"** → Ver trabajos enviados y calificaciones

### Como Admin:

1. **"Usuarios"** → Ver todos los usuarios
2. **"Asignar Profesores"** → Conectar profesores con estudiantes
3. **Gestionar Perfiles** → Eliminar o bloquear usuarios

## 🤖 Paso 3: Probar la IA (Opcional)

### ¿La IA está disponible?

1. Inicia sesión como **Profesor**
2. Haz clic en **"✨ Crear con IA"**
3. Observa el mensaje:

**✅ Alerta VERDE = IA Disponible**
```
✅ Servidor conectado - La generación con IA está disponible
```
→ Puedes crear tareas con IA

**❌ Alerta ROJA = IA No Disponible**
```
⚠️ La generación con IA no está disponible
```
→ Necesitas configurar el servidor (ver abajo)

### Crear una Tarea con IA (si está disponible):

1. **Selecciona el tipo de contenido:**
   - Texto (pega un capítulo, artículo, etc.)
   - PDF (sube un documento)
   - Imagen (sube una infografía, diagrama)
   - Video (URL de YouTube, Vimeo)

2. **Configura la generación:**
   - Nivel de español: A1-A2 (Básico), B1-B2 (Intermedio), C1-C2 (Avanzado)
   - Dificultad: Fácil, Normal, Difícil

3. **Genera y revisa:**
   - Haz clic en "Generar Tarea"
   - Espera 5-10 segundos
   - Revisa las preguntas generadas
   - Edita si es necesario

4. **Crea el PDF y asigna:**
   - Haz clic en "Generar PDF y Asignar"
   - La tarea se creará automáticamente

## 🎨 Paso 4: Personalizar

### Cambiar Idioma
- Icono del globo en la esquina superior → Selecciona tu idioma
- 5 idiomas disponibles: Español, Inglés, Italiano, Alemán, Francés

### Cambiar Tema
- Botón sol/luna en el header → Cambia entre claro y oscuro

### Cambiar Avatar
- Icono de usuario → Configuración → Selector de avatares

## 📝 Funcionalidades Principales

### ✅ Funciona Siempre (Con o Sin Servidor)

| Funcionalidad | Profesor | Estudiante | Admin |
|--------------|----------|------------|-------|
| Crear tareas manualmente | ✅ | - | - |
| Asignar tareas | ✅ | - | - |
| Ver tareas | ✅ | ✅ | ✅ |
| Entregar tareas | - | ✅ | - |
| Calificar | ✅ | - | - |
| Ver calificaciones | ✅ | ✅ | ✅ |
| Gestión de usuarios | - | - | ✅ |
| Materiales (crear/ver) | ✅ | ✅ | - |

### ⚡ Requiere Servidor Configurado

| Funcionalidad | Requiere |
|--------------|----------|
| **Crear tareas con IA** | Servidor + OPENAI_API_KEY |
| **Subir archivos reales** | Servidor |
| **Almacenamiento en base de datos** | Servidor |

## 🔧 Activar el Servidor (Para IA y Archivos)

### ¿Por qué configurar el servidor?

**Sin servidor:**
- ✅ Funcionalidad básica completa
- ❌ Sin IA para crear tareas
- ❌ Sin subida real de archivos
- 💾 Datos guardados en navegador

**Con servidor:**
- ✅ **TODO** lo anterior +
- ✅ **IA para crear tareas automáticamente**
- ✅ **Subida real de archivos**
- ☁️ **Datos en la nube (Supabase)**

### Configuración Rápida (5 minutos):

1. **Desplegar el Edge Function:**
   ```
   supabase functions deploy make-server-05c2b65f
   ```
   Ver: `DESPLIEGUE_EDGE_FUNCTION.md` para detalles

2. **Configurar OpenAI (para IA):**
   - Ve a https://platform.openai.com/api-keys
   - Crea una API key
   - En Supabase: Settings → Secrets
   - Agrega: `OPENAI_API_KEY` = tu-clave

3. **Recarga la app**
   - Ctrl+R o Cmd+R
   - Verás: "✅ Servidor disponible"

## ❓ Preguntas Frecuentes

### ¿Necesito configurar algo para empezar?
**No.** La app funciona inmediatamente en modo demo.

### ¿Cómo sé en qué modo estoy?
Abre la consola (F12) y busca `[EduConnect]`:
- `✅ Servidor disponible` = Modo servidor
- `⚠️ Servidor no disponible` = Modo demo

### ¿Los datos se guardan?
- **Modo demo:** En tu navegador (localStorage)
- **Modo servidor:** En la base de datos de Supabase

### ¿Puedo usar la app sin IA?
**Sí.** Todas las funcionalidades básicas funcionan sin IA. Solo la generación automática de tareas requiere IA.

### ¿Cuánto cuesta la IA?
- Requiere cuenta de OpenAI con créditos
- ~$0.001-$0.01 por tarea generada
- Muy económico para uso educativo

### ¿Cómo creo una cuenta real?
1. Ve a la pestaña "Registro"
2. Llena el formulario
3. Selecciona rol (Profesor o Estudiante)
4. ¡Listo! Tu cuenta se crea automáticamente

## 📚 Documentación Completa

Para más detalles, consulta:

- `VERIFICACION_FINAL.md` → Checklist completo de funcionalidades
- `COMO_USAR.md` → Guía detallada de todas las características
- `SOLUCION_IA.md` → Solución de problemas con IA
- `AI_TASK_CREATION_GUIDE.md` → Guía completa de IA

## 🎉 ¡Listo!

**Ya puedes empezar a usar EduConnect.**

1. ✅ Inicia sesión con las credenciales de prueba
2. 🎯 Explora el dashboard
3. 📝 Crea tareas o entregas trabajos
4. 🤖 Prueba la IA (si el servidor está configurado)
5. 🎨 Personaliza la interfaz

**¿Necesitas ayuda?**
- Revisa `README.md` para visión general
- Consulta `COMO_USAR.md` para guías detalladas
- Ve `SOLUCION_IA.md` si la IA no funciona

---

**¡Bienvenido a EduConnect - La plataforma educativa del futuro!** 🎓✨
