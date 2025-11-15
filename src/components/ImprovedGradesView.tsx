import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { NotificationManager } from '../utils/notifications';
import { 
  User, 
  Award, 
  FileCheck, 
  Clock, 
  TrendingUp,
  MessageSquare,
  Eye,
  CheckCircle2,
  X,
  Bell,
  Download,
  Edit,
  FileText,
  Paperclip
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { FullScreenPDFEditor } from './FullScreenPDFEditor';
import { InteractiveActivityRenderer } from './InteractiveActivityRenderer';
import { PDFVersionManager } from './PDFVersionManager';

interface ImprovedGradesViewProps {
  assignments: any[];
  onViewSubmission?: () => void;
}

export function ImprovedGradesView({ assignments, onViewSubmission }: ImprovedGradesViewProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [studentSubmissions, setStudentSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [viewingSubmission, setViewingSubmission] = useState<any | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [viewingPDF, setViewingPDF] = useState(false);
  const [teacherAnnotations, setTeacherAnnotations] = useState<any[]>([]);
  const [studentAnnotations, setStudentAnnotations] = useState<any[]>([]);
  const [submissionSummary, setSubmissionSummary] = useState<any>(null);
  const [viewedSubmissions, setViewedSubmissions] = useState<Set<string>>(new Set());
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [editingPDFWithCanva, setEditingPDFWithCanva] = useState(false);

  // 🔧 ARREGLO: Inicializar SOLO UNA VEZ cuando el componente se monta
  useEffect(() => {
    const initializeView = async () => {
      console.log('📊 [GradesView] Inicializando vista...');
      setIsInitializing(true);
      
      try {
        // 🚀 CARGAR TODO EN PARALELO
        const [viewedSubs, studentsData] = await Promise.all([
          // Cargar entregas vistas desde NotificationManager
          Promise.resolve(NotificationManager.getViewedSubmissions()),
          // Cargar estudiantes
          apiClient.getMyStudents().catch(() => ({ students: [] }))
        ]);
        
        setViewedSubmissions(viewedSubs);
        setStudents(studentsData.students || []);
        
        console.log('📊 [GradesView] ✅ Inicialización completa:', {
          viewedCount: viewedSubs.size,
          studentsCount: studentsData.students?.length || 0
        });
      } catch (error) {
        console.error('❌ [GradesView] Error en inicialización:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeView();

    // 🔔 Escuchar eventos custom (sin auto-refresh agresivo)
    const handleSubmissionAdded = () => {
      console.log('📊 [GradesView] Nueva entrega detectada, recargando...');
      if (assignments.length > 0) {
        loadAllSubmissions();
      }
    };

    window.addEventListener('submission-added', handleSubmissionAdded as EventListener);

    return () => {
      window.removeEventListener('submission-added', handleSubmissionAdded as EventListener);
    };
  }, []); // Solo al montar

  // 🔧 ARREGLO: Cargar entregas cuando cambien las tareas (assignments)
  useEffect(() => {
    if (assignments.length > 0 && !isInitializing) {
      console.log('📊 [GradesView] ⚡ Cargando entregas inmediatamente para', assignments.length, 'tareas');
      // 🚀 NO ESPERAR - cargar inmediatamente
      loadAllSubmissions();
    }
  }, [assignments.length, isInitializing]); // Cuando cambie el número de tareas O termine la inicialización

  // 🔧 ARREGLO: Cargar entregas del estudiante cuando cambie la selección
  useEffect(() => {
    if (selectedStudent && assignments.length > 0 && !isInitializing) {
      console.log('📊 [GradesView] Cargando entregas del estudiante:', selectedStudent);
      loadStudentSubmissions(selectedStudent);
    } else if (selectedStudent && assignments.length === 0) {
      console.warn('⚠️ [GradesView] No hay tareas disponibles aún');
      setStudentSubmissions([]);
      setIsLoading(false);
    }
  }, [selectedStudent, assignments.length, allSubmissions.length]); // 🚀 AGREGAR allSubmissions.length para reaccionar cuando se carguen

  const loadStudents = async () => {
    try {
      const { students: data } = await apiClient.getMyStudents();
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // 🚀 OPTIMIZACIÓN CRÍTICA: Usar getAllTeacherSubmissions() en lugar de múltiples llamadas
  const loadAllSubmissions = async () => {
    // 🔧 ARREGLO: Verificar que hay tareas ANTES de intentar cargar
    if (!assignments || assignments.length === 0) {
      console.log('⏭️ [GradesView] No hay tareas, saltando loadAllSubmissions');
      setAllSubmissions([]);
      return;
    }

    try {
      console.log('🚀 [GradesView] Cargando TODAS las entregas...');
      
      // 🔥 SIMPLE: Cargar submissions directamente
      const allSubs: any[] = [];
      
      // Cargar submissions de cada tarea
      for (const assignment of assignments) {
        try {
          const { submissions } = await apiClient.getAssignmentSubmissions(assignment.id);
          console.log(`✅ Tarea "${assignment.title}": ${submissions?.length || 0} entregas`);
          
          if (submissions && submissions.length > 0) {
            // Agregar info de la tarea a cada submission
            submissions.forEach((sub: any) => {
              allSubs.push({
                ...sub,
                assignmentTitle: assignment.title,
                assignmentType: assignment.type,
              });
            });
          }
        } catch (err) {
          console.error(`❌ Error cargando entregas de ${assignment.title}:`, err);
        }
      }
      
      console.log('✅ [GradesView] Total entregas cargadas:', allSubs.length);
      setAllSubmissions(allSubs);
      
    } catch (error: any) {
      console.error('❌ [GradesView] Error loading all submissions:', error);
      setAllSubmissions([]);
    }
  };

  // 🚀 OPTIMIZACIÓN: Filtrar desde allSubmissions en lugar de hacer N consultas
  const loadStudentSubmissions = async (studentId: string) => {
    // 🔧 ARREGLO: Verificar que hay tareas ANTES de intentar cargar
    if (!assignments || assignments.length === 0) {
      console.log('⏭️ [GradesView] No hay tareas, saltando loadStudentSubmissions');
      setStudentSubmissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('⚡ [GradesView] 🔍 DEBUG - Filtrando entregas:', {
        studentId,
        totalSubmissions: allSubmissions.length,
        submissionsWithStudentIds: allSubmissions.map(s => ({
          id: s.id,
          studentId: s.studentId,
          assignmentId: s.assignmentId,
          match: s.studentId === studentId
        }))
      });
      
      // 🚀 OPTIMIZACIÓN CRÍTICA: SIEMPRE filtrar desde allSubmissions (sin fallback recursivo)
      const studentSubs = allSubmissions
        .filter((s: any) => {
          const matches = s.studentId === studentId;
          console.log('🔍 Comparando:', { subStudentId: s.studentId, selectedStudent: studentId, matches });
          return matches;
        })
        .map((sub: any) => {
          const assignment = assignments.find(a => a.id === sub.assignmentId);
          return {
            ...sub,
            assignmentTitle: sub.assignmentTitle || assignment?.title,
            assignmentType: sub.assignmentType || assignment?.type,
            assignmentQuestions: sub.assignmentQuestions || assignment?.questions,
            assignmentContent: sub.assignmentContent || assignment?.content,
            assignmentFiles: sub.assignmentFiles || assignment?.files,
            assignmentFileUrl: sub.assignmentFileUrl || assignment?.fileUrl,
            assignmentDescription: sub.assignmentDescription || assignment?.description,
            assignmentFormFields: sub.assignmentFormFields || assignment?.formFields,
          };
        });
      
      console.log('✅ [GradesView] Entregas encontradas:', {
        count: studentSubs.length,
        submissions: studentSubs
      });
      
      setStudentSubmissions(studentSubs);
    } catch (error) {
      console.error('❌ Error loading student submissions:', error);
      setStudentSubmissions([]);
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
      
      // Reload
      if (selectedStudent) {
        await loadStudentSubmissions(selectedStudent);
      }
      
      setGradingSubmission(null);
      setGrade('');
      setFeedback('');
      toast.success('✅ Calificación guardada exitosamente');
    } catch (error) {
      console.error('Error grading:', error);
      toast.error('❌ Error al guardar la calificación');
    }
  };

  const handleViewSubmission = async (submission: any) => {
    // NO mostrar nada todavía, primero calcular todo
    setIsLoading(true);
    
    // Marcar esta entrega como vista
    console.log('📊 [GradesView] Marcando entrega como vista:', { id: submission.id, student: submission.studentId });
    NotificationManager.markSubmissionAsViewed(submission.id);
    setViewedSubmissions(NotificationManager.getViewedSubmissions());
    
    // Notificar al padre para que actualice el contador
    if (onViewSubmission) {
      onViewSubmission();
    }
    
    // 🔧 DEBUG: Ver archivos de la submission
    console.log('📊 [GradesView] 📄 ARCHIVOS EN SUBMISSION:', {
      'submission.files': submission.files,
      'files count': submission.files?.length || 0,
      'has files': !!submission.files,
      'assignmentFiles': submission.assignmentFiles,
      'assignmentFileUrl': submission.assignmentFileUrl
    });
    
    // DEBUG: Ver qué tipo de tarea es
    console.log('📊 [GradesView] Datos de la entrega:', {
      assignmentType: submission.assignmentType,
      hasContent: !!submission.content,
      hasQuestions: !!(submission.assignmentQuestions || submission.assignmentContent?.questions),
      hasFiles: !!(submission.assignmentFiles || submission.assignmentFileUrl),
      content: submission.content,
      submission
    });
    
    // DEBUG COMPLETO: Ver el objeto entero
    console.log('📊 [GradesView] SUBMISSION COMPLETO:', JSON.stringify(submission, null, 2));
    
    // Calcular resumen según el tipo de asignación
    let summary: any = {};
    let shouldShowPDF = false;
    
    // Detectar si hay archivos PDF (para tipo "standard" o "pdf")
    const hasPDFFile = submission.assignmentFiles?.some((f: any) => 
      f.type?.includes('pdf') || f.name?.toLowerCase().endsWith('.pdf')
    ) || submission.assignmentFileUrl;
    
    console.log('🔍 [GradesView] Detección de PDF:', {
      hasPDFFile,
      assignmentFiles: submission.assignmentFiles,
      filesDetailed: submission.assignmentFiles?.map((f: any) => ({
        name: f.name,
        type: f.type,
        isPDF_byType: f.type?.includes('pdf'),
        isPDF_byName: f.name?.toLowerCase().endsWith('.pdf')
      }))
    });
    
    // Si es PDF o tiene archivos PDF, cargar las anotaciones del estudiante Y del profesor
    if (submission.assignmentType === 'pdf' || hasPDFFile) {
      try {
        // 🔧 ARREGLO: Usar getPDFSessionAnnotations que usa la clave correcta
        // pdf_annotations_${assignmentId}_${studentId}
        const { annotations: studentAnns } = await apiClient.getPDFSessionAnnotations(
          submission.assignmentId,
          submission.studentId
        );
        
        console.log('📊 [GradesView] Anotaciones del estudiante cargadas:', {
          count: (studentAnns || []).length,
          annotations: studentAnns
        });
        
        setStudentAnnotations(studentAnns || []);
        
        // Para las anotaciones del profesor, por ahora mantener el array vacío
        // (las agregará cuando corrija)
        setTeacherAnnotations([]);
        
        summary = {
          studentAnnotationsCount: (studentAnns || []).length,
          teacherAnnotationsCount: 0,
          totalAnnotations: (studentAnns || []).length,
          hasPDFAttachment: hasPDFFile
        };
        
        shouldShowPDF = true;
      } catch (error) {
        console.error('Error loading annotations:', error);
        summary = {
          studentAnnotationsCount: 0,
          teacherAnnotationsCount: 0,
          totalAnnotations: 0,
          hasPDFAttachment: hasPDFFile
        };
        setTeacherAnnotations([]);
        setStudentAnnotations([]);
        shouldShowPDF = true;
      }
    }
    
    // Si es Quiz IA, calcular estadísticas
    if (submission.assignmentType === 'ia-quiz' || submission.assignmentType === 'ai-quiz') {
      const questions = submission.assignmentQuestions || submission.assignmentContent?.questions || [];
      let answers: any = {};
      try {
        if (typeof submission.content === 'string') {
          answers = JSON.parse(submission.content);
        } else if (submission.content?.responses) {
          answers = submission.content.responses;
        } else {
          answers = submission.content || {};
        }
      } catch (e) {
        console.error('Error parsing answers:', e);
      }
      
      let correctCount = 0;
      questions.forEach((question: any) => {
        const studentAnswer = answers[question.id];
        const isCorrect = question.type === 'multiple-choice'
          ? studentAnswer === question.correctAnswer
          : question.type === 'true-false'
          ? studentAnswer === question.correctAnswer
          : String(studentAnswer || '').toLowerCase().trim() === String(question.correctAnswer || '').toLowerCase().trim();
        
        if (isCorrect) correctCount++;
      });
      
      summary = {
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        incorrectAnswers: questions.length - correctCount,
        percentage: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
      };
    }
    
    // Si es formulario interactivo
    if (submission.assignmentType === 'interactive') {
      const responses = submission.content?.responses || {};
      const totalFields = Object.keys(responses).length;
      const filledFields = Object.values(responses).filter((r: any) => r && r !== '').length;
      
      summary = {
        totalFields,
        filledFields,
        completionRate: totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
      };
    }
    
    // Si es texto
    if (submission.assignmentType === 'text') {
      const text = submission.content?.textResponse || submission.content || '';
      const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
      
      summary = {
        wordCount,
        charCount: text.length
      };
    }
    
    setSubmissionSummary(summary);
    setViewingSubmission(submission);
    setViewingPDF(shouldShowPDF);
    setIsLoading(false);
  };

  const handleClosePDFViewer = () => {
    setViewingPDF(false);
    setViewingSubmission(null);
    setTeacherAnnotations([]);
    setStudentAnnotations([]);
    setSubmissionSummary(null);
    
    // 🔄 Recargar las entregas del estudiante para obtener el estado actualizado (isLocked, etc.)
    if (selectedStudent) {
      loadStudentSubmissions(selectedStudent);
    }
  };

  // Calcular estadísticas del estudiante seleccionado
  const gradedSubmissions = studentSubmissions.filter((s) => s.grade !== null && s.grade !== undefined);
  const pendingSubmissions = studentSubmissions.filter((s) => s.grade === null || s.grade === undefined);
  const averageGrade = gradedSubmissions.length > 0
    ? Math.round(gradedSubmissions.reduce((acc, s) => acc + s.grade, 0) / gradedSubmissions.length)
    : 0;

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-500';
    if (grade >= 70) return 'bg-blue-500';
    if (grade >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  // Contar nuevas entregas por estudiante
  const getNewSubmissionsCountByStudent = (studentId: string): number => {
    return allSubmissions.filter(
      (sub) => sub.studentId === studentId && !viewedSubmissions.has(sub.id)
    ).length;
  };

  // Contar total de nuevas entregas
  const getTotalNewSubmissions = (): number => {
    return allSubmissions.filter((sub) => !viewedSubmissions.has(sub.id)).length;
  };

  // Verificar si una submission es nueva
  const isSubmissionNew = (submissionId: string): boolean => {
    return !viewedSubmissions.has(submissionId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">📊 Calificaciones y Progreso</h2>
        <p className="text-muted-foreground">Revisa el desempeño individual de cada estudiante</p>
      </div>

      {/* Selector de Estudiante */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-2 block">Selecciona un estudiante:</Label>
          {isInitializing ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
              Cargando estudiantes...
            </div>
          ) : (
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elige un estudiante..." />
              </SelectTrigger>
              <SelectContent>
                {students.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No tienes estudiantes asignados
                  </SelectItem>
                ) : (
                students.map((student) => {
                  const newCount = getNewSubmissionsCountByStudent(student.id);
                  return (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {student.name} ({student.email})
                        {newCount > 0 && (
                          <Badge variant="destructive" className="ml-2 animate-pulse">
                            {newCount} nueva{newCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas del Estudiante */}
      {selectedStudent && selectedStudentData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entregadas</p>
                  <p className="text-2xl">{studentSubmissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Calificadas</p>
                  <p className="text-2xl">{gradedSubmissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl">{pendingSubmissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Promedio</p>
                  <p className="text-2xl">{averageGrade}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Entregas */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Tareas de {selectedStudentData?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                <p className="text-sm text-muted-foreground">Cargando entregas del estudiante...</p>
              </div>
            ) : studentSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {assignments.length === 0 ? (
                  <>
                    <p className="mb-2">⏳ Esperando tareas...</p>
                    <p className="text-xs">Las tareas se están cargando</p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">📭 Este estudiante aún no ha entregado tareas</p>
                    <p className="text-xs">{assignments.length} tarea{assignments.length !== 1 ? 's' : ''} disponible{assignments.length !== 1 ? 's' : ''}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {studentSubmissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4>{submission.assignmentTitle}</h4>
                            {isSubmissionNew(submission.id) && (
                              <Badge variant="destructive" className="animate-pulse">
                                <Bell className="w-3 h-3 mr-1" />
                                ¡Nuevo!
                              </Badge>
                            )}
                            {submission.grade !== null && submission.grade !== undefined ? (
                              <Badge className={`${getGradeColor(submission.grade)} text-white`}>
                                {submission.grade}/100
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50">
                                ⏳ Por calificar
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            📅 Entregado el {new Date(submission.submittedAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {submission.feedback && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Comentario:
                              </p>
                              <p className="text-sm">{submission.feedback}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              console.log('🔥 [GradesView] Abriendo modal de calificación para:', submission);
                              setGradingSubmission(submission);
                              setGrade(submission.grade?.toString() || '');
                              setFeedback(submission.feedback || '');
                            }}
                          >
                            {submission.grade !== null ? '✏️ Editar' : '✅ Calificar'}
                          </Button>
                        </div>
                      </div>

                      {/* Barra de progreso visual */}
                      {submission.grade !== null && submission.grade !== undefined && (
                        <div className="mt-3">
                          <Progress value={submission.grade} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer con anotaciones del estudiante Y del profesor */}
      {viewingSubmission && viewingPDF && (() => {
        // 🔧 PRIORIDAD 1: Buscar PDF anotado en submission.files (enviado por el estudiante)
        let pdfUrl = '';
        
        // Primero verificar si hay archivos adjuntos en la submission (PDF anotado del estudiante)
        if (viewingSubmission.files && viewingSubmission.files.length > 0) {
          const annotatedFile = viewingSubmission.files.find((f: any) => 
            f.type?.includes('image/png') || f.name?.includes('_anotado')
          );
          if (annotatedFile) {
            pdfUrl = annotatedFile.url;
            console.log('📄 [GradesView] ✅ Usando PDF anotado de submission.files:', pdfUrl);
          }
        }
        
        // 🔧 PRIORIDAD 2: Buscar en localStorage (fallback)
        if (!pdfUrl) {
          const annotatedPDFKey = `annotated_pdf_${viewingSubmission.assignmentId}_${viewingSubmission.studentId}`;
          const annotatedPDFData = localStorage.getItem(annotatedPDFKey);
          
          if (annotatedPDFData) {
            try {
              const data = JSON.parse(annotatedPDFData);
              pdfUrl = data.url;
              console.log('📄 [GradesView] Usando PDF anotado de localStorage:', pdfUrl);
            } catch (e) {
              console.warn('Error parseando PDF anotado, usando original');
            }
          }
        }
        
        // 🔧 PRIORIDAD 3: Usar el PDF original de los archivos de la tarea
        if (!pdfUrl) {
          pdfUrl = viewingSubmission.assignmentFiles?.find((f: any) => 
            f.type?.includes('pdf') || f.name?.toLowerCase().endsWith('.pdf') ||
            f.type?.includes('image') || f.name?.toLowerCase().endsWith('.png')
          )?.url || viewingSubmission.assignmentFileUrl || '';
          console.log('📄 [GradesView] Usando PDF original:', pdfUrl);
        }
        
        return (
          <FullScreenPDFEditor
            assignmentId={viewingSubmission.assignmentId}
            assignmentTitle={viewingSubmission.assignmentTitle}
            pdfUrl={pdfUrl}
            userRole="teacher"
            userId={localStorage.getItem('educonnect_user_id') || localStorage.getItem('user_id') || 'teacher-1'}
            userName={localStorage.getItem('user_name') || 'Profesor'}
            viewingStudentId={viewingSubmission.studentId}
            submissionId={viewingSubmission.id}
            isLocked={viewingSubmission.isLocked}
            onClose={handleClosePDFViewer}
            onSave={() => {
              // Recargar anotaciones después de guardar
              handleViewSubmission(viewingSubmission);
            }}
          />
        );
      })()}

      {/* 🆕 MODAL DE CALIFICACIÓN */}
      <Dialog open={!!gradingSubmission} onOpenChange={(open) => !open && setGradingSubmission(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📝 Calificar Entrega</DialogTitle>
            <DialogDescription>
              Califica y deja comentarios en la entrega de {selectedStudentData?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="grade">Calificación (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Ej: 85"
              />
            </div>

            <div>
              <Label htmlFor="feedback">Comentarios</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Escribe comentarios para el estudiante..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setGradingSubmission(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGradeSubmission}
                disabled={!grade || parseInt(grade) < 0 || parseInt(grade) > 100}
              >
                💾 Guardar Calificación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}