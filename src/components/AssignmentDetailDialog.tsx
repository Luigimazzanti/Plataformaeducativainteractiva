import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Calendar, FileText, Video, Users, Send, Download, Edit } from 'lucide-react';
import { apiClient } from '../utils/api';
import { AuthManager } from '../utils/auth-manager';
import { DynamicForm } from './DynamicForm';
import { FullScreenPDFEditor } from './FullScreenPDFEditor';
import { PDFVersionManager } from './PDFVersionManager';
import { AIQuizRenderer } from './AIQuizRenderer';
import { toast } from 'sonner@2.0.3';

interface AssignmentDetailDialogProps {
  assignment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTeacher: boolean;
  onSubmissionComplete?: () => void;
  currentUser?: any; // ✅ NUEVO: Agregar currentUser como prop
}

export function AssignmentDetailDialog({
  assignment,
  open,
  onOpenChange,
  isTeacher,
  onSubmissionComplete,
  currentUser, // ✅ NUEVO: Recibir currentUser
}: AssignmentDetailDialogProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [formResponses, setFormResponses] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isPDFEditorOpen, setIsPDFEditorOpen] = useState(false);
  const [pdfAnnotations, setPdfAnnotations] = useState<any[]>([]);
  const [mySubmission, setMySubmission] = useState<any>(null);
  const [viewingCorrectedPDF, setViewingCorrectedPDF] = useState(false);
  const [justSubmittedQuiz, setJustSubmittedQuiz] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // ✅ NUEVO: Obtener el nombre del usuario
  const getUserName = () => {
    if (currentUser?.name) return currentUser.name;
    
    // Fallback: Obtener desde localStorage (modo demo)
    const demoCurrentUserId = localStorage.getItem('educonnect_demo_current_user');
    if (demoCurrentUserId) {
      const users = localStorage.getItem('educonnect_demo_users');
      if (users) {
        const parsedUsers = JSON.parse(users);
        const user = parsedUsers.find((u: any) => u.id === demoCurrentUserId);
        if (user) return user.name;
      }
    }
    
    return 'Usuario';
  };

  // DEBUG: Ver qué datos tiene la tarea
  useEffect(() => {
    if (open) {
      console.log('🔍 ==================== ASSIGNMENT DEBUG ====================');
      console.log('📋 Assignment completo:', assignment);
      console.log('📋 Assignment.files:', assignment.files);
      console.log('📋 Assignment.type:', assignment.type);
      console.log('📋 Cantidad de files:', assignment.files?.length || 0);
      
      if (assignment.files && assignment.files.length > 0) {
        assignment.files.forEach((file: any, idx: number) => {
          console.log(`📄 Archivo ${idx + 1}:`, {
            name: file.name,
            type: file.type,
            url: file.url?.substring(0, 100),
            hasUrl: !!file.url,
            isPDF: file.type?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf')
          });
        });
      } else {
        console.log('⚠️ NO HAY ARCHIVOS EN assignment.files');
      }
      
      console.log('🔍 ========================================================');
    }
  }, [open, assignment]);

  // Helper para obtener el ID del usuario actual de forma segura
  const getCurrentUserId = () => {
    const userId = AuthManager.getUserId();
    return userId && userId.trim() !== '' ? userId : undefined;
  };

  useEffect(() => {
    if (open) {
      if (isTeacher) {
        loadSubmissions();
      } else {
        checkMySubmission();
      }
    } else {
      // LIMPIAR ESTADOS AL CERRAR EL DIALOG
      // ⚠️ NO resetear isPDFEditorOpen aquí - se resetea cuando el usuario cierra el editor
      setViewingCorrectedPDF(false);
      setJustSubmittedQuiz(false);
      setUploadedFiles([]);
      setSubmissionText('');
    }
  }, [open, isTeacher]);

  const checkMySubmission = async () => {
    try {
      const currentUserId = AuthManager.getUserId();
      const { submissions: allSubmissions } = await apiClient.getMySubmissions();
      const mySubmissionForThis = allSubmissions.find((s: any) => 
        s.assignmentId === assignment.id && s.studentId === currentUserId
      );
      setMySubmission(mySubmissionForThis || null);
    } catch (error: any) {
      // 🔧 ARREGLO: No mostrar error si es por autenticación (se activa modo demo automático)
      const isAuthError = 
        error?.message === 'No user logged in' || 
        error?.message === 'Unauthorized' ||
        error?.message?.includes('token') ||
        error?.message?.includes('DEMO_MODE');
      
      if (!isAuthError) {
        console.error('Error checking submission:', error);
      }
      // Si es error de autenticación, silenciar completamente
    }
  };

  const loadSubmissions = async () => {
    try {
      setIsLoadingSubmissions(true);
      const { submissions: data } = await apiClient.getAssignmentSubmissions(assignment.id);
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => [...prev, ...fileArray]);
      toast.success(`📎 ${fileArray.length} archivo(s) agregado(s)`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.info('🗑️ Archivo eliminado');
  };

  const handleSubmit = async (quizData?: { answers: any; score: number; totalPoints: number }) => {
    setIsSubmitting(true);
    try {
      let content = submissionText;
      let grade = undefined;
      
      if (assignment.type === 'form' || assignment.type === 'interactive') {
        content = JSON.stringify(formResponses);
      } else if (assignment.type === 'ia-quiz' && quizData) {
        // Para tareas autocorregibles, guardamos las respuestas y la calificación
        content = JSON.stringify(quizData.answers);
        // Calificación sobre 100
        grade = Math.round((quizData.score / quizData.totalPoints) * 100);
      } else if (uploadedFiles.length > 0) {
        // Si hay archivos subidos, agregar información en el contenido
        const fileInfo = uploadedFiles.map(f => `📎 ${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('\n');
        content = submissionText + '\n\n--- Archivos adjuntos ---\n' + fileInfo;
      }

      await apiClient.submitAssignment({
        assignmentId: assignment.id,
        content,
        grade, // Calificación automática para ia-quiz
      });

      toast.success(
        '✅ ¡Tarea entregada exitosamente!' + 
        (grade !== undefined ? ` Calificación: ${grade}/100` : '') +
        (uploadedFiles.length > 0 ? ` (${uploadedFiles.length} archivo(s) adjunto(s))` : '')
      );
      
      // Para tareas ia-quiz, NO cerrar automáticamente para que el estudiante vea los resultados
      if (assignment.type === 'ia-quiz') {
        setJustSubmittedQuiz(true);
      } else {
        onOpenChange(false);
      }
      
      if (onSubmissionComplete) {
        onSubmissionComplete();
      }
      setSubmissionText('');
      setFormResponses({});
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('❌ Error al entregar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrade = async (submissionId: string, grade: number, feedback: string) => {
    try {
      await apiClient.gradeSubmission(submissionId, { grade, feedback });
      await loadSubmissions();
      toast.success('✅ Calificación guardada exitosamente');
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('❌ Error al calificar');
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  // Encontrar el archivo PDF si existe
  const pdfFile = assignment.files?.find((f: any) => {
    // Buscar en el tipo (MIME type)
    const typeIsPdf = f.type?.includes('pdf');
    
    // Buscar en el nombre del archivo
    const nameIsPdf = f.name?.toLowerCase().endsWith('.pdf');
    
    // Buscar en la URL
    const urlIsPdf = f.url?.toLowerCase().includes('.pdf');
    
    // 🔧 NUEVO: Detectar PDFs por contenido en Data URL
    const isDataUrlPdf = f.url?.startsWith('data:application/pdf');
    
    // 🔧 NUEVO: Si el archivo es un data URL, analizar el tipo MIME
    let mimeTypeFromDataUrl = '';
    if (f.url?.startsWith('data:')) {
      const mimeMatch = f.url.match(/^data:([^;]+);/);
      if (mimeMatch) {
        mimeTypeFromDataUrl = mimeMatch[1];
      }
    }
    const dataUrlTypeIsPdf = mimeTypeFromDataUrl.includes('pdf');
    
    // También detectar archivos con tipo genérico que puedan ser PDFs
    const hasGenericType = f.type === 'application/octet-stream' || !f.type || f.type === '';
    
    const isPdf = typeIsPdf || nameIsPdf || urlIsPdf || isDataUrlPdf || dataUrlTypeIsPdf || (hasGenericType && nameIsPdf);
    
    console.log('🔍 [PDF Detection]', {
      fileName: f.name,
      fileType: f.type,
      fileUrl: f.url?.substring(0, 50),
      typeIsPdf,
      nameIsPdf,
      urlIsPdf,
      isDataUrlPdf,
      dataUrlTypeIsPdf,
      mimeTypeFromDataUrl,
      hasGenericType,
      isPdf
    });
    
    return isPdf;
  });

  console.log('📄 [AssignmentDialog]', {
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    filesCount: assignment.files?.length || 0,
    pdfFileFound: !!pdfFile,
    pdfFileName: pdfFile?.name,
    pdfFileType: pdfFile?.type,
    pdfFileUrl: pdfFile?.url?.substring(0, 50),
    isTeacher,
    hasMySubmission: !!mySubmission
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl line-clamp-2 break-words">{assignment.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2 mt-2">
            {assignment.dueDate && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Fecha límite: </span>
                {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
              </Badge>
            )}
            {assignment.teacherName && (
              <Badge variant="secondary" className="text-xs">
                <span className="hidden sm:inline">Profesor: </span>
                {assignment.teacherName}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {!isTeacher && (
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="details" className="text-xs sm:text-sm">Detalles</TabsTrigger>
              <TabsTrigger value="submit" className="text-xs sm:text-sm">Entregar</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="details" className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="mb-2 text-sm sm:text-base">Descripción</h3>
              <p className="text-sm sm:text-base text-foreground break-words">
                {assignment.description || 'Actividad sin descripción'}
              </p>
            </div>

            {assignment.type === 'video' && assignment.videoUrl && (
              <div>
                <h3 className="mb-2">Video</h3>
                {assignment.videoUrl.includes('youtube.com') || assignment.videoUrl.includes('youtu.be') ? (
                  <div className="aspect-video">
                    <iframe
                      src={getYouTubeEmbedUrl(assignment.videoUrl)}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video src={assignment.videoUrl} controls className="w-full rounded-lg" />
                )}
              </div>
            )}

            {assignment.files && assignment.files.length > 0 && (
              <div>
                <h3 className="mb-2">Archivos Adjuntos</h3>
                <div className="space-y-2">
                  {assignment.files.map((file: any, index: number) => {
                    // 🔧 NUEVO: Detectar PDF de forma más amplia
                    const isPDF = file.type?.includes('pdf') || 
                                  file.name?.toLowerCase().endsWith('.pdf') ||
                                  file.url?.toLowerCase().includes('.pdf') ||
                                  file.url?.startsWith('data:application/pdf');
                    
                    // 🔧 FALLBACK: Si el archivo no tiene extensión, asumir que PUEDE ser un PDF
                    const mightBePDF = !file.name?.includes('.') || file.type === 'application/octet-stream';
                    
                    return (
                      <Card key={index}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.type}</p>
                              {mightBePDF && !isPDF && (
                                <p className="text-xs text-orange-500">⚠️ Tipo desconocido - puede ser PDF</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {(isPDF || mightBePDF) && !isTeacher && !mySubmission && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Opening PDF Editor from Details tab');
                                  console.log('PDF URL:', file.url);
                                  setIsPDFEditorOpen(true);
                                  // 🔧 ARREGLO: Cerrar el dialog de la tarea para que el PDF Editor sea visible
                                  onOpenChange(false);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {isPDF ? 'Anotar PDF' : 'Abrir Editor'}
                              </Button>
                            )}
                            {(isPDF || mightBePDF) && !isTeacher && mySubmission && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingCorrectedPDF(true);
                                }}
                                className="bg-gradient-to-r from-[#84cc16] to-green-600 hover:from-[#65a30d] hover:to-green-700"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Ver PDF Corregido
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('🔽 [Download] Iniciando descarga:', {
                                  name: file.name,
                                  type: file.type,
                                  urlStart: file.url?.substring(0, 100)
                                });
                                
                                try {
                                  const link = document.createElement('a');
                                  link.href = file.url;
                                  link.download = file.name || 'archivo';
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  
                                  console.log('✅ [Download] Descarga iniciada exitosamente');
                                  toast.success(`✅ Descargando: ${file.name}`);
                                } catch (error) {
                                  console.error('❌ [Download] Error:', error);
                                  toast.error('❌ Error al descargar el archivo');
                                }
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Descargar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {assignment.type === 'form' && assignment.formFields && (
              <div>
                <h3 className="mb-2">Vista Previa del Formulario</h3>
                <DynamicForm
                  fields={assignment.formFields}
                  responses={formResponses}
                  onChange={setFormResponses}
                  readOnly={true}
                />
              </div>
            )}

            {assignment.type === 'interactive' && assignment.interactiveActivities && (
              <div>
                <h3 className="mb-2">Actividades Interactivas</h3>
                <DynamicForm
                  interactiveActivities={assignment.interactiveActivities}
                  responses={formResponses}
                  onChange={setFormResponses}
                  readOnly={true}
                />
              </div>
            )}

            {assignment.type === 'ia-quiz' && assignment.questions && isTeacher && (
              <div>
                <h3 className="mb-2">Ejercicios Generados con IA</h3>
                <AIQuizRenderer
                  questions={assignment.questions}
                  isTeacher={true}
                />
              </div>
            )}
          </TabsContent>

          {!isTeacher && (
            <TabsContent value="submit" className="space-y-6">
              <div>
                <h3 className="mb-4">Entregar Tarea</h3>
                
                {assignment.type === 'ia-quiz' ? (
                  <div className="space-y-4">
                    <AIQuizRenderer
                      questions={assignment.questions}
                      isTeacher={false}
                      onSubmit={(quizData) => {
                        handleSubmit(quizData);
                      }}
                    />
                    {(mySubmission || justSubmittedQuiz) && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={() => onOpenChange(false)}
                          size="lg"
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          Cerrar
                        </Button>
                      </div>
                    )}
                  </div>
                ) : assignment.type === 'form' ? (
                  <>
                    <DynamicForm
                      fields={assignment.formFields}
                      responses={formResponses}
                      onChange={setFormResponses}
                    />
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full mt-4"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Enviando...' : 'Entregar Tarea'}
                    </Button>
                  </>
                ) : assignment.type === 'interactive' ? (
                  <>
                    <DynamicForm
                      interactiveActivities={assignment.interactiveActivities}
                      responses={formResponses}
                      onChange={setFormResponses}
                    />
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full mt-4"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Enviando...' : 'Entregar Tarea'}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Tarea regular */}
                    <div className="space-y-4">
                      {/* Si hay PDF, mostrar botón especial */}
                      {pdfFile && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-6">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500 rounded-lg">
                              <FileText className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="mb-2 font-semibold">📝 Edita el PDF con herramientas avanzadas</h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                Esta tarea incluye un archivo PDF. Usa nuestro editor con herramientas de anotación profesionales:
                                ✏️ Dibujar, 📝 Texto, ✨ Resaltar, 💬 Comentarios
                              </p>
                              <div className="flex gap-3 flex-wrap">
                                <Button
                                  onClick={() => {
                                    console.log('✅ [AssignmentDialog] Opening PDF Editor');
                                    console.log('PDF URL:', pdfFile?.url);
                                    setIsPDFEditorOpen(true);
                                    // 🔧 ARREGLO: Cerrar el dialog de la tarea para que el PDF Editor sea visible
                                    onOpenChange(false);
                                  }}
                                  size="lg"
                                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  🎨 Abrir Editor PDF Interactivo
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    if (pdfFile?.url) {
                                      window.open(pdfFile.url, '_blank');
                                    } else {
                                      toast.error('❌ Error: URL del PDF no disponible');
                                    }
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Descargar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Separador */}
                      {pdfFile && (
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              O escribe tu respuesta directamente
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Textarea para respuesta escrita */}
                      <div>
                        <Label>Tu respuesta (texto)</Label>
                        <Textarea
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          rows={10}
                          placeholder="Escribe tu respuesta aquí..."
                          className="mt-2"
                        />
                      </div>

                      {/* Subida de archivos */}
                      <div className="space-y-3">
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          📎 Adjuntar archivos (PDF anotado, imágenes, documentos)
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="file-upload"
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="cursor-pointer"
                          />
                        </div>
                        
                        {/* Lista de archivos subidos */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Archivos adjuntos ({uploadedFiles.length}):
                            </p>
                            {uploadedFiles.map((file, index) => (
                              <Card key={index} className="bg-muted/50">
                                <CardContent className="p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm truncate">{file.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024).toFixed(2)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                    className="flex-shrink-0"
                                  >
                                    ✕
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (submissionText.trim() === '' && uploadedFiles.length === 0)}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Enviando...' : 'Entregar Tarea'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* PDF Annotator Dialog - Para editar/crear - FUERA DEL DIALOG PADRE */}
    {pdfFile && pdfFile.url && isPDFEditorOpen && (
      <FullScreenPDFEditor
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
        pdfUrl={pdfFile.url}
        userRole={isTeacher ? 'teacher' : 'student'}
        userId={getCurrentUserId() || 'unknown'}
        userName={getUserName()}
        isGraded={!isTeacher && mySubmission?.status === 'graded'}
        isLocked={!isTeacher && mySubmission?.isLocked === true}
        onClose={() => {
          setIsPDFEditorOpen(false);
          if (onSubmissionComplete) {
            onSubmissionComplete();
          }
          checkMySubmission();
        }}
        onSave={() => {
          if (onSubmissionComplete) {
            onSubmissionComplete();
          }
          checkMySubmission();
        }}
      />
    )}

    {/* PDF Annotator - Para ver correcciones del profesor */}
    {pdfFile && pdfFile.url && !isTeacher && mySubmission && viewingCorrectedPDF && (
      <FullScreenPDFEditor
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
        pdfUrl={pdfFile.url}
        userRole="student"
        userId={getCurrentUserId() || 'unknown'}
        userName={getUserName()}
        isGraded={mySubmission?.status === 'graded'}
        isLocked={mySubmission?.isLocked === true}
        onClose={() => {
          setViewingCorrectedPDF(false);
        }}
      />
    )}
    </>
  );
}

function SubmissionCard({ submission, assignment, onGrade }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [grade, setGrade] = useState(submission.grade || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [viewPDF, setViewPDF] = useState(false);

  const handleSave = () => {
    onGrade(submission.id, Number(grade), feedback);
    setIsEditing(false);
  };

  // Check if assignment has PDF file
  const hasPDF = assignment.files && assignment.files.some((f: any) => 
    f.type?.includes('pdf') || f.name?.toLowerCase().endsWith('.pdf')
  );
  
  const pdfFile = hasPDF ? assignment.files.find((f: any) => 
    f.type?.includes('pdf') || f.name?.toLowerCase().endsWith('.pdf')
  ) : null;

  // Check if submission content mentions PDF annotations
  const isPDFSubmission = hasPDF && submission.content && submission.content.includes('anotaciones en PDF');

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Estudiante</p>
            <p>{submission.studentName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Entregado</p>
            <p className="text-sm">
              {new Date(submission.submittedAt).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Respuesta:</p>
          {isPDFSubmission ? (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-300 space-y-3">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">📝 Tarea con PDF Anotado</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {submission.content}
                  </p>
                  <Button
                    onClick={() => setViewPDF(true)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    🎓 Ver y Corregir PDF
                  </Button>
                </div>
              </div>
            </div>
          ) : assignment.type === 'ia-quiz' ? (
            <div className="bg-muted p-4 rounded-lg space-y-4">
              <p className="text-sm mb-3">📝 Respuestas del ejercicio con IA:</p>
              {assignment.questions && assignment.questions.map((question: any, idx: number) => {
                const answers = JSON.parse(submission.content || '{}');
                const studentAnswer = answers[question.id];
                const isCorrect = question.type === 'multiple-choice' 
                  ? studentAnswer === question.correctAnswer
                  : question.type === 'true-false'
                  ? studentAnswer === question.correctAnswer
                  : String(studentAnswer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();

                return (
                  <div key={question.id} className="bg-background p-3 rounded border">
                    <p className="text-sm mb-2">
                      <strong>#{idx + 1}:</strong> {question.question}
                    </p>
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <Badge className="bg-green-500">✓ Correcto</Badge>
                      ) : (
                        <Badge variant="destructive">✗ Incorrecto</Badge>
                      )}
                      <span className="text-sm">
                        Respuesta: <strong>{
                          question.type === 'multiple-choice' && question.options
                            ? question.options[studentAnswer]
                            : question.type === 'true-false'
                            ? (studentAnswer ? 'Verdadero' : 'Falso')
                            : studentAnswer
                        }</strong>
                      </span>
                    </div>
                    {!isCorrect && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Correcta: <strong>{
                          question.type === 'multiple-choice' && question.options
                            ? question.options[question.correctAnswer]
                            : question.type === 'true-false'
                            ? (question.correctAnswer ? 'Verdadero' : 'Falso')
                            : question.correctAnswer
                        }</strong>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : assignment.type === 'form' ? (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              {JSON.parse(submission.content || '{}') && 
                Object.entries(JSON.parse(submission.content)).map(([key, value]: any) => (
                  <div key={key}>
                    <p className="text-sm">{key}</p>
                    <p className="text-sm text-foreground">{Array.isArray(value) ? value.join(', ') : value}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label>Calificación (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Calificación"
              />
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Escribe comentarios para el estudiante..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">Guardar</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {submission.grade !== null ? (
                <div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {submission.grade}/100
                  </Badge>
                  {submission.feedback && (
                    <p className="text-sm text-muted-foreground mt-2">{submission.feedback}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin calificar</p>
              )}
            </div>
            <Button onClick={() => setIsEditing(true)} size="sm">
              {submission.grade !== null ? 'Editar Nota' : 'Calificar'}
            </Button>
          </div>
        )}

        {/* PDF Viewer for Teacher Correction */}
        {viewPDF && isPDFSubmission && pdfFile && (
          <PDFVersionManager
            pdfUrl={pdfFile.url}
            assignmentId={assignment.id}
            open={viewPDF}
            onOpenChange={setViewPDF}
            isTeacher={true}
            studentId={submission.studentId}
            readOnly={false}
          />
        )}
      </CardContent>
    </Card>
  );
}