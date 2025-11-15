import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Users, Mail, UserPlus, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ScrollArea } from './ui/scroll-area';

interface Student {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Assignment {
  id: string;
  title: string;
}

export function MyStudentsWithTasks() {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAssignments, setStudentAssignments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [studentsRes, assignmentsRes] = await Promise.all([
        apiClient.getMyStudents(),
        apiClient.getAssignments()
      ]);
      setStudents(studentsRes.students || []);
      setAssignments(assignmentsRes.assignments || []);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      // Solo mostrar error si NO es por "No user logged in" (modo demo)
      if (errorMessage !== 'No user logged in') {
        console.error('Error loading data:', error);
      } else {
        console.log('Demo mode - no students available yet');
        setStudents([]);
        setAssignments([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openAssignDialog = async (student: Student) => {
    setSelectedStudent(student);
    
    // Load all assignments and check which are assigned to this student
    const assignedToStudent: string[] = [];
    for (const assignment of assignments) {
      try {
        const { studentIds } = await apiClient.getAssignedStudents(assignment.id);
        if (studentIds.includes(student.id)) {
          assignedToStudent.push(assignment.id);
        }
      } catch (error) {
        console.error('Error checking assignment:', error);
      }
    }
    
    setStudentAssignments(assignedToStudent);
    setShowAssignDialog(true);
  };

  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAssignmentToggle = async (assignmentId: string) => {
    if (!selectedStudent) return;

    try {
      const isCurrentlyAssigned = studentAssignments.includes(assignmentId);
      const { studentIds } = await apiClient.getAssignedStudents(assignmentId);
      
      let newStudentIds;
      if (isCurrentlyAssigned) {
        // Remove student
        newStudentIds = studentIds.filter(id => id !== selectedStudent.id);
      } else {
        // Add student
        newStudentIds = [...studentIds, selectedStudent.id];
      }

      await apiClient.assignTask(assignmentId, newStudentIds);
      
      setStudentAssignments(prev =>
        isCurrentlyAssigned
          ? prev.filter(id => id !== assignmentId)
          : [...prev, assignmentId]
      );
      
      toast.success(isCurrentlyAssigned ? '✅ Tarea desasignada correctamente' : '✅ Tarea asignada correctamente');
    } catch (error) {
      console.error('Error toggling assignment:', error);
      toast.error('Error al actualizar asignación');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Mis Estudiantes</h2>
        <p className="text-gray-600">
          Gestiona las tareas asignadas a cada estudiante
        </p>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl mb-2">No tienes estudiantes asignados</h3>
            <p className="text-gray-600 text-center mb-4">
              Ve a la pestaña "Estudiantes" para asignar estudiantes a ti
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => {
            const assignedCount = assignments.filter(async (assignment) => {
              try {
                const { studentIds } = await apiClient.getAssignedStudents(assignment.id);
                return studentIds.includes(student.id);
              } catch {
                return false;
              }
            }).length;

            return (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p>{student.name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Miembro desde</span>
                      <span>{new Date(student.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openAssignDialog(student)}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Gestionar Tareas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              📚 Tareas para {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Asigna o desasigna tareas a este estudiante. Las tareas funcionan como plantillas que puedes asignar múltiples veces.
            </DialogDescription>
          </DialogHeader>

          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
              <h3 className="text-xl mb-2">No tienes tareas creadas</h3>
              <p className="text-gray-600 text-center">
                Crea tareas primero para poder asignarlas
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const isAssigned = studentAssignments.includes(assignment.id);
                  
                  return (
                    <div
                      key={assignment.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        isAssigned ? 'bg-green-50 border-green-200' : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className={`w-5 h-5 ${isAssigned ? 'text-green-600' : 'text-primary'}`} />
                        <div>
                          <p>{assignment.title}</p>
                          {isAssigned && (
                            <Badge variant="default" className="gap-1 mt-1 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              Ya asignada
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isAssigned ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignmentToggle(assignment.id)}
                              className="border-green-500 text-green-700 hover:bg-green-50"
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Asignar de nuevo
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAssignmentToggle(assignment.id)}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Desasignar
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAssignmentToggle(assignment.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Asignar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowAssignDialog(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
