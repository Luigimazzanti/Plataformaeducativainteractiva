import { useState, useEffect } from 'react';
import { Award, Calendar, FileCheck, Eye, FileText, Download, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { FullScreenPDFEditor } from './FullScreenPDFEditor';
import { NotificationManager } from '../utils/notifications';
import { AuthManager } from '../utils/auth-manager';

interface MySubmissionsViewProps {
  submissions: any[];
  assignments: any[];
  onRefresh: () => void;
  userId: string;
}

export function MySubmissionsView({ submissions, assignments, onRefresh, userId }: MySubmissionsViewProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [viewingCorrections, setViewingCorrections] = useState(false);
  const [viewingPDF, setViewingPDF] = useState(false);
  const [viewedFeedback, setViewedFeedback] = useState<Set<string>>(new Set());
  
  // Cargar feedback visto desde localStorage al montar el componente
  useEffect(() => {
    console.log('🔔 [MySubmissions] Cargando feedback para userId:', userId);
    const viewed = NotificationManager.getViewedFeedback(userId);
    setViewedFeedback(viewed);
    console.log('🔔 [MySubmissions] ✅ Feedback visto cargado:', {
      userId,
      count: viewed.size,
      ids: [...viewed]
    });
  }, [userId]);

  const getAssignment = (assignmentId: string) => {
    return assignments.find((a) => a.id === assignmentId);
  };

  const getAssignmentTitle = (submission: any) => {
    // Priorizar el título guardado en la submission (independiente)
    if (submission.assignmentTitle) {
      return submission.assignmentTitle;
    }
    // Fallback: buscar en las tareas actuales
    const assignment = getAssignment(submission.assignmentId);
    return assignment?.title || 'Tarea sin título';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-primary';
    if (grade >= 70) return 'bg-secondary';
    if (grade >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleViewCorrections = (submission: any) => {
    // Usar los datos de la tarea guardados en la submission si existen
    // Si no, intentar obtener la tarea actual (para compatibilidad con submissions antiguas)
    const assignment = submission.assignmentTitle ? {
      title: submission.assignmentTitle,
      type: submission.assignmentType,
      description: submission.assignmentDescription,
      questions: submission.assignmentQuestions,
      files: submission.assignmentFiles,
      formFields: submission.assignmentFormFields,
    } : getAssignment(submission.assignmentId);
    
    setSelectedSubmission({ ...submission, assignment });
    
    // Marcar el feedback como visto
    if (submission.feedback || submission.grade !== null) {
      console.log('🔔 [MySubmissions] Marcando como visto:', {
        userId,
        submissionId: submission.id
      });
      NotificationManager.markAsViewed(userId, submission.id);
      // Actualizar el estado local inmediatamente
      setViewedFeedback(prev => {
        const newSet = new Set(prev);
        newSet.add(submission.id);
        console.log('🔔 [MySubmissions] ✅ Estado local actualizado:', {
          count: newSet.size,
          ids: [...newSet]
        });
        return newSet;
      });
      onRefresh(); // Recargar para actualizar el contador
    }
    
    // Si es PDF, abrir el visor PDF
    const hasPDF = assignment?.files && assignment.files.some((f: any) => 
      f.type?.includes('pdf') || f.name?.toLowerCase().endsWith('.pdf')
    );
    
    if (hasPDF) {
      setViewingPDF(true);
    } else {
      setViewingCorrections(true);
    }
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
              Tus Entregas aparecerán aquí una vez que completes las tareas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl mb-2 truncate">Mis Entregas</h2>
          <p className="text-sm text-muted-foreground">Revisa tus tareas entregadas y calificaciones</p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {submissions.map((submission) => {
            // Usar datos guardados en la submission (independiente de la tarea original)
            const assignmentData = submission.assignmentTitle ? {
              title: submission.assignmentTitle,
              type: submission.assignmentType,
              files: submission.assignmentFiles,
            } : getAssignment(submission.assignmentId);
            
            const hasPDF = assignmentData?.files && assignmentData.files.some((f: any) => 
              f.type?.includes('pdf') || f.name?.toLowerCase().endsWith('.pdf')
            );
            // Verificar si tiene feedback Y no ha sido visto (usando estado local)
            const hasFeedback = !!(submission.feedback || (submission.grade !== null && submission.grade !== undefined));
            const isNewFeedback = hasFeedback && !viewedFeedback.has(submission.id);
            
            return (
              <Card key={submission.id} className={`hover:shadow-lg transition-shadow ${isNewFeedback ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg line-clamp-2 break-words flex-1">
                      {getAssignmentTitle(submission)}
                    </CardTitle>
                    {isNewFeedback && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                          ¡Nuevo Feedback!
                        </p>
                        <div className="relative">
                          <Bell className="w-5 h-5 text-red-500 animate-pulse" />
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">
                      Entregado: {new Date(submission.submittedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {submission.grade !== null && submission.grade !== undefined ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <span className="text-xs sm:text-sm truncate">Calificación</span>
                            <Badge className={`${getGradeColor(submission.grade)} text-white text-xs flex-shrink-0`}>
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

                      {submission.gradedAt && (
                        <p className="text-xs text-muted-foreground">
                          Calificado el {new Date(submission.gradedAt).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}

                      {/* Botón Ver Correcciones */}
                      <Button
                        onClick={() => handleViewCorrections(submission)}
                        className="w-full text-sm bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#65a30d] hover:to-[#4d7c0f]"
                      >
                        {hasPDF ? (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Ver PDF Corregido</span>
                            <span className="sm:hidden">PDF Corregido</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Ver Mis Respuestas</span>
                            <span className="sm:hidden">Ver Respuestas</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4 text-center">
                      <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                        Tu entrega está siendo revisada por el profesor
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dialog para ver correcciones de formularios/actividades */}
      {selectedSubmission && selectedSubmission.assignment && (
        <Dialog 
          open={viewingCorrections} 
          onOpenChange={(open) => {
            setViewingCorrections(open);
            if (!open && onRefresh) {
              // Refrescar cuando se cierra el diálogo para actualizar contador
              onRefresh();
            }
          }}
        >
          <DialogContent 
            className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Eye className="w-5 h-5 text-primary" />
                Mis Respuestas Corregidas
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Revisa tus respuestas y el feedback del profesor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Título de la tarea */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {selectedSubmission.assignment.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Entregado el {new Date(selectedSubmission.submittedAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                </p>
              </div>

              {/* Calificación */}
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Calificación Final</p>
                      <div className="flex items-center gap-3">
                        <Award className="w-8 h-8 text-yellow-500" />
                        <span className="text-4xl font-bold text-yellow-700">
                          {selectedSubmission.grade}/100
                        </span>
                      </div>
                    </div>
                    <Badge 
                      className={`${getGradeColor(selectedSubmission.grade)} text-white text-lg px-4 py-2`}
                    >
                      {selectedSubmission.grade >= 90 ? '🌟 Excelente' :
                       selectedSubmission.grade >= 70 ? '👍 Muy Bien' :
                       selectedSubmission.grade >= 50 ? '⚠️ Regular' : '❌ Necesitas Mejorar'}
                    </Badge>
                  </div>
                  
                  {selectedSubmission.feedback && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-yellow-300">
                      <p className="text-sm font-medium mb-2">💬 Feedback del Profesor:</p>
                      <p className="text-sm text-gray-700">{selectedSubmission.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Respuestas */}
              <div>
                <h4 className="font-semibold mb-4 text-lg">Tus Respuestas:</h4>
                
                {/* Para IA Quiz */}
                {selectedSubmission.assignment.type === 'ia-quiz' && selectedSubmission.assignment.questions ? (
                  <div className="space-y-4">
                    {selectedSubmission.assignment.questions.map((question: any, idx: number) => {
                      const answers = JSON.parse(selectedSubmission.content || '{}');
                      const studentAnswer = answers[question.id];
                      const isCorrect = question.type === 'multiple-choice' 
                        ? studentAnswer === question.correctAnswer
                        : question.type === 'true-false'
                        ? studentAnswer === question.correctAnswer
                        : String(studentAnswer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();

                      return (
                        <Card key={question.id} className={isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                <span className="text-white font-bold text-sm">#{idx + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium mb-2">{question.question}</p>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={isCorrect ? 'bg-green-500' : 'bg-red-500'}>
                                      {isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="bg-white p-3 rounded border">
                                    <p className="text-sm text-gray-600 mb-1">Tu respuesta:</p>
                                    <p className="font-medium">
                                      {question.type === 'multiple-choice' && question.options
                                        ? question.options[studentAnswer]
                                        : question.type === 'true-false'
                                        ? (studentAnswer ? 'Verdadero' : 'Falso')
                                        : studentAnswer}
                                    </p>
                                  </div>
                                  
                                  {!isCorrect && (
                                    <div className="bg-green-100 p-3 rounded border border-green-300">
                                      <p className="text-sm text-gray-600 mb-1">Respuesta correcta:</p>
                                      <p className="font-medium text-green-700">
                                        {question.type === 'multiple-choice' && question.options
                                          ? question.options[question.correctAnswer]
                                          : question.type === 'true-false'
                                          ? (question.correctAnswer ? 'Verdadero' : 'Falso')
                                          : question.correctAnswer}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : selectedSubmission.assignment.type === 'form' || selectedSubmission.assignment.type === 'interactive' ? (
                  /* Para Formularios */
                  <div className="space-y-3">
                    {JSON.parse(selectedSubmission.content || '{}') && 
                      Object.entries(JSON.parse(selectedSubmission.content)).map(([key, value]: any, idx) => (
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-600 mb-1">{key}</p>
                            <p className="font-medium">
                              {Array.isArray(value) ? value.join(', ') : value}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  /* Para tarea regular */
                  <Card>
                    <CardContent className="p-4">
                      <p className="whitespace-pre-wrap">
                        {typeof selectedSubmission.content === 'string' 
                          ? selectedSubmission.content 
                          : selectedSubmission.content?.textResponse 
                            ? selectedSubmission.content.textResponse
                            : JSON.stringify(selectedSubmission.content, null, 2)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Visor PDF para correcciones */}
      {selectedSubmission && selectedSubmission.assignment && viewingPDF && (() => {
        console.log('🔥🔥🔥 [MySubmissions] ABRIENDO PDF PARA ESTUDIANTE:', {
          submissionId: selectedSubmission.id,
          studentId: selectedSubmission.studentId,
          status: selectedSubmission.status,
          isLocked: selectedSubmission.isLocked,
          isGraded: selectedSubmission.status === 'GRADED'
        });
        
        return (
          <FullScreenPDFEditor
            assignmentId={selectedSubmission.assignmentId}
            submissionId={selectedSubmission.id} // 🔥 CRÍTICO: Pasar submissionId para cargar correcciones
            assignmentTitle={selectedSubmission.assignment.title || 'Tarea PDF'}
            pdfUrl={selectedSubmission.assignment.files.find((f: any) => 
              f.type?.includes('pdf') || f.name?.toLowerCase().endsWith('.pdf')
            )?.url || ''}
            userRole="student"
            userId={selectedSubmission.studentId || userId || AuthManager.getUserId() || 'student-1'} // 🔥 USAR EL MISMO STUDENT_ID QUE LA SUBMISSION
            userName={localStorage.getItem('user_name') || 'Estudiante'}
            isGraded={selectedSubmission.status === 'GRADED'} // 🔥 ARREGLADO: Comparar con MAYÚSCULAS
            isLocked={selectedSubmission.isLocked === true}
            onClose={() => {
              setViewingPDF(false);
              if (onRefresh) {
                onRefresh();
              }
            }}
          />
        );
      })()}
    </>
  );
}