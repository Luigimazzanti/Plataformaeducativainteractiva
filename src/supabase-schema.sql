-- ═══════════════════════════════════════════════════════════════════════════
-- EDUCONNECT DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecuta este script en tu proyecto de Supabase:
-- Dashboard → SQL Editor → New Query → Pega este código → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. TABLA DE USUARIOS (profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar TEXT,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE RELACIONES PROFESOR-ESTUDIANTE
CREATE TABLE IF NOT EXISTS teacher_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

-- 3. TABLA DE TAREAS/ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'form', 'pdf')),
  file_url TEXT,
  form_fields JSONB,
  questions JSONB,
  files JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE ASIGNACIONES (qué estudiantes tienen qué tareas)
CREATE TABLE IF NOT EXISTS assignment_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- 5. TABLA DE ENTREGAS/SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'GRADED')),
  grade NUMERIC(5,2),
  feedback TEXT,
  file_url TEXT,
  files JSONB,
  form_data JSONB,
  content JSONB,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_graded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- 6. TABLA DE MATERIALES/NOTES
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA DE ASIGNACIONES DE MATERIALES
CREATE TABLE IF NOT EXISTS note_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  opened BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, student_id)
);

-- 8. TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('submission', 'grade', 'assignment', 'material', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLA DE VERSIONES PDF (para sistema de anotaciones)
CREATE TABLE IF NOT EXISTS pdf_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version TEXT NOT NULL CHECK (version IN ('original', 'student', 'teacher')),
  file_url TEXT,
  annotations JSONB,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'corrected', 'final')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_by_role TEXT NOT NULL CHECK (created_by_role IN ('student', 'teacher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_versions ENABLE ROW LEVEL SECURITY;

-- PROFILES: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- PROFILES: Profesores pueden ver todos los perfiles
CREATE POLICY "Teachers can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- ASSIGNMENTS: Profesores ven sus tareas
CREATE POLICY "Teachers can view own assignments" ON assignments
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create assignments" ON assignments
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own assignments" ON assignments
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own assignments" ON assignments
  FOR DELETE USING (teacher_id = auth.uid());

-- ASSIGNMENTS: Estudiantes ven tareas asignadas
CREATE POLICY "Students can view assigned assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignment_students 
      WHERE assignment_id = assignments.id 
      AND student_id = auth.uid()
    )
  );

-- SUBMISSIONS: Estudiantes ven sus entregas
CREATE POLICY "Students can view own submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create submissions" ON submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions" ON submissions
  FOR UPDATE USING (student_id = auth.uid());

-- SUBMISSIONS: Profesores ven entregas de sus tareas
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

-- NOTIFICATIONS: Los usuarios solo ven sus notificaciones
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- NOTES: Profesores ven sus materiales
CREATE POLICY "Teachers can manage own notes" ON notes
  FOR ALL USING (teacher_id = auth.uid());

-- NOTES: Estudiantes ven materiales asignados
CREATE POLICY "Students can view assigned notes" ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM note_students 
      WHERE note_id = notes.id 
      AND student_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- INDICES PARA MEJOR RENDIMIENTO
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS (para archivos)
-- ═══════════════════════════════════════════════════════════════════════════

-- IMPORTANTE: Ejecuta estos comandos en Storage → Policies
-- Los buckets deben crearse desde el dashboard de Supabase:
-- 1. Ve a Storage en el dashboard
-- 2. Crea estos buckets: assignments, submissions, notes, avatars
-- 3. Configura las políticas de acceso para cada bucket

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ SCRIPT COMPLETADO
-- ═══════════════════════════════════════════════════════════════════════════
-- Ahora tu base de datos está lista para EduConnect
-- 
-- PRÓXIMOS PASOS:
-- 1. Crear buckets de Storage: assignments, submissions, notes, avatars
-- 2. Configurar políticas de Storage para cada bucket
-- 3. Crear usuarios de prueba desde Authentication
-- 4. Probar la aplicación
-- ═══════════════════════════════════════════════════════════════════════════
