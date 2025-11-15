-- ═══════════════════════════════════════════════════════════════════════════
-- ⚡ EDUCONNECT - QUICK START (TODO EN UNO)
-- ═══════════════════════════════════════════════════════════════════════════
-- Este script hace TODO lo necesario para que Supabase funcione:
--   1. Habilita RLS en todas las tablas
--   2. Crea todas las políticas de seguridad
--   3. Crea índices para mejor rendimiento
--   4. Agrega triggers útiles
--
-- IMPORTANTE: Aún necesitas crear los buckets de Storage manualmente
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 1: HABILITAR RLS
-- ───────────────────────────────────────────────────────────────────────────

DO $$ 
BEGIN
  RAISE NOTICE '⚡ Habilitando Row Level Security...';
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 2: LIMPIAR POLÍTICAS ANTIGUAS
-- ───────────────────────────────────────────────────────────────────────────

DO $$ 
BEGIN
  RAISE NOTICE '🧹 Limpiando políticas antiguas...';
END $$;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view own assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can update own assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can delete own assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view assigned assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Students can create submissions" ON submissions;
DROP POLICY IF EXISTS "Students can update own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can view submissions for own assignments" ON submissions;
DROP POLICY IF EXISTS "Teachers can update submissions for own assignments" ON submissions;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Teachers can manage own notes" ON notes;
DROP POLICY IF EXISTS "Students can view assigned notes" ON notes;

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 3: CREAR POLÍTICAS DE SEGURIDAD
-- ───────────────────────────────────────────────────────────────────────────

DO $$ 
BEGIN
  RAISE NOTICE '🔒 Creando políticas de seguridad...';
END $$;

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teachers can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ASSIGNMENTS
CREATE POLICY "Teachers can view own assignments" ON assignments FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can create assignments" ON assignments FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers can update own assignments" ON assignments FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own assignments" ON assignments FOR DELETE USING (teacher_id = auth.uid());
CREATE POLICY "Students can view assigned assignments" ON assignments FOR SELECT USING (EXISTS (SELECT 1 FROM assignment_students WHERE assignment_id = assignments.id AND student_id = auth.uid()));

-- SUBMISSIONS
CREATE POLICY "Students can view own submissions" ON submissions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can create submissions" ON submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own submissions" ON submissions FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Teachers can view submissions for own assignments" ON submissions FOR SELECT USING (EXISTS (SELECT 1 FROM assignments WHERE assignments.id = submissions.assignment_id AND assignments.teacher_id = auth.uid()));
CREATE POLICY "Teachers can update submissions for own assignments" ON submissions FOR UPDATE USING (EXISTS (SELECT 1 FROM assignments WHERE assignments.id = submissions.assignment_id AND assignments.teacher_id = auth.uid()));

-- NOTES
CREATE POLICY "Teachers can manage own notes" ON notes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Students can view assigned notes" ON notes FOR SELECT USING (EXISTS (SELECT 1 FROM note_students WHERE note_id = notes.id AND student_id = auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- TEACHER_STUDENTS
CREATE POLICY "Teachers can manage own students" ON teacher_students FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Students can view own teachers" ON teacher_students FOR SELECT USING (student_id = auth.uid());

-- ASSIGNMENT_STUDENTS
CREATE POLICY "Teachers can manage assignment_students" ON assignment_students FOR ALL USING (EXISTS (SELECT 1 FROM assignments WHERE assignments.id = assignment_students.assignment_id AND assignments.teacher_id = auth.uid()));
CREATE POLICY "Students can view own assignment_students" ON assignment_students FOR SELECT USING (student_id = auth.uid());

-- NOTE_STUDENTS
CREATE POLICY "Teachers can manage note_students" ON note_students FOR ALL USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_students.note_id AND notes.teacher_id = auth.uid()));
CREATE POLICY "Students can view own note_students" ON note_students FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update own note_students" ON note_students FOR UPDATE USING (student_id = auth.uid());

-- PDF VERSIONS
CREATE POLICY "Students can manage own pdf_versions" ON pdf_versions FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers can view pdf_versions for own assignments" ON pdf_versions FOR SELECT USING (EXISTS (SELECT 1 FROM assignments WHERE assignments.id = pdf_versions.assignment_id AND assignments.teacher_id = auth.uid()));
CREATE POLICY "Teachers can update pdf_versions for own assignments" ON pdf_versions FOR UPDATE USING (EXISTS (SELECT 1 FROM assignments WHERE assignments.id = pdf_versions.assignment_id AND assignments.teacher_id = auth.uid()));

-- PDF SESSIONS
CREATE POLICY "Users can manage own pdf_sessions" ON pdf_sessions FOR ALL USING (student_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 4: CREAR ÍNDICES
-- ───────────────────────────────────────────────────────────────────────────

DO $$ 
BEGIN
  RAISE NOTICE '⚡ Creando índices para mejor rendimiento...';
END $$;

CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_students_assignment ON assignment_students(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_students_student ON assignment_students(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_student ON teacher_students(student_id);
CREATE INDEX IF NOT EXISTS idx_note_students_note ON note_students(note_id);
CREATE INDEX IF NOT EXISTS idx_note_students_student ON note_students(student_id);
CREATE INDEX IF NOT EXISTS idx_pdf_versions_assignment ON pdf_versions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_pdf_versions_student ON pdf_versions(student_id);

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 5: CREAR TRIGGERS
-- ───────────────────────────────────────────────────────────────────────────

DO $$ 
BEGIN
  RAISE NOTICE '⚡ Creando triggers automáticos...';
END $$;

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at (solo si la tabla tiene esa columna)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────
-- PARTE 6: VERIFICACIÓN
-- ───────────────────────────────────────────────────────────────────────────

DO $$ 
BEGIN
  RAISE NOTICE '✅ Verificando configuración...';
END $$;

-- Ver tablas con RLS habilitado
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver cantidad de políticas creadas
SELECT 
  tablename,
  COUNT(*) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ QUICK START COMPLETADO
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- TODO LISTO ✅
-- 
-- PRÓXIMOS PASOS:
-- 1. Crear buckets de Storage (assignments, submissions, notes, avatars)
-- 2. Ejecutar /supabase-storage-setup.sql para configurar políticas de Storage
-- 3. Crear usuarios de prueba en Authentication
-- 4. Insertar perfiles en tabla profiles
-- 5. ¡Probar la aplicación!
-- 
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ QUICK START COMPLETADO';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASOS:';
  RAISE NOTICE '1. Crear buckets: assignments, submissions, notes, avatars';
  RAISE NOTICE '2. Ejecutar: /supabase-storage-setup.sql';
  RAISE NOTICE '3. Crear usuarios en Authentication';
  RAISE NOTICE '4. ¡Probar la aplicación!';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Ver PASOS-SUPABASE.md para instrucciones completas';
  RAISE NOTICE '';
END $$;