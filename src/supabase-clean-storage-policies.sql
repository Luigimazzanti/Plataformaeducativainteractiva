-- ═══════════════════════════════════════════════════════════════════════════
-- 🧹 LIMPIAR TODAS LAS POLÍTICAS DE STORAGE
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecuta este script SOLO si tienes errores de políticas duplicadas
-- ═══════════════════════════════════════════════════════════════════════════

-- Eliminar todas las políticas existentes de storage.objects
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

-- Ver políticas restantes
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ LIMPIEZA COMPLETADA
-- ═══════════════════════════════════════════════════════════════════════════
-- Ahora puedes ejecutar /supabase-storage-setup.sql sin errores
-- ═══════════════════════════════════════════════════════════════════════════
