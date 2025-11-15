/*
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  APP.TSX - RECOMPILACION NUCLEAR V9.7                                 ║
 * ║  FIX: CORRECCIÓN FINAL                                                ║
 * ║       'apiClient.getSelf' -> 'AuthManager.getUserId()'              ║
 * ║       y luego 'apiClient.getUserProfile(userId)'                      ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import {
  Home,
  BookMarked,
  GraduationCap,
  Users,
  Settings,
  PanelLeft,
  UserCheck,
  Bell,
  MessageSquare,
  LayoutGrid,
  Library,
  BookOpen,
  Blocks,
  FileCheck2,
  ListChecks,
} from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthManager } from './utils/auth-manager';
import { apiClient } from './utils/api';
import { useLanguage } from './utils/LanguageContext';
import { useTheme } from './utils/ThemeContext';
import { SettingsPanel } from './components/SettingsPanel';
import { StudentMaterialsView } from './components/StudentMaterialsView';
import { TeacherMaterialsView } from './components/TeacherMaterialsView';
import { ImprovedGradesView } from './components/ImprovedGradesView';
import { MyStudentsWithTasks } from './components/MyStudentsWithTasks';
import { SubmissionsInboxView } from './components/SubmissionsInboxView';
import { MySubmissionsView } from './components/MySubmissionsView';
import { NotificationCenter } from './components/NotificationCenter';
import { RealtimeStatusIndicator } from './components/RealtimeStatusIndicator';

// Tipos de vistas
type View =
  | 'dashboard'
  | 'assignments' // (teacher)
  | 'materials' // (teacher)
  | 'submissions' // (teacher)
  | 'students' // (teacher)
  | 'grades' // (teacher)
  | 'my-submissions' // (student)
  | 'my-materials' // (student)
  | 'settings'
  | 'admin-users'
  | 'admin-tasks'
  | 'admin-materials'
  | 'admin-stats';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  // Estado para forzar recarga de submissions
  const [submissionsKey, setSubmissionsKey] = useState(Date.now());

  const loadInitialData = useCallback(async () => {
    console.log('Verificando sesión...');
    try {
      const token = AuthManager.getToken();
      if (!token) {
        console.log('No hay token, mostrando login');
        setIsLoading(false);
        return;
      }
      
      console.log('Token encontrado, validando...');
      apiClient.setToken(token);
      
      if (token.startsWith('demo_')) {
        localStorage.setItem('educonnect_demo_mode', 'true');
      }

      // <--- ESTE ES EL ARREGLO --- >
      // 1. Obtener el ID de usuario guardado
      const userId = AuthManager.getUserId();
      if (!userId) {
        console.log('No User ID found, limpiando...');
        AuthManager.clearAll();
        setIsLoading(false);
        return;
      }

      console.log('User ID encontrado, buscando perfil:', userId);
      // 2. Usar la función CORRECTA con el userId
      const { user } = await apiClient.getUserProfile(userId); 
      // <--- FIN DEL ARREGLO --- >
      
      if (user) {
        console.log('Usuario válido encontrado:', user.role);
        setUser(user);
        setView(user.role === 'admin' ? 'admin-users' : 'dashboard');
      } else {
        console.log('Token/User ID inválido o expirado');
        AuthManager.clearAll();
      }
    } catch (error) {
      console.error('Error al cargar sesión:', error);
      AuthManager.clearAll();
    } finally {
      setIsLoading(false);
    }
  }, []); // El array de dependencias DEBE estar vacío

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]); // Este useEffect ahora se ejecuta solo una vez

  const handleSubmissionsUpdate = useCallback(() => {
    console.log('Actualización de entregas detectada, forzando recarga...');
    setSubmissionsKey(Date.now());
  }, []); // Dependencias vacías, se crea una sola vez

  const handleLoginSuccess = (loggedInUser: any) => {
    console.log('Login exitoso, usuario:', loggedInUser.role);
    setUser(loggedInUser);
    setView(loggedInUser.role === 'admin' ? 'admin-users' : 'dashboard');
    setIsLoading(false);
  };

  const handleLogout = () => {
    AuthManager.clearAll();
    setUser(null);
    setView('dashboard');
    // Forzar recarga para limpiar estado de demo
    window.location.reload();
  };

  // Memoizar el usuario para evitar re-renderizados innecesarios
  const memoizedUser = useMemo(() => user, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-lg font-medium">Cargando EduConnect...</p>
        </div>
      </div>
    );
  }

  if (!memoizedUser) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  const role = memoizedUser.role;

  const teacherNavLinks = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'assignments', label: t('assignments'), icon: BookMarked },
    { id: 'materials', label: t('materials'), icon: Library },
    { id: 'submissions', label: t('submissions'), icon: FileCheck2 },
    { id: 'students', label: t('students'), icon: Users },
    { id: 'grades', label: t('grades'), icon: GraduationCap },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const studentNavLinks = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'my-submissions', label: t('mySubmissions'), icon: ListChecks },
    { id: 'my-materials', label: t('myMaterials'), icon: BookOpen },
    { id: 'grades', label: t('grades'), icon: GraduationCap },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const adminNavLinks = [
    { id: 'admin-users', label: t('userManagement'), icon: Users },
    { id: 'admin-tasks', label: t('assignments'), icon: BookMarked },
    { id: 'admin-materials', label: t('materials'), icon: Library },
    { id: 'admin-stats', label: t('dashboard'), icon: LayoutGrid },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const navLinks =
    role === 'teacher'
      ? teacherNavLinks
      : role === 'student'
      ? studentNavLinks
      : adminNavLinks;

  const renderView = () => {
    switch (view) {
      // Vistas de Profesor
      case 'dashboard':
        return role === 'teacher' ? (
          <TeacherDashboard
            user={memoizedUser}
            onNavigate={setView}
          />
        ) : (
          <StudentDashboard user={memoizedUser} onNavigate={setView} />
        );
      case 'assignments':
        return <MyStudentsWithTasks viewMode="assignments" teacherId={memoizedUser.id} />;
      case 'materials':
        return <TeacherMaterialsView teacherId={memoizedUser.id} />;
      case 'submissions':
        return <SubmissionsInboxView key={submissionsKey} teacherId={memoizedUser.id} onUpdateSubmission={handleSubmissionsUpdate} />;
      case 'students':
        return <MyStudentsWithTasks viewMode="students" teacherId={memoizedUser.id} />;
      case 'grades':
        return <ImprovedGradesView userRole={role} userId={memoizedUser.id} />;
      
      // Vistas de Estudiante
      case 'my-submissions':
        return <MySubmissionsView studentId={memoizedUser.id} onSubmissionUpdate={handleSubmissionsUpdate} />;
      case 'my-materials':
        return <StudentMaterialsView studentId={memoizedUser.id} />;

      // Vistas de Admin
      case 'admin-users':
        return <AdminDashboard view="users" />;
      case 'admin-tasks':
        return <AdminDashboard view="tasks" />;
      case 'admin-materials':
        return <AdminDashboard view="materials" />;
      case 'admin-stats':
        return <AdminDashboard view="stats" />;

      // Vista Común
      case 'settings':
        return (
          <SettingsPanel
            user={memoizedUser}
            onUpdateUser={(updatedUser) => setUser({ ...user, ...updatedUser })}
          />
        );
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  const getPageTitle = () => {
    const link = navLinks.find(link => link.id === view);
    return link ? link.label : 'EduConnect';
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-primary" />
          EduConnect
        </h2>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navLinks.map((link) => (
          <Button
            key={link.id}
            variant={view === link.id ? 'secondary' : 'ghost'}
            className="w-full justify-start text-sm"
            onClick={() => {
              setView(link.id as View);
              setIsSidebarOpen(false);
            }}
          >
            <link.icon className="w-4 h-4 mr-3" />
            {link.label}
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t mt-auto">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={memoizedUser.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${memoizedUser.name || 'User'}`}
            alt="Avatar"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{memoizedUser.name || memoizedUser.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{t(role)}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          {t('logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen ${theme}`}>
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:block w-64 border-r bg-card text-card-foreground fixed top-0 left-0 h-full">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 bg-background">
        {/* Header (Mobile) */}
        <header className="md:hidden flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <PanelLeft className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          
          <div className="flex items-center gap-2">
            <NotificationCenter userId={memoizedUser.id} />
            <RealtimeStatusIndicator />
          </div>
        </header>

        {/* Header (Desktop) */}
        <header className="hidden md:flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
          <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
          <div className="flex items-center gap-4">
            <RealtimeStatusIndicator />
            <NotificationCenter userId={memoizedUser.id} />
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => setView('settings')}
            >
              <img
                src={memoizedUser.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${memoizedUser.name || 'User'}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium">{memoizedUser.name || memoizedUser.email}</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
}