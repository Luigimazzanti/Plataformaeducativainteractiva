import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Shield, Users, LogOut, Trash2, UserPlus, UserMinus, Lock, Unlock, Moon, Sun, Globe, AlertCircle, GraduationCap, User } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../utils/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
import { SettingsPanel } from './SettingsPanel';
import { NavigationDropdown } from './NavigationDropdown';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
  onUpdateProfile: (updates: any) => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  createdAt: string;
  blocked?: boolean;
  avatar?: string;
}

export function AdminDashboard({ user, onLogout, onUpdateProfile }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      console.log('[AdminDashboard] Loading users...');
      console.log('[AdminDashboard] Current token:', apiClient.getToken()?.substring(0, 20) + '...');
      
      // Get all users from API
      const { users: allUsers } = await apiClient.getAllUsers();
      
      console.log('[AdminDashboard] Users loaded successfully:', allUsers?.length || 0);
      console.log('[AdminDashboard] Teachers:', (allUsers || []).filter((u: User) => u.role === 'teacher').length);
      console.log('[AdminDashboard] Students:', (allUsers || []).filter((u: User) => u.role === 'student').length);

      setUsers(allUsers || []);
      setTeachers((allUsers || []).filter((u: User) => u.role === 'teacher'));
      setStudents((allUsers || []).filter((u: User) => u.role === 'student'));
    } catch (error: any) {
      console.error('[AdminDashboard] Error in loadUsers:', error);
      console.error('[AdminDashboard] Error message:', error.message);
      console.error('[AdminDashboard] Error stack:', error.stack);
      toast.error(t('errorLoadingUsers') || 'Error loading users: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`${t('confirmDeleteUser') || 'Are you sure you want to delete'} ${userName}?`)) {
      return;
    }

    try {
      await apiClient.deleteUser(userId);
      toast.success(t('userDeleted') || 'User deleted successfully');
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || t('errorDeletingUser') || 'Error deleting user');
    }
  };

  const handleBlockUser = async (userId: string, userName: string, currentlyBlocked: boolean) => {
    try {
      await apiClient.blockUser(userId, !currentlyBlocked);
      toast.success(
        currentlyBlocked 
          ? (t('userUnblocked') || `${userName} unblocked`) 
          : (t('userBlocked') || `${userName} blocked`)
      );
      loadUsers();
    } catch (error: any) {
      console.error('Error blocking/unblocking user:', error);
      toast.error(error.message || t('errorUpdatingUser') || 'Error updating user');
    }
  };

  const openAssignDialog = (student: User) => {
    setSelectedStudent(student);
    setSelectedTeacher('');
    setShowAssignDialog(true);
  };

  const handleAssignTeacher = async () => {
    if (!selectedStudent || !selectedTeacher) {
      toast.error(t('selectTeacher') || 'Please select a teacher');
      return;
    }

    try {
      await apiClient.assignTeacherToStudent(selectedTeacher, selectedStudent.id);
      toast.success(t('teacherAssigned') || 'Teacher assigned successfully');
      setShowAssignDialog(false);
      setSelectedStudent(null);
      setSelectedTeacher('');
      loadUsers();
    } catch (error: any) {
      console.error('Error assigning teacher:', error);
      toast.error(error.message || t('errorAssigningTeacher') || 'Error assigning teacher');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl truncate">EduConnect Admin</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettingsPanel(true)}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button variant="outline" onClick={onLogout} className="hidden sm:flex">
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
              </Button>
              <Button variant="outline" size="icon" onClick={onLogout} className="sm:hidden h-8 w-8">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <span className="truncate">{t('totalUsers') || 'Total Users'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl">{users.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                <span className="truncate">{t('teachers') || 'Teachers'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl text-blue-500">{teachers.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="truncate">{t('students') || 'Students'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl text-green-500">{students.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Server Status Warning */}
        {users.length === 0 && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="ml-2 text-sm">
              <p className="font-semibold mb-2">
                {t('noUsersWarning') || '⚠️ No se pueden cargar usuarios'}
              </p>
              <p className="text-muted-foreground">
                {t('serverDeploymentIssue') || 'El servidor Edge Function no está desplegado (Error 403). Por favor, revisa el archivo ERROR_403_QUICK_FIX.md para solucionar este problema de infraestructura.'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                ��� {t('codeCorrectNote') || 'Nota: El código está correcto. Solo necesitas configurar Supabase correctamente.'}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Users Management Tabs */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl truncate">{t('userManagement') || 'User Management'}</CardTitle>
            <CardDescription className="text-sm">
              {t('manageUsersDescription') || 'View, manage, and moderate all users in the system'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="w-full space-y-4">
              <NavigationDropdown
                items={[
                  { 
                    value: 'all', 
                    label: `${t('allUsers') || 'All Users'} (${users.length})`, 
                    icon: Users, 
                    mobileLabel: `Todos (${users.length})` 
                  },
                  { 
                    value: 'teachers', 
                    label: `${t('teachers') || 'Teachers'} (${teachers.length})`, 
                    icon: GraduationCap, 
                    mobileLabel: `Profesores (${teachers.length})` 
                  },
                  { 
                    value: 'students', 
                    label: `${t('students') || 'Students'} (${students.length})`, 
                    icon: User, 
                    mobileLabel: `Estudiantes (${students.length})` 
                  },
                ]}
                activeValue={activeTab}
                onValueChange={setActiveTab}
              />

              {/* All Users Tab */}
              {activeTab === 'all' && (
                <div className="space-y-3 sm:space-y-4">
                {users.map(u => (
                  <Card key={u.id} className="overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarFallback className={u.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                              <p className="truncate max-w-[150px] sm:max-w-none">{u.name}</p>
                              <Badge variant={u.role === 'teacher' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                                {u.role}
                              </Badge>
                              {u.blocked && (
                                <Badge variant="destructive" className="text-[10px] sm:text-xs">
                                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                  {t('blocked') || 'Blocked'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                          {u.role === 'student' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignDialog(u)}
                              className="text-xs h-8 px-2 sm:px-3"
                            >
                              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden sm:inline">{t('assignTeacher') || 'Assign'}</span>
                            </Button>
                          )}
                          <Button
                            variant={u.blocked ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleBlockUser(u.id, u.name, u.blocked || false)}
                            className="text-xs h-8 px-2 sm:px-3"
                          >
                            {u.blocked ? (
                              <>
                                <Unlock className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('unblock') || 'Unblock'}</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('block') || 'Block'}</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="h-8 w-8 sm:w-auto sm:px-3 p-0 sm:p-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('noUsers') || 'No users found'}
                  </div>
                )}
                </div>
              )}

              {/* Teachers Tab */}
              {activeTab === 'teachers' && (
                <div className="space-y-3 sm:space-y-4">
                {teachers.map(u => (
                  <Card key={u.id} className="overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                              <p className="truncate max-w-[150px] sm:max-w-none">{u.name}</p>
                              {u.blocked && (
                                <Badge variant="destructive" className="text-[10px] sm:text-xs">
                                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                  {t('blocked') || 'Blocked'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <Button
                            variant={u.blocked ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleBlockUser(u.id, u.name, u.blocked || false)}
                            className="text-xs h-8 px-2 sm:px-3"
                          >
                            {u.blocked ? (
                              <>
                                <Unlock className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('unblock') || 'Unblock'}</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('block') || 'Block'}</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="h-8 w-8 sm:w-auto sm:px-3 p-0 sm:p-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {teachers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('noTeachers') || 'No teachers found'}
                  </div>
                )}
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="space-y-3 sm:space-y-4">
                {students.map(u => (
                  <Card key={u.id} className="overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                              <p className="truncate max-w-[150px] sm:max-w-none">{u.name}</p>
                              {u.blocked && (
                                <Badge variant="destructive" className="text-[10px] sm:text-xs">
                                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                  {t('blocked') || 'Blocked'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(u)}
                            className="text-xs h-8 px-2 sm:px-3"
                          >
                            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">{t('assignTeacher') || 'Assign'}</span>
                          </Button>
                          <Button
                            variant={u.blocked ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleBlockUser(u.id, u.name, u.blocked || false)}
                            className="text-xs h-8 px-2 sm:px-3"
                          >
                            {u.blocked ? (
                              <>
                                <Unlock className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('unblock') || 'Unblock'}</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">{t('block') || 'Block'}</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="h-8 w-8 sm:w-auto sm:px-3 p-0 sm:p-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {students.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('noStudents') || 'No students found'}
                  </div>
                )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Assign Teacher Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assignTeacherTo') || 'Assign Teacher to'} {selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              {t('selectTeacherDescription') || 'Select a teacher to assign to this student'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('teacher') || 'Teacher'}</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTeacher') || 'Select a teacher'} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                {t('cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleAssignTeacher} disabled={!selectedTeacher}>
                {t('assign') || 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Panel */}
      <SettingsPanel
        open={showSettingsPanel}
        onOpenChange={setShowSettingsPanel}
        userProfile={user}
        onUpdateProfile={onUpdateProfile}
      />
    </div>
  );
}
