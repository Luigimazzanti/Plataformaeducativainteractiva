import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart3, Award, Eye, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { DynamicForm } from './DynamicForm';
import { toast } from 'sonner@2.0.3';

interface GradesViewProps {
  assignments: any[];
}

export function GradesView({ assignments }: GradesViewProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<any | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (selectedAssignment && selectedAssignment !== 'all') {
      loadSubmissions(selectedAssignment);
    }
  }, [selectedAssignment]);

  const loadSubmissions = async (assignmentId: string) => {
    try {
      setIsLoading(true);
      const { submissions: data } = await apiClient.getAssignmentSubmissions(assignmentId);
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmission) return;

    try {
      await apiClient.gradeSubmission(gradingSubmission.id, {
        grade: parseInt(grade),
        feedback
      });
      
      // Reload submissions
      if (selectedAssignment && selectedAssignment !== 'all') {
        await loadSubmissions(selectedAssignment);
      }
      
      setGradingSubmission(null);
      setGrade('');
      setFeedback('');
      toast.success('✅ Calificación guardada exitosamente');
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('❌ Error al guardar la calificación');
    }
  };

  const gradedSubmissions = submissions.filter((s) => s.grade !== null);
  const averageGrade =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((acc, s) => acc + s.grade, 0) / gradedSubmissions.length
      : 0;

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-primary bg-green-50';
    if (grade >= 70) return 'text-secondary bg-cyan-50';
    if (grade >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Calificaciones</h2>
        <p className="text-gray-600">Consulta y analiza las calificaciones de tus estudiantes</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una tarea" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las tareas</SelectItem>
              {assignments.map((assignment) => (
                <SelectItem key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedAssignment === 'all' ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl mb-2">Selecciona una tarea</h3>
            <p className="text-gray-600 text-center">
              Selecciona una tarea del menú para ver las calificaciones
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-secondary to-cyan-600 text-white">
              <CardContent className="p-6">
                <p className="text-cyan-100 text-sm mb-2">Total de Entregas</p>
                <p className="text-3xl">{submissions.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <p className="text-green-100 text-sm mb-2">Calificadas</p>
                <p className="text-3xl">{gradedSubmissions.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <p className="text-emerald-100 text-sm mb-2">Promedio</p>
                <p className="text-3xl">
                  {averageGrade > 0 ? averageGrade.toFixed(1) : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Submissions List */}
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl mb-2">No hay Entregas</h3>
                <p className="text-gray-600 text-center">
                  Las Entregas aparecerán aquí cuando los estudiantes completen la tarea
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{submission.studentName}</p>
                        <p className="text-sm text-gray-600">
                          Entregado: {new Date(submission.submittedAt).toLocaleDateString('es-ES')}
                        </p>
                        {submission.feedback && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            "{submission.feedback}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingSubmission(submission)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Respuestas
                        </Button>
                        <div className="text-right">
                          {submission.grade !== null ? (
                            <div>
                              <Badge
                                className={`text-lg px-4 py-2 ${getGradeColor(submission.grade)}`}
                              >
                                {submission.grade}/100
                              </Badge>
                              <p className="text-xs text-gray-500 mt-2">
                                {submission.gradedAt &&
                                  `Calificado el ${new Date(submission.gradedAt).toLocaleDateString('es-ES')}`}
                              </p>
                            </div>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setGradingSubmission(submission);
                                setGrade(submission.grade?.toString() || '');
                                setFeedback(submission.feedback || '');
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Calificar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Submission Dialog */}
      <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respuestas de {viewingSubmission?.studentName}</DialogTitle>
          </DialogHeader>
          {viewingSubmission && (() => {
            const assignment = assignments.find(a => a.id === viewingSubmission.assignmentId);
            let content;
            
            try {
              content = JSON.parse(viewingSubmission.content);
            } catch {
              content = viewingSubmission.content;
            }

            return (
              <div className="space-y-6">
                {assignment?.type === 'form' && assignment.formFields ? (
                  <DynamicForm
                    fields={assignment.formFields}
                    responses={content}
                    onChange={() => {}}
                    readOnly={true}
                  />
                ) : assignment?.type === 'interactive' && assignment.interactiveActivities ? (
                  <DynamicForm
                    interactiveActivities={assignment.interactiveActivities}
                    responses={content}
                    onChange={() => {}}
                    readOnly={true}
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="whitespace-pre-wrap">{viewingSubmission.content}</p>
                  </div>
                )}

                {viewingSubmission.grade !== null && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Calificación:</span>
                      <Badge className={`text-lg ${getGradeColor(viewingSubmission.grade)}`}>
                        {viewingSubmission.grade}/100
                      </Badge>
                    </div>
                    {viewingSubmission.feedback && (
                      <div className="mt-3">
                        <span className="font-medium">Feedback:</span>
                        <p className="text-sm mt-1">{viewingSubmission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog open={!!gradingSubmission} onOpenChange={() => setGradingSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calificar Entrega de {gradingSubmission?.studentName}</DialogTitle>
            <DialogDescription>
              Asigna una calificación y proporciona feedback opcional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Calificación (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (opcional)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Escribe tus comentarios para el estudiante..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setGradingSubmission(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGradeSubmission}
                disabled={!grade || parseInt(grade) < 0 || parseInt(grade) > 100}
              >
                Guardar Calificación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
