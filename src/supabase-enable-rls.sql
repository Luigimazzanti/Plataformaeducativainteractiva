-- ═══════════════════════════════════════════════════════════════════════════
-- EDUCONNECT - HABILITAR ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════
-- IMPORTANTE: Ejecuta este script en tu proyecto de Supabase
-- Dashboard → SQL Editor → New Query → Pega este código → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 1: HABILITAR RLS EN TODAS LAS TABLAS
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 2: ELIMINAR POLÍTICAS ANTIGUAS (si existen)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can view all profiles" ON profiles;
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 3: CREAR POLÍTICAS DE SEGURIDAD
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- PROFILES (tabla principal de perfiles)
-- ───────────────────────────────────────────────────────────────────────────

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profesores pueden ver todos los perfiles
CREATE POLICY "Teachers can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Admins pueden ver y modificar todo
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- USER_PROFILES (si es diferente de profiles)
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Users can view own user_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own user_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- ───────────────────────────────────────────────────────────────────────────
-- ASSIGNMENTS (tareas)
-- ───────────────────────────────────────────────────────────────────────────

-- Profesores ven sus tareas
CREATE POLICY "Teachers can view own assignments" ON assignments
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create assignments" ON assignments
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own assignments" ON assignments
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own assignments" ON assignments
  FOR DELETE USING (teacher_id = auth.uid());

-- Estudiantes ven tareas asignadas a ellos
CREATE POLICY "Students can view assigned assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignment_students 
      WHERE assignment_id = assignments.id 
      AND student_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- ASSIGNMENT_STUDENTS (relación assignments-students)
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Teachers can manage assignment_students" ON assignment_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = assignment_students.assignment_id 
      AND assignments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own assignment_students" ON assignment_students
  FOR SELECT USING (student_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- SUBMISSIONS (entregas de estudiantes)
-- ───────────────────────────────────────────────────────────────────────────

-- Estudiantes ven sus entregas
CREATE POLICY "Students can view own submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create submissions" ON submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions" ON submissions
  FOR UPDATE USING (student_id = auth.uid());

-- Profesores ven entregas de sus tareas
CREATE POLICY "Teachers can view submissions for own assignments" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = submissions.assignment_id 
      AND assignments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update submissions for own assignments" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = submissions.assignment_id 
      AND assignments.teacher_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- NOTES (materiales)
-- ───────────────────────────────────────────────────────────────────────────

-- Profesores manejan sus materiales
CREATE POLICY "Teachers can manage own notes" ON notes
  FOR ALL USING (teacher_id = auth.uid());

-- Estudiantes ven materiales asignados
CREATE POLICY "Students can view assigned notes" ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM note_students 
      WHERE note_id = notes.id 
      AND student_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- NOTE_STUDENTS (relación notes-students)
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Teachers can manage note_students" ON note_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_students.note_id 
      AND notes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own note_students" ON note_students
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can update own note_students" ON note_students
  FOR UPDATE USING (student_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- NOTE_ASSIGNMENTS, NOTE_OPENS, NOTE_READS
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Users can manage own note interactions" ON note_assignments
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Users can manage own note_opens" ON note_opens
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Users can manage own note_reads" ON note_reads
  FOR ALL USING (student_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS (notificaciones)
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- TEACHER_STUDENTS (relación profesor-estudiante)
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Teachers can manage own students" ON teacher_students
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view own teachers" ON teacher_students
  FOR SELECT USING (student_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- PDF_VERSIONS, PDF_SESSIONS, PDF_WORKFLOW, PDF_WORKFLOW_STATUS
-- ───────────────────────────────────────────────────────────────────────────

-- Estudiantes pueden ver/crear sus propias versiones PDF
CREATE POLICY "Students can manage own pdf_versions" ON pdf_versions
  FOR ALL USING (student_id = auth.uid());

-- Profesores pueden ver versiones PDF de sus tareas
CREATE POLICY "Teachers can view pdf_versions for own assignments" ON pdf_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = pdf_versions.assignment_id 
      AND assignments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update pdf_versions for own assignments" ON pdf_versions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = pdf_versions.assignment_id 
      AND assignments.teacher_id = auth.uid()
    )
  );

-- PDF Sessions
CREATE POLICY "Users can manage own pdf_sessions" ON pdf_sessions
  FOR ALL USING (student_id = auth.uid());

-- PDF Workflow
CREATE POLICY "Users can manage pdf_workflow" ON pdf_workflow
  FOR ALL USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = pdf_workflow.assignment_id 
      AND assignments.teacher_id = auth.uid()
    )
  );

-- PDF Workflow Status
CREATE POLICY "Users can view pdf_workflow_status" ON pdf_workflow_status
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = pdf_workflow_status.assignment_id 
      AND assignments.teacher_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- TASK_ASSIGNMENTS, TEACHER_STUDENT_ASSIGNMENTS
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Teachers can manage task_assignments" ON task_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = task_assignments.assignment_id 
      AND assignments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own task_assignments" ON task_assignments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage teacher_student_assignments" ON teacher_student_assignments
  FOR ALL USING (teacher_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 4: VERIFICAR QUE TODO FUNCIONA
-- ═══════════════════════════════════════════════════════════════════════════

-- Ejecuta esta consulta para ver el estado de RLS en todas las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ SCRIPT COMPLETADO
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS está ahora habilitado en todas las tablas con políticas de seguridad
-- 
-- PRÓXIMO PASO:
-- 1. Verificar que todas las tablas muestren "true" en rls_enabled
-- 2. Configurar Storage Buckets (si no están creados)
-- 3. Probar la aplicación
-- ═══════════════════════════════════════════════════════════════════════════