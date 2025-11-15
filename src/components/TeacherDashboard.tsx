import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, FileText, Users, BarChart3, LogOut, Upload, Settings, Sun, Moon, Sparkles } from 'lucide-react';
import { NotificationManager, Notification } from '../utils/notifications';
import { CreateAssignmentDialog } from './CreateAssignmentDialog';
import { QuestionGeneratorDialog } from './QuestionGeneratorDialog';
import { AssignmentCard } from './AssignmentCard';
import { MyStudentsWithTasks } from './MyStudentsWithTasks';
import { ImprovedGradesView } from './ImprovedGradesView';
import { SettingsPanel } from './SettingsPanel';
import { TeacherMaterialsView } from './TeacherMaterialsView';
import { NavigationDropdown } from './NavigationDropdown';
import { NotificationCenter } from './NotificationCenter';
import { useTheme } from '../utils/ThemeContext';
import { useLanguage } from '../utils/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { toast } from 'sonner@2.0.3';

interface TeacherDashboardProps {
  user: any;
  onLogout: () => void;
  onUpdateProfile: (updates: any) => void;
}

export function TeacherDashboard({ user, onLogout, onUpdateProfile }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQuestionGeneratorOpen, setIsQuestionGeneratorOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    ...user,
    avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
  });
  const [myStudentsCount, setMyStudentsCount] = useState(0);
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    // 🚀 OPTIMIZACIÓN: Cargar TODO en paralelo
    Promise.all([
      loadAssignments(),
      loadStudentsCount(),
      loadNewSubmissionsCount()
    ]).catch(err => {
      console.error('Error inicial:', err);
    });

    // ❌ ELIMINADO: Auto-refresh agresivo que saturaba la DB
    // ✅ SOLO REACCIONAR A EVENTOS (no polling constante)

    // 🔔 Escuchar eventos custom (entregas en la misma pestaña)
    const handleSubmissionAdded = (e: CustomEvent) => {
      console.log('🔔 [TeacherDashboard] Nueva entrega detectada!', e.detail);
      loadNewSubmissionsCount();
      toast.success('📬 Nueva entrega recibida', {
        description: 'Revisa la sección de Calificaciones',
        duration: 5000,
      });
    };

    window.addEventListener('submission-added', handleSubmissionAdded as EventListener);

    return () => {
      window.removeEventListener('submission-added', handleSubmissionAdded as EventListener);
    };
  }, []);

  useEffect(() => {
    // Recargar contador cuando cambie a la pestaña de calificaciones
    if (activeTab === 'grades') {
      loadNewSubmissionsCount();
    }
  }, [activeTab]);

  const loadStudentsCount = async () => {
    try {
      const { students } = await apiClient.getMyStudents();
      setMyStudentsCount(students?.length || 0);
    } catch (error) {
      console.error('Error loading students count:', error);
    }
  };

  const loadNewSubmissionsCount = async () => {
    try {
      // 🚀 OPTIMIZACIÓN CRÍTICA: Usar getAllTeacherSubmissions() en lugar de loop
      const { submissions: allSubs } = await apiClient.getAllTeacherSubmissions();
      
      const viewedSubmissions = NotificationManager.getViewedSubmissions();
      const newCount = (allSubs || []).filter((sub) => !viewedSubmissions.has(sub.id)).length;
      
      setNewSubmissionsCount(newCount);
    } catch (error: any) {
      // 🔧 Silenciar COMPLETAMENTE - mantener contador actual
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('🔔 [TeacherDashboard] Navegando desde notificación:', notification);
    
    // Navegar según el tipo de notificación
    if (notification.targetTab) {
      setActiveTab(notification.targetTab);
    }
    
    // Puedes agregar lógica adicional aquí si necesitas scroll o abrir diálogos específicos
  };

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const { assignments: data } = await apiClient.getAssignments();
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async (assignmentData: any) => {
    try {
      await apiClient.createAssignment(assignmentData);
      await loadAssignments();
      setIsCreateDialogOpen(false);
      toast.success(t('assignmentCreated') || '✅ Tarea creada exitosamente');
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error(t('createError') || '❌ Error al crear la tarea');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm(t('confirmDelete') || '¿Eliminar esta tarea?')) return;
    
    try {
      await apiClient.deleteAssignment(id);
      await loadAssignments();
      toast.success('🗑️ Tarea eliminada');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error(t('deleteError') || '❌ Error al eliminar');
    }
  };

  const handleProfileUpdate = (updates: any) => {
    setUserProfile({ ...userProfile, ...updates });
    onUpdateProfile(updates);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gradient-from via-gradient-via to-gradient-to">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl truncate">EduConnect</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t('teacherPanel')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
              <NotificationCenter 
                userRole="teacher"
                userId={user.id}
                onNavigate={handleNotificationClick}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                title={t('settings')}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('welcome')},</p>
                  <p className="truncate max-w-[120px]">{userProfile.name}</p>
                </div>
                <Avatar className="cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                  <AvatarImage src={userProfile.avatar} />
                  <AvatarFallback className="bg-primary text-white">
                    {userProfile.name?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button variant="outline" onClick={onLogout} size="sm" className="hidden sm:flex">
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
              </Button>
              <Button variant="outline" onClick={onLogout} size="icon" className="sm:hidden h-8 w-8">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <NavigationDropdown
            items={[
              { value: 'assignments', label: t('assignments'), icon: FileText, mobileLabel: 'Tareas' },
              { value: 'materials', label: t('notes'), icon: Upload, mobileLabel: 'Material' },
              { value: 'my-students', label: t('myStudents'), icon: Users, mobileLabel: 'Mis Estudiantes' },
              { 
                value: 'grades', 
                label: t('grades'), 
                icon: BarChart3, 
                mobileLabel: 'Notas',
                badge: newSubmissionsCount > 0 ? newSubmissionsCount : undefined,
                pulseBadge: newSubmissionsCount > 0
              },
            ]}
            activeValue={activeTab}
            onValueChange={setActiveTab}
          />

          {activeTab === 'assignments' && (
            <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <Card className="bg-gradient-to-br from-primary to-green-600 text-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-green-100 text-xs sm:text-sm truncate">{t('totalAssignments')}</p>
                      <p className="text-2xl sm:text-3xl mt-1 sm:mt-2">{assignments.length}</p>
                    </div>
                    <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-green-200 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-secondary to-cyan-600 text-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-cyan-100 text-xs sm:text-sm truncate">{t('myStudentsCount')}</p>
                      <p className="text-2xl sm:text-3xl mt-1 sm:mt-2">{myStudentsCount}</p>
                    </div>
                    <Users className="w-8 h-8 sm:w-12 sm:h-12 text-cyan-200 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-emerald-100 text-xs sm:text-sm truncate">{t('activeAssignments')}</p>
                      <p className="text-2xl sm:text-3xl mt-1 sm:mt-2">
                        {assignments.filter(a => !a.dueDate || new Date(a.dueDate) >= new Date()).length}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-200 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl truncate">{t('myTasks')}</h2>
                <p className="text-muted-foreground text-sm truncate">{t('manageTasks')}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsQuestionGeneratorOpen(true)} 
                  variant="outline"
                  className="gap-2 border-lime-500/30 text-lime-600 hover:bg-lime-500/10"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Generar Preguntas</span>
                  <span className="sm:hidden">Preguntas</span>
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('newTask')}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">{t('loadingTasks')}</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="space-y-4">
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-foreground">{t('howAssignmentWorks')}</h3>
                        <ol className="text-sm text-foreground space-y-2 list-decimal list-inside">
                          <li>{t('assignmentStep1')}</li>
                          <li>{t('assignmentStep2')}</li>
                          <li>{t('assignmentStep3')}</li>
                          <li>{t('assignmentStep4')}</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl mb-2">{t('noAssignments')}</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      {t('noAssignmentsMessage')}
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('createFirstTask')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onDelete={handleDeleteAssignment}
                    isTeacher={true}
                    onAssignmentUpdated={loadAssignments}
                  />
                ))}
              </div>
            )}
            </div>
          )}

          {activeTab === 'materials' && (
            <TeacherMaterialsView />
          )}

          {activeTab === 'my-students' && (
            <MyStudentsWithTasks />
          )}

          {activeTab === 'grades' && (
            <ImprovedGradesView 
              assignments={assignments} 
              onViewSubmission={() => {
                // Recargar contador cuando se vea una submission
                loadNewSubmissionsCount();
              }}
            />
          )}
        </div>
      </main>

      <CreateAssignmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateAssignment}
      />

      <QuestionGeneratorDialog
        open={isQuestionGeneratorOpen}
        onOpenChange={setIsQuestionGeneratorOpen}
      />

      <SettingsPanel
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        userProfile={userProfile}
        onUpdateProfile={handleProfileUpdate}
      />
    </div>
  );
}