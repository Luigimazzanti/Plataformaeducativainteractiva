# 🚀 GUÍA DE CONFIGURACIÓN DE SUPABASE PARA EDUCONNECT

## ✅ PASO 1: Ejecutar el Schema SQL

1. **Abre tu proyecto de Supabase:**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto: `cqpeyzmygcraupjjomfg`

2. **Abre el SQL Editor:**
   - En el menú lateral, haz clic en **SQL Editor**
   - Haz clic en **New Query**

3. **Copia y pega el contenido de `/supabase-schema.sql`**
   - Abre el archivo `supabase-schema.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor de Supabase

4. **Ejecuta el script:**
   - Haz clic en el botón **Run** (▶️)
   - Espera a que se complete (debería decir "Success")

---

## ✅ PASO 2: Crear Storage Buckets

Los buckets son necesarios para almacenar archivos (PDFs, imágenes, videos).

1. **Ve a Storage en el dashboard:**
   - Menú lateral → **Storage**

2. **Crea 4 buckets:**

   ### Bucket 1: `assignments`
   - Haz clic en **New bucket**
   - Name: `assignments`
   - Public bucket: ✅ **Sí** (para que los estudiantes puedan descargar)
   - Haz clic en **Create bucket**

   ### Bucket 2: `submissions`
   - Name: `submissions`
   - Public bucket: ✅ **Sí**
   - Haz clic en **Create bucket**

   ### Bucket 3: `notes`
   - Name: `notes`
   - Public bucket: ✅ **Sí**
   - Haz clic en **Create bucket**

   ### Bucket 4: `avatars`
   - Name: `avatars`
   - Public bucket: ✅ **Sí**
   - Haz clic en **Create bucket**

---

## ✅ PASO 3: Configurar Políticas de Storage

Para cada bucket, necesitas configurar políticas de acceso:

### 📁 **Bucket: assignments**

1. Haz clic en el bucket `assignments`
2. Ve a la pestaña **Policies**
3. Haz clic en **New policy** → **For full customization**

**Política 1: Profesores pueden subir archivos**
```sql
CREATE POLICY "Teachers can upload assignments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);
```

**Política 2: Todos pueden leer archivos**
```sql
CREATE POLICY "Anyone can view assignments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignments');
```

### 📁 **Bucket: submissions**

**Política 1: Estudiantes pueden subir sus entregas**
```sql
CREATE POLICY "Students can upload submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Política 2: Profesores y el propio estudiante pueden ver**
```sql
CREATE POLICY "Teachers and own student can view submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  )
);
```

### 📁 **Bucket: notes**

**Política 1: Profesores pueden subir materiales**
```sql
CREATE POLICY "Teachers can upload notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notes'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);
```

**Política 2: Todos pueden leer materiales**
```sql
CREATE POLICY "Anyone can view notes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notes');
```

### 📁 **Bucket: avatars**

**Política 1: Usuarios pueden subir su propio avatar**
```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Política 2: Todos pueden ver avatares**
```sql
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
```

---

## ✅ PASO 4: Crear Usuarios de Prueba

1. **Ve a Authentication en el dashboard:**
   - Menú lateral → **Authentication** → **Users**

2. **Crea un profesor de prueba:**
   - Haz clic en **Add user** → **Create new user**
   - Email: `teacher@test.com`
   - Password: `test123456`
   - Haz clic en **Create user**

3. **Crea un estudiante de prueba:**
   - Email: `student@test.com`
   - Password: `test123456`

4. **Inserta sus perfiles en la base de datos:**
   - Ve a **SQL Editor** → **New query**
   - Copia el ID del usuario profesor (desde Authentication → Users)
   - Ejecuta:

```sql
-- Reemplaza 'USER_ID_AQUI' con el ID real del usuario
INSERT INTO profiles (id, email, name, role)
VALUES 
  ('USER_ID_PROFESOR', 'teacher@test.com', 'Profesor Demo', 'teacher'),
  ('USER_ID_ESTUDIANTE', 'student@test.com', 'Estudiante Demo', 'student');
```

---

## ✅ PASO 5: Verificar la Conexión

1. **Recarga la aplicación EduConnect**
2. **Intenta hacer login con:**
   - Email: `teacher@test.com`
   - Password: `test123456`

3. **Si funciona:** ✅ ¡Supabase está conectado!
4. **Si no funciona:** Verifica los pasos anteriores

---

## 🔧 TROUBLESHOOTING

### Error: "Failed to fetch"
- Verifica que el `projectId` en `/utils/supabase/info.tsx` sea correcto
- Verifica que el `publicAnonKey` sea correcto

### Error: "Row Level Security"
- Asegúrate de haber ejecutado TODO el script SQL
- Verifica que las políticas RLS estén habilitadas

### Los archivos no se suben
- Verifica que los buckets existan
- Verifica que las políticas de Storage estén configuradas

---

## 📊 RESUMEN DE CREDENCIALES

- **Project ID:** `cqpeyzmygcraupjjomfg`
- **Project URL:** `https://cqpeyzmygcraupjjomfg.supabase.co`
- **Anon Key:** Ya configurado en el código

---

## 🎉 ¡LISTO!

Una vez completados estos pasos, tu aplicación EduConnect estará usando Supabase en lugar del modo demo, lo que significa:

✅ **Sin límites de almacenamiento**  
✅ **Base de datos real PostgreSQL**  
✅ **Autenticación profesional**  
✅ **Subida de archivos ilimitada**  
✅ **Escalable para producción**  

¡Disfruta tu plataforma educativa! 🚀📚
