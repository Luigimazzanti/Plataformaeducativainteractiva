-- ═══════════════════════════════════════════════════════════════════════════
-- EDUCONNECT - CONFIGURACIÓN DE STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════
-- IMPORTANTE: Los buckets deben crearse desde el Dashboard de Supabase
-- Este script solo crea las POLÍTICAS de acceso para los buckets
-- 
-- PASO 1: Crea estos buckets manualmente desde Storage → New Bucket:
--   - assignments (público)
--   - submissions (público)
--   - notes (público)
--   - avatars (público)
--
-- PASO 2: Ejecuta este script en SQL Editor para crear las políticas
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- LIMPIAR POLÍTICAS ANTIGUAS (si existen)
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Teachers can upload assignments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view assignments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update own assignments" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own assignments" ON storage.objects;

DROP POLICY IF EXISTS "Students can upload submissions" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and own student can view submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view relevant submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students can update own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete own submissions" ON storage.objects;

DROP POLICY IF EXISTS "Teachers can upload notes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view notes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view notes" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update own notes" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own notes" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Public read access for all buckets" ON storage.objects;

-- ═══════════════════════════════════════════════════════════════════════════
-- POLÍTICAS DE STORAGE
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- BUCKET: assignments
-- ───────────────────────────────────────────────────────────────────────────

-- Los profesores pueden subir archivos de tareas
CREATE POLICY "Teachers can upload assignments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignments' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

-- Cualquier usuario autenticado puede leer archivos de tareas
CREATE POLICY "Authenticated users can view assignments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignments');

-- Los profesores pueden actualizar sus archivos
CREATE POLICY "Teachers can update own assignments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignments'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

-- Los profesores pueden eliminar sus archivos
CREATE POLICY "Teachers can delete own assignments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignments'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

-- ───────────────────────────────────────────────────────────────────────────
-- BUCKET: submissions
-- ───────────────────────────────────────────────────────────────────────────

-- Los estudiantes pueden subir sus entregas
CREATE POLICY "Students can upload submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'student' OR role = 'teacher')
  )
);

-- Los estudiantes pueden ver sus propias entregas, los profesores pueden ver todas
CREATE POLICY "Users can view relevant submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions'
  AND (
    -- El propio estudiante
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Cualquier profesor
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  )
);

-- Los estudiantes pueden actualizar sus entregas (si no están bloqueadas)
CREATE POLICY "Students can update own submissions"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'submissions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Los estudiantes pueden eliminar sus entregas
CREATE POLICY "Students can delete own submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'submissions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ───────────────────────────────────────────────────────────────────────────
-- BUCKET: notes
-- ───────────────────────────────────────────────────────────────────────────

-- Los profesores pueden subir materiales
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

-- Cualquier usuario autenticado puede leer materiales
CREATE POLICY "Authenticated users can view notes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notes');

-- Los profesores pueden actualizar sus materiales
CREATE POLICY "Teachers can update own notes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'notes'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

-- Los profesores pueden eliminar sus materiales
CREATE POLICY "Teachers can delete own notes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'notes'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

-- ───────────────────────────────────────────────────────────────────────────
-- BUCKET: avatars
-- ───────────────────────────────────────────────────────────────────────────

-- Los usuarios pueden subir su propio avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Todos pueden ver avatares
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Los usuarios pueden actualizar su propio avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Los usuarios pueden eliminar su propio avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAR POLÍTICAS CREADAS
-- ═══════════════════════════════════════════════════════════════════════════

-- Ejecuta esta consulta para ver todas las políticas de Storage
SELECT 
  policyname,
  tablename,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ CONFIGURACIÓN COMPLETADA
-- ═══════════════════════════════════════════════════════════════════════════
-- Ahora tus buckets de Storage tienen las políticas de seguridad correctas
-- 
-- RECUERDA:
-- 1. Los buckets deben estar creados como PÚBLICOS en el dashboard
-- 2. Las políticas controlan quién puede SUBIR archivos
-- 3. Los archivos son accesibles por URL pública una vez subidos
-- ═══════════════════════════════════════════════════════════════════════════