# ✅ TU SUPABASE YA ESTÁ CONFIGURADO

## 🎯 SOLO HAZ ESTO (2 MINUTOS)

### PASO 1: Verifica los buckets (1 min)

1. Ve a: https://supabase.com/dashboard
2. Abre tu proyecto
3. Click en: **Storage**
4. Verifica que tengas estos 4 buckets:
   - ✅ `assignments`
   - ✅ `submissions`
   - ✅ `notes`
   - ✅ `avatars`

**¿Faltan buckets?** Créalos (público ✅)  
**¿Ya están todos?** Perfecto, siguiente paso

---

### PASO 2: Crea usuarios (3 min) - SOLO SI NO EXISTEN

1. Click en: **Authentication**
2. **¿Ya existe `teacher@test.com`?** → Salta al PASO 3
3. **¿No existe?** → Créalo:
   - Email: `teacher@test.com`
   - Password: `test123456`
   - Copia el ID
   - Ve a SQL Editor
   - Pega esto (cambia el ID):
   
```sql
INSERT INTO profiles (id, email, name, role, created_at)
VALUES ('PEGA_EL_ID_AQUI', 'teacher@test.com', 'Profesor Test', 'teacher', NOW())
ON CONFLICT (id) DO NOTHING;
```

4. Repite con `student@test.com` y conecta al profesor:

```sql
INSERT INTO profiles (id, email, name, role, created_at)
VALUES ('PEGA_EL_ID_ESTUDIANTE', 'student@test.com', 'Estudiante Test', 'student', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_teachers (student_id, teacher_id, created_at)
VALUES ('PEGA_EL_ID_ESTUDIANTE', 'PEGA_EL_ID_PROFESOR', NOW())
ON CONFLICT DO NOTHING;
```

---

### PASO 3: Limpia localStorage (30 segundos)

1. **Abre tu app**
2. **Presiona F12** (abre consola)
3. **Pega esto:**

```javascript
localStorage.clear();
location.reload();
```

4. **Presiona Enter**

---

### PASO 4: Login (30 segundos)

1. La página recarga
2. Login con: `teacher@test.com / test123456`
3. **¿Entras sin banner rojo?** ✅ ¡LISTO!
4. **¿Sigue el banner?** → Lee abajo

---

## 🆘 SI EL BANNER ROJO PERSISTE

### Opción A: Verifica el proyecto

1. Ve a tu dashboard de Supabase
2. **¿Dice "Paused"?** → Actívalo
3. **¿Está activo?** → Siguiente opción

### Opción B: Fuerza la reconexión

Ejecuta esto en la consola (F12):

```javascript
// Limpia TODO y fuerza reconexión
localStorage.clear();
sessionStorage.clear();
console.log('✅ Limpieza completa');

// Verifica la conexión a Supabase
fetch('https://cqpeyzmygcraupjjomfg.supabase.co/auth/v1/health', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcGV5em15Z2NyYXVwampvbWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODQ1ODUsImV4cCI6MjA3ODI2MDU4NX0.EjByo5rR50IVYHeJrfgSb7brPxGbtyBtW0XZqY7j7wk'
  }
})
.then(r => r.json())
.then(d => {
  console.log('✅ Supabase responde:', d);
  console.log('🔄 Recargando...');
  location.reload();
})
.catch(e => console.error('❌ Error:', e));
```

---

## 📝 RESUMEN

```
✅ Tus tablas YA ESTÁN creadas
✅ Tus políticas YA EXISTEN
✅ Tu RLS YA ESTÁ habilitado

❌ NO ejecutes los scripts SQL de nuevo
❌ NO crees las tablas otra vez

✅ SOLO limpia localStorage
✅ SOLO verifica usuarios
✅ SOLO verifica buckets
```

---

## 🎁 CREDENCIALES

```
teacher@test.com / test123456
student@test.com / test123456
```

---

**¿Listo? Empieza con PASO 1** ⬆️
