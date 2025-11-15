import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  FileCheck, 
  Clock, 
  User, 
  CheckCircle2, 
  Eye, 
  AlertCircle,
  Award,
  FileText,
  MessageSquare,
  Calendar,
  Gamepad2,
  ClipboardList,
  Video
} from 'lucide-react';
import { toast } from 'sonner';
import { PDFAnnotator } from './PDFAnnotator';
import { InteractiveActivityRenderer } from './InteractiveActivityRenderer';
import { AIQuizRenderer } from './AIQuizRenderer';
import { apiClient } from '../utils/api';

interface SubmissionsInboxViewProps {
  teacherId: string;
  onUpdateSubmission?: () => void;
}

export function SubmissionsInboxView({ teacherId, onUpdateSubmission }: SubmissionsInboxViewProps) {
  console.log('[SubmissionsInboxView] 🎯🎯🎯 COMPONENTE RENDERIZADO v2.1 - teacherId:', teacherId);
  console.log('[SubmissionsInboxView] 🎯 Timestamp:', new Date().toISOString());
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para revisión
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [gradeValue, setGradeValue] = useState('');
  const [feedback, setFeedback] = useState('');

  console.log('[SubmissionsInboxView] ⚡ Antes del useEffect - submissions.length:', submissions.length);
  console.log('[SubmissionsInboxView] ⚡ isLoading:', isLoading);

  const loadSubmissions = async () => {
    console.log('[SubmissionsInbox] 🚀🚀🚀 FUNCIÓN loadSubmissions LLAMADA');
    setIsLoading(true);
    
    try {
      console.log('[SubmissionsInbox] 🚀 Iniciando carga de entregas...');
      
      // Cargar asignaciones
      console.log('[SubmissionsInbox] 📋 Llamando getAssignments...');
      const assignmentsResponse = await apiClient.getAssignments();
      console.log('[SubmissionsInbox] ✅ Respuesta de assignments:', assignmentsResponse);
      
      // Normalizar respuestas
      const assignmentsList = assignmentsResponse?.assignments || [];
      console.log('[SubmissionsInbox] 📊 Tareas normalizadas:', assignmentsList.length);
      
      // Filtrar tareas del profesor
      const teacherAssignments = assignmentsList.filter((a: any) => a.teacherId === teacherId);
      console.log('[SubmissionsInbox] 🎓 Tareas del profesor:', teacherAssignments.length, 'de', assignmentsList.length);
      
      // Cargar entregas de cada tarea
      const allSubmissions: any[] = [];
      const studentsMap = new Map(); // Para acumular estudiantes únicos
      let successCount = 0;
      let errorCount = 0;
      
      for (const assignment of teacherAssignments) {
        try {
          console.log(`[SubmissionsInbox] 📝 Cargando entregas para: "${assignment.title}" (${assignment.id})`);
          const submissionsResponse = await apiClient.getAssignmentSubmissions(assignment.id);
          const submissions = submissionsResponse?.submissions || [];
          
          console.log(`[SubmissionsInbox]   → Encontradas ${submissions.length} entregas`);
          console.log(`[SubmissionsInbox]   → Detalle:`, submissions);
          
          if (submissions && submissions.length > 0) {
            // Agregar todas las entregas con información de la tarea
            const enrichedSubmissions = submissions.map((s: any) => {
              // Extraer info del estudiante si viene en la submission
              if (s.student) {
                studentsMap.set(s.studentId, s.student);
              }
              
              return {
                ...s,
                assignmentTitle: assignment.title,
                assignmentId: assignment.id
              };
            });
            allSubmissions.push(...enrichedSubmissions);
            successCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`[SubmissionsInbox] ❌ Error loading submissions for "${assignment.title}":`, error);
          // Continuar con las demás tareas
        }
      }
      
      console.log('[SubmissionsInbox] 📈 Resumen: Total entregas cargadas:', allSubmissions.length);
      console.log('[SubmissionsInbox] 📈 Tareas procesadas exitosamente:', successCount);
      console.log('[SubmissionsInbox] 📈 Tareas con errores:', errorCount);
      
      // Ordenar: primero SUBMITTED, luego por fecha
      allSubmissions.sort((a: any, b: any) => {
        // Priorizar SUBMITTED sobre GRADED
        if (a.status === 'SUBMITTED' && b.status !== 'SUBMITTED') return -1;
        if (b.status === 'SUBMITTED' && a.status !== 'SUBMITTED') return 1;
        // Luego por fecha de envío
        return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
      });

      const pendingCount = allSubmissions.filter(s => s.status === 'SUBMITTED').length;
      const gradedCount = allSubmissions.filter(s => s.status === 'GRADED').length;
      
      console.log('[SubmissionsInbox] 📊 Entregas pendientes:', pendingCount);
      console.log('[SubmissionsInbox] 📊 Entregas calificadas:', gradedCount);

      setSubmissions(allSubmissions);
      setAssignments(teacherAssignments);
      
      const studentsArray = Array.from(studentsMap.values());
      setStudents(studentsArray);
      
      console.log('[SubmissionsInbox] 👥 Estudiantes cargados:', studentsArray.length, studentsArray);
      console.log('[SubmissionsInbox] 📋 Entregas finales:', allSubmissions.map(s => ({
        id: s.id,
        studentId: s.studentId,
        student: s.student,
        assignmentTitle: s.assignmentTitle
      })));
      console.log('[SubmissionsInbox] ✅ ¡Carga completada exitosamente!');
    } catch (error: any) {
      console.error('[SubmissionsInbox] ❌❌❌ ERROR CRÍTICO:', error);
      console.error('[SubmissionsInbox] Error message:', error?.message);
      console.error('[SubmissionsInbox] Error stack:', error?.stack);
      
      // No mostrar toast de error si el modo demo se activa automáticamente
      if (!(error instanceof Error && error.message === 'DEMO_MODE')) {
        toast.error(`Error al cargar las Entregas: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
      console.log('[SubmissionsInbox] 🏁 Proceso de carga finalizado');
    }
  };

  // useEffect para cargar entregas al montar
  useEffect(() => {
    console.log('[SubmissionsInboxView] 🔄🔄🔄 useEffect EJECUTADO - teacherId:', teacherId);
    console.log('[SubmissionsInboxView] 🔄 Iniciando loadSubmissions()...');
    
    if (!teacherId) {
      console.warn('[SubmissionsInboxView] ⚠️ teacherId vacío, esperando...');
      return;
    }
    
    loadSubmissions();
    
    // Listen for new submissions (real-time update)
    const handleSubmissionAdded = (e: CustomEvent) => {
      console.log('[SubmissionsInbox] 🔔 Nueva entrega detectada, recargando...', e.detail);
      loadSubmissions();
    };
    
    window.addEventListener('submission-added', handleSubmissionAdded as EventListener);
    
    return () => {
      window.removeEventListener('submission-added', handleSubmissionAdded as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const getAssignmentTitle = (submission: any) => {
    // Priorizar el título guardado en la submission (independiente)
    if (submission.assignmentTitle) {
      return submission.assignmentTitle;
    }
    // Fallback: buscar en las tareas actuales
    const assignment = assignments.find((a) => a.id === submission.assignmentId);
    return assignment?.title || 'Sin título';
  };

  const getStudentName = (submission: any) => {
    // Primero intentar usar los datos embebidos en la submission
    if (submission.student?.name) {
      return submission.student.name;
    }
    if (submission.studentName) {
      return submission.studentName;
    }
    
    // Fallback: buscar en la lista de estudiantes
    const student = students.find((s) => s.id === submission.studentId);
    console.log('[SubmissionsInbox] 👤 getStudentName fallback:', { 
      submissionId: submission.id,
      studentId: submission.studentId, 
      student, 
      allStudents: students,
      submissionData: submission
    });
    return student?.name || 'Estudiante desconocido';
  };

  const getAssignment = (assignmentId: string) => {
    return assignments.find((a) => a.id === assignmentId);
  };

  const handleOpenReview = (submission: any) => {
    console.log('[SubmissionsInbox] 🔍 Abriendo revisión:', {
      submissionId: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      status: submission.status,
      currentAssignments: assignments.length
    });

    setSelectedSubmission(submission);
    setGradeValue(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
    setShowReviewDialog(true);
  };

  const handleGradeSubmit = async (grade: number, feedbackText: string) => {
    if (!selectedSubmission) return;

    try {
      console.log('[SubmissionsInbox] 📝 Calificando entrega:', {
        submissionId: selectedSubmission.id,
        grade,
        feedback: feedbackText
      });

      await apiClient.gradeSubmission(selectedSubmission.id, {
        grade,
        feedback: feedbackText
      });

      console.log('[SubmissionsInbox] ✅ Calificación guardada exitosamente');
      toast.success('✅ Calificación guardada exitosamente');
      setShowReviewDialog(false);
      setSelectedSubmission(null);
      loadSubmissions();
      if (onUpdateSubmission) onUpdateSubmission();
    } catch (error) {
      console.error('[SubmissionsInbox] ❌ Error grading submission:', error);
      toast.error('Error al guardar la calificación');
    }
  };

  const handleFinalizeReview = () => {
    const grade = parseFloat(gradeValue);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error('Por favor ingrese una nota válida entre 0 y 100');
      return;
    }
    handleGradeSubmit(grade, feedback);
  };

  // Mostrar SOLO entregas pendientes (SUBMITTED)
  const pendingSubmissions = submissions.filter((s) => s.status === 'SUBMITTED');
  const pendingCount = pendingSubmissions.length;

  const getTypeIcon = (assignment: any) => {
    if (!assignment) return <FileText className="w-5 h-5" />;
    switch (assignment.type) {
      case 'ia-quiz':
      case 'ai-quiz':
      case 'ai-generated':
        return <FileText className="w-5 h-5 text-[#84cc16]" />;
      case 'interactive':
        return <Gamepad2 className="w-5 h-5" />;
      case 'form':
        return <ClipboardList className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeBadge = (assignment: any) => {
    if (!assignment) return <Badge variant="secondary">Estándar</Badge>;
    switch (assignment.type) {
      case 'ia-quiz':
      case 'ai-quiz':
      case 'ai-generated':
        return <Badge className="bg-[#84cc16] text-white border-0">Generado con IA</Badge>;
      case 'interactive':
        return <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0">Interactivo</Badge>;
      case 'form':
        return <Badge variant="secondary">Formulario</Badge>;
      case 'video':
        return <Badge variant="secondary">Video</Badge>;
      default:
        return <Badge variant="secondary">Estándar</Badge>;
    }
  };

  const renderSubmissionContent = (submission: any) => {
    console.log('[SubmissionsInbox] 🎨 renderSubmissionContent llamado:', {
      submissionId: submission.id,
      assignmentId: submission.assignmentId,
      assignmentsCount: assignments.length
    });

    const assignment = getAssignment(submission.assignmentId);
    
    if (!assignment) {
      console.warn('[SubmissionsInbox] ⚠️ No se encontró la tarea:', {
        assignmentId: submission.assignmentId,
        availableAssignments: assignments.map(a => ({ id: a.id, title: a.title }))
      });
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No se pudo cargar la información de la tarea</p>
          <p className="text-sm mt-2">ID: {submission.assignmentId}</p>
        </div>
      );
    }

    console.log('[SubmissionsInbox] ✅ Tarea encontrada:', {
      id: assignment.id,
      title: assignment.title,
      type: assignment.type
    });

    // PDF
    if (assignment.type === 'pdf' && assignment.fileUrl) {
      return (
        <PDFAnnotator
          pdfUrl={assignment.fileUrl}
          assignmentId={assignment.id}
          open={true}
          onOpenChange={() => setShowReviewDialog(false)}
          readOnly={false}
          isTeacher={true}
          studentId={submission.studentId}
          initialAnnotations={submission.content?.annotations || []}
        />
      );
    }

    // Actividad Interactiva
    if (assignment.type === 'interactive' && assignment.content) {
      return (
        <div className="space-y-4">
          <InteractiveActivityRenderer
            activity={assignment.content}
            onComplete={(responses) => {
              console.log('Respuestas del estudiante:', responses);
            }}
            readOnly={true}
            studentResponses={submission.content?.responses}
          />
        </div>
      );
    }

    // Quiz IA
    if (assignment.type === 'ai-quiz' && assignment.content?.questions) {
      return (
        <div className="space-y-4">
          <AIQuizRenderer
            quiz={assignment.content}
            onComplete={(responses) => {
              console.log('Respuestas del estudiante:', responses);
            }}
            readOnly={true}
            studentResponses={submission.content?.responses}
          />
        </div>
      );
    }

    // Texto simple
    if (assignment.type === 'text') {
      return (
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Instrucciones:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>
          {submission.content?.textResponse && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Respuesta del estudiante:</h4>
              <p className="text-sm whitespace-pre-wrap">{submission.content.textResponse}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Tipo de asignación no soportado para revisión</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Cargando Entregas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header con contador */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="min-w-0 text-center">
          <h2 className="text-2xl sm:text-3xl flex items-center justify-center gap-3 flex-wrap">
            <span>📥 Entregas</span>
            {pendingCount > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse flex-shrink-0 text-base px-3 py-1">
                {pendingCount}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            Revisa y califica las entregas de tus estudiantes
          </p>
        </div>
      </div>

      {/* Lista de Entregas Pendientes en Grid */}
      {pendingSubmissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl mb-2">No hay Entregas Pendientes</h3>
            <p className="text-muted-foreground text-center">
              No hay entregas esperando revisión
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Debug: {submissions.length} entregas totales, {assignments.length} tareas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingSubmissions.map((submission) => {
            const assignment = getAssignment(submission.assignmentId);
            const isGraded = submission.status === 'GRADED';
            const isPending = submission.status === 'SUBMITTED';
            const isOverdue = assignment?.dueDate && new Date(assignment.dueDate) < new Date();

            return (
              <Card 
                key={submission.id}
                className="hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={() => handleOpenReview(submission)}
              >
                {/* Badge de notificación en la esquina - solo para pendientes */}
                {isPending && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="relative">
                      <div className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-xs font-bold">!</span>
                      </div>
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                  </div>
                )}

                {/* Badge de calificación en la esquina - solo para calificadas */}
                {isGraded && submission.grade !== null && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg font-bold text-sm">
                      {submission.grade}
                    </div>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="p-2 bg-accent rounded-lg text-primary flex-shrink-0">
                        {getTypeIcon(assignment)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg line-clamp-2 break-words mb-1">
                          {getAssignmentTitle(submission)}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{getStudentName(submission)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Badges en una sola línea - SIN descripción */}
                  <div className="flex gap-2 items-center mb-4 overflow-x-auto whitespace-nowrap">
                    {/* Badge de tipo */}
                    <div className="flex-shrink-0">
                      {getTypeBadge(assignment)}
                    </div>

                    {/* Badge de fecha de vencimiento de la tarea */}
                    {assignment?.dueDate && (
                      <Badge variant={isOverdue ? 'destructive' : 'outline'} className="text-xs flex-shrink-0">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{new Date(assignment.dueDate).toLocaleDateString('es-ES')}</span>
                      </Badge>
                    )}
                  </div>

                  {/* Info adicional */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      Entregado: {submission.submittedAt && new Date(submission.submittedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={isPending ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 min-w-[120px] ${isPending ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReview(submission);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="text-xs sm:text-sm">{isPending ? 'Revisar' : 'Ver'}</span>
                    </Button>
                    {isGraded && (
                      <div className="flex items-center gap-1 text-green-600 font-semibold text-sm px-2">
                        <Award className="w-4 h-4" />
                        <span>{submission.grade}/100</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Diálogo de revisión */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="truncate">Revisión de Entrega</span>
            </DialogTitle>
            {selectedSubmission && (
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-2 flex-wrap">
                <div className="flex items-center gap-1 truncate">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{getStudentName(selectedSubmission)}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">{new Date(selectedSubmission.submittedAt).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {selectedSubmission && renderSubmissionContent(selectedSubmission)}
          </div>

          {/* Barra de calificación - Mostrar siempre para permitir modificar nota/comentarios */}
          <div className="border-t p-4 sm:p-6 bg-muted/50">
            <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade" className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-primary" />
                    Nota Final (0-100)
                  </Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max="100"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    placeholder="Ingrese la nota"
                    className="text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback" className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Feedback
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Comentarios para el estudiante..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinalizeReview}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {selectedSubmission?.status === 'GRADED' ? 'Actualizar Calificación' : 'Finalizar Revisión'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
