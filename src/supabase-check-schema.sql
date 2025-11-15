-- ═══════════════════════════════════════════════════════════════════════════
-- 🔍 SCRIPT DE DIAGNÓSTICO - VERIFICAR ESQUEMA DE TABLAS
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecuta este script para ver la estructura de tus tablas
-- Útil para depurar errores de columnas faltantes
-- ═══════════════════════════════════════════════════════════════════════════

-- Ver todas las columnas de la tabla PROFILES
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Ver todas las columnas de la tabla ASSIGNMENTS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'assignments'
ORDER BY ordinal_position;

-- Ver todas las columnas de la tabla SUBMISSIONS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'submissions'
ORDER BY ordinal_position;

-- Ver todas las columnas de la tabla NOTES
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notes'
ORDER BY ordinal_position;

-- Ver todas las columnas de la tabla NOTIFICATIONS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Ver todas las tablas en el schema public
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ DIAGNÓSTICO COMPLETADO
-- ═══════════════════════════════════════════════════════════════════════════
-- Revisa los resultados para ver qué columnas existen en cada tabla
-- ═══════════════════════════════════════════════════════════════════════════
