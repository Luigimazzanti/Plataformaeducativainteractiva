# 📚 Instrucciones para Configurar Supabase Storage

## ✅ **PASO 1: Crear el Bucket**

1. Ve a: https://supabase.com/dashboard/project/cqpeyzmygcraupjjomfg/storage/buckets
2. Haz clic en **"Create a new bucket"**
3. Configura:
   - **Name:** `assignment-files`
   - **Public bucket:** ✅ **ACTIVADO**
   - **File size limit:** 10 MB
4. Haz clic en **"Create bucket"**

---

## ✅ **PASO 2: Configurar Políticas de Acceso (RLS)**

### **Opción A: Configuración Manual (Recomendado)**

1. Haz clic en el bucket `assignment-files`
2. Ve a la pestaña **"Policies"**
3. Haz clic en **"New Policy"** y crea estas 3 políticas:

#### **Política 1: Permitir SUBIR archivos**
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assignment-files');
```

#### **Política 2: Permitir VER archivos**
```sql
CREATE POLICY "Allow public to view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assignment-files');
```

#### **Política 3: Permitir ELIMINAR archivos**
```sql
CREATE POLICY "Allow authenticated users to delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'assignment-files');
```

### **Opción B: Configuración con SQL Editor**

1. Ve a: https://supabase.com/dashboard/project/cqpeyzmygcraupjjomfg/sql/new
2. Pega y ejecuta este script completo:

```sql
-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-files', 'assignment-files', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Permitir subir archivos autenticados
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assignment-files');

-- Política: Permitir ver archivos públicamente
CREATE POLICY IF NOT EXISTS "Allow public to view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assignment-files');

-- Política: Permitir eliminar archivos autenticados
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'assignment-files');
```

---

## ✅ **PASO 3: Verificar la Configuración**

1. Ve a: https://supabase.com/dashboard/project/cqpeyzmygcraupjjomfg/storage/buckets/assignment-files
2. Deberías ver el bucket `assignment-files` con:
   - ✅ **Public:** Yes
   - ✅ **File size limit:** 10 MB
3. Ve a la pestaña **"Policies"** y verifica que existan las 3 políticas

---

## ✅ **PASO 4: Probar la Subida de Archivos**

1. En tu aplicación EduConnect, inicia sesión como **profesor**
2. Crea una nueva tarea y **sube un archivo PDF**
3. Verifica en la consola del navegador que aparezca:
   ```
   ✅ [Supabase Storage] Archivo subido
   ✅ [Supabase Storage] URL pública: https://...
   ```
4. Como **estudiante**, abre la tarea y verifica que el PDF se cargue correctamente

---

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### **Error: "new row violates row-level security policy"**
- **Causa:** Las políticas RLS no están configuradas correctamente
- **Solución:** Verifica que las 3 políticas estén creadas y activas

### **Error: "Bucket not found"**
- **Causa:** El bucket no existe o tiene un nombre diferente
- **Solución:** Verifica que el bucket se llame exactamente `assignment-files`

### **Error: "File too large"**
- **Causa:** El archivo excede el límite configurado
- **Solución:** Aumenta el límite en la configuración del bucket

### **Los archivos no se ven públicamente**
- **Causa:** El bucket no está configurado como público
- **Solución:** Edita el bucket y activa **"Public bucket"**

---

## 📌 **NOTAS IMPORTANTES**

- ✅ Los archivos se guardan con nombres únicos: `pdfs/{timestamp}-{randomId}.{extensión}`
- ✅ Las URLs son públicas y accesibles sin autenticación
- ✅ El sistema tiene un **fallback automático** a Data URLs si Supabase Storage falla
- ✅ Límite por defecto: **10 MB por archivo**
- ✅ Los archivos soportados son: PDF, PNG, JPG, DOCX, etc.

---

## 🚀 **PRÓXIMOS PASOS**

Una vez configurado el Storage, puedes:

1. ✅ Subir archivos PDF en tareas
2. ✅ Los estudiantes pueden ver y editar PDFs
3. ✅ Los profesores pueden calificar con anotaciones
4. ✅ Descargar PDFs con anotaciones

**¿Necesitas Edge Functions?** Por ahora NO son necesarias para Storage básico. El frontend maneja todo directamente con el cliente de Supabase.
