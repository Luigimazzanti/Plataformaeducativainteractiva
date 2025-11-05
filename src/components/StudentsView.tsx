import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Users, Mail } from 'lucide-react';

export function StudentsView() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const { students: myStudents } = await apiClient.getMyStudents();
      setStudents(myStudents || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Cargando estudiantes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Todos los Estudiantes</h2>
        <p className="text-muted-foreground">
          Gestiona los estudiantes asignados a ti. Solo podrás asignar tareas a estudiantes que estén asignados.
        </p>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4">
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="mb-1 text-blue-900 dark:text-blue-100">ℹ️ Estudiantes asignados</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Solo puedes ver los estudiantes que el administrador te haya asignado.
                Contacta al administrador para que te asigne más estudiantes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl mb-2">No hay estudiantes registrados</h3>
            <p className="text-muted-foreground text-center">
              Los estudiantes aparecerán aquí cuando se registren
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{student.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Badge variant={student.isAssignedToMe ? 'default' : 'secondary'}>
                      {student.isAssignedToMe ? 'Asignado' : 'No asignado'}
                    </Badge>
                    <p className="text-xs text-muted-foreground truncate ml-2">
                      {new Date(student.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
