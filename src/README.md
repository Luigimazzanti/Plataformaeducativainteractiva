# EduConnect - Plataforma Educativa

Plataforma educativa donde profesores pueden conectar con estudiantes, crear tareas, subir materiales y gestionar calificaciones.

## 🚀 Características

- **Multi-rol**: Admin, Profesor, Estudiante
- **Gestión de Tareas**: Crear, asignar, calificar
- **Materiales**: Subir archivos, videos, PDFs
- **Formularios**: Creador interactivo de formularios
- **Calificaciones**: Sistema completo de notas
- **Multilingüe**: Español, Inglés, Italiano, Alemán, Francés
- **Tema Día/Noche**: Modo claro y oscuro
- **Avatares**: Personalizables

## 👤 Credenciales de Acceso

### Admin
- Usuario: `admin`
- Contraseña: `EduConnect@Admin2024`

### Profesor Demo
- Email: `teacher@demo.com`
- Contraseña: `demo123`

### Estudiante Demo
- Email: `student@demo.com`
- Contraseña: `demo123`

## 🎨 Colores

- Verde: `#84cc16`
- Azul: `#3b82f6`

## 🔧 Funcionamiento

La aplicación funciona en dos modos de forma automática:

1. **Modo Servidor (Completo)** ✅
   - Requiere Supabase configurado
   - Base de datos real
   - Generación de tareas con IA (OpenAI)
   - Subida de archivos
   - Todas las funcionalidades

2. **Modo Demo (Local)** 💾
   - Activación automática si el servidor no responde
   - Datos guardados en `localStorage` del navegador
   - Funcionalidad básica (login, tareas, gestión)
   - **Sin IA ni subida de archivos**

El cambio entre modos es **automático y transparente**.

## ⚠️ Solución de Problemas

### Error 403 al Desplegar
Si ves un error 403 al desplegar:
- ✅ **Es normal** - Limitación de permisos de despliegue automático
- ✅ **Si la app funciona, ignora el error** - El Edge Function ya está desplegado
- Ver `DESPLIEGUE_EDGE_FUNCTION.md` para despliegue manual si es necesario

### La IA no funciona
Si la generación con IA no está disponible:
- Verifica que veas el mensaje "✅ Servidor conectado" en el diálogo de IA
- Asegúrate de que el Edge Function esté desplegado
- Verifica que `OPENAI_API_KEY` esté configurada en Supabase
- Ver `SOLUCION_IA.md` para guía completa

### La app está en "modo demo"
Si siempre está en modo demo:
- El servidor no está respondiendo o no está desplegado
- Abre la consola del navegador (F12) y busca logs `[EduConnect]`
- Verifica el Edge Function manualmente: `https://TU-PROYECTO.supabase.co/functions/v1/make-server-05c2b65f/health`
- Ver `DESPLIEGUE_EDGE_FUNCTION.md` para despliegue manual

## 📚 Documentación

- `COMO_USAR.md` - Guía completa de uso
- `ESTADO_ACTUAL.md` - Estado y características actuales
- `SOLUCION_IA.md` - Solución de problemas con IA
- `DESPLIEGUE_EDGE_FUNCTION.md` - Despliegue manual del servidor
- `AI_TASK_CREATION_GUIDE.md` - Guía de creación de tareas con IA
- `PDF_EDITOR_GUIDE.md` - Guía del editor de PDFs

## 📝 Notas Importantes

- El Edge Function solo necesita desplegarse **una vez**
- El modo demo es una característica, no un error
- Para IA, necesitas créditos en tu cuenta de OpenAI
- Los datos en modo local se guardan en `localStorage` del navegador
