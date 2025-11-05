import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BookOpen, FileText, Award, LogOut, Clock, Settings, Sun, Moon, Book } from 'lucide-react';
import { AssignmentCard } from './AssignmentCard';
import { MySubmissionsView } from './MySubmissionsView';
import { StudentMaterialsView } from './StudentMaterialsView';
import { SettingsPanel } from './SettingsPanel';
import { useTheme } from '../utils/ThemeContext';
import { useLanguage } from '../utils/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  onUpdateProfile: (updates: any) => void;
}

export function StudentDashboard({ user, onLogout, onUpdateProfile }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    ...user,
    avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
  });
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [assignmentsRes, submissionsRes] = await Promise.all([
        apiClient.getAssignments(),
        apiClient.getMySubmissions(),
      ]);
      setAssignments(assignmentsRes.assignments || []);
      setSubmissions(submissionsRes.submissions || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingAssignments = assignments.filter(
    (assignment) => !submissions.some((sub) => sub.assignmentId === assignment.id)
  );

  const completedAssignments = assignments.filter((assignment) =>
    submissions.some((sub) => sub.assignmentId === assignment.id)
  );

  const averageGrade = submissions.length > 0
    ? submissions
        .filter((sub) => sub.grade !== null)
        .reduce((acc, sub) => acc + sub.grade, 0) /
      submissions.filter((sub) => sub.grade !== null).length
    : 0;

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
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl truncate">EduConnect</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t('studentPanel')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
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
                  <AvatarFallback className="bg-secondary text-white">
                    {userProfile.name?.charAt(0) || 'S'}
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
        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-secondary to-cyan-600 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-cyan-100 text-xs sm:text-sm truncate">{t('pendingSubmissions')}</p>
                  <p className="text-2xl sm:text-3xl mt-1 sm:mt-2">{pendingAssignments.length}</p>
                </div>
                <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-cyan-200 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-green-600 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-green-100 text-xs sm:text-sm truncate">{t('completedAssignments')}</p>
                  <p className="text-2xl sm:text-3xl mt-1 sm:mt-2">{completedAssignments.length}</p>
                </div>
                <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-green-200 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-emerald-100 text-xs sm:text-sm truncate">{t('averageGrade')}</p>
                  <p className="text-2xl sm:text-3xl mt-1 sm:mt-2">
                    {averageGrade > 0 ? averageGrade.toFixed(1) : '-'}
                  </p>
                </div>
                <Award className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-200 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card shadow-sm grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="assignments" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">{t('assignments')}</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Book className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">{t('notes')}</span>
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Award className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">{t('submissions')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-6">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl mb-2 truncate">{t('assignments')}</h2>
              <p className="text-muted-foreground text-sm truncate">{t('manageTasks')}</p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">{t('loadingTasks')}</p>
              </div>
            ) : pendingAssignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl mb-2">{t('noAssignedTasks')}</h3>
                  <p className="text-muted-foreground text-center mb-2">
                    {assignments.length === 0 
                      ? t('noAssignedTasksMessage')
                      : t('noAssignmentsMessage')}
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('noAssignedTasksMessage')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    isTeacher={false}
                    onSubmissionComplete={loadData}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions">
            <MySubmissionsView 
              submissions={submissions} 
              assignments={assignments}
              onRefresh={loadData}
            />
          </TabsContent>
        </Tabs>
      </main>

      <SettingsPanel
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        userProfile={userProfile}
        onUpdateProfile={handleProfileUpdate}
      />
    </div>
  );
}
