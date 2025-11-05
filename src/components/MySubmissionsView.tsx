import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Award, Calendar, FileCheck } from 'lucide-react';

interface MySubmissionsViewProps {
  submissions: any[];
  assignments: any[];
  onRefresh: () => void;
}

export function MySubmissionsView({ submissions, assignments, onRefresh }: MySubmissionsViewProps) {
  const getAssignmentTitle = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    return assignment?.title || 'Tarea eliminada';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-primary';
    if (grade >= 70) return 'bg-secondary';
    if (grade >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (submissions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl mb-2">Mis Entregas</h2>
          <p className="text-gray-600">Revisa tus tareas entregadas y calificaciones</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl mb-2">No has entregado tareas</h3>
            <p className="text-gray-600 text-center">
              Tus entregas aparecerán aquí una vez que completes las tareas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Mis Entregas</h2>
        <p className="text-gray-600">Revisa tus tareas entregadas y calificaciones</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {submissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{getAssignmentTitle(submission.assignmentId)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                Entregado: {new Date(submission.submittedAt).toLocaleDateString('es-ES')}
              </div>

              {submission.grade !== null ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Calificación</span>
                        <Badge className={`${getGradeColor(submission.grade)} text-white`}>
                          {submission.grade}/100
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getGradeColor(submission.grade)}`}
                          style={{ width: `${submission.grade}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {submission.feedback && (
                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                      <p className="text-sm mb-1">Retroalimentación del profesor:</p>
                      <p className="text-sm text-gray-700">{submission.feedback}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Calificado el {new Date(submission.gradedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800">
                    Tu entrega está siendo revisada por el profesor
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
