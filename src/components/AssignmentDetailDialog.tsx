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
import { DynamicForm } from './DynamicForm';
import { PDFAnnotator } from './PDFAnnotator';

interface AssignmentDetailDialogProps {
  assignment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTeacher: boolean;
  onSubmissionComplete?: () => void;
}

export function AssignmentDetailDialog({
  assignment,
  open,
  onOpenChange,
  isTeacher,
  onSubmissionComplete,
}: AssignmentDetailDialogProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [formResponses, setFormResponses] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isPDFEditorOpen, setIsPDFEditorOpen] = useState(false);
  const [pdfAnnotations, setPdfAnnotations] = useState<any[]>([]);

  useEffect(() => {
    if (isTeacher && open) {
      loadSubmissions();
    }
  }, [open, isTeacher]);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let content = submissionText;
      
      if (assignment.type === 'form' || assignment.type === 'interactive') {
        content = JSON.stringify(formResponses);
      }

      await apiClient.submitAssignment({
        assignmentId: assignment.id,
        content,
      });

      alert('¡Tarea entregada exitosamente!');
      onOpenChange(false);
      if (onSubmissionComplete) {
        onSubmissionComplete();
      }
      setSubmissionText('');
      setFormResponses({});
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error al entregar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrade = async (submissionId: string, grade: number, feedback: string) => {
    try {
      await apiClient.gradeSubmission(submissionId, { grade, feedback });
      await loadSubmissions();
      alert('Calificación guardada exitosamente');
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Error al calificar');
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{assignment.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2 mt-2">
            {assignment.dueDate && (
              <Badge variant="outline">
                <Calendar className="w-3 h-3 mr-1" />
                Fecha límite: {new Date(assignment.dueDate).toLocaleDateString('es-ES')}
              </Badge>
            )}
            {assignment.teacherName && (
              <Badge variant="secondary">Profesor: {assignment.teacherName}</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            {!isTeacher && <TabsTrigger value="submit">Entregar</TabsTrigger>}
            {isTeacher && (
              <TabsTrigger value="submissions" className="gap-2">
                <Users className="w-4 h-4" />
                Entregas ({submissions.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div>
              <h3 className="mb-2">Descripción</h3>
              <p className="text-foreground">{assignment.description}</p>
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
                    const isPDF = file.type?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf');
                    return (
                      <Card key={index}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {isPDF && !isTeacher && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setIsPDFEditorOpen(true)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Anotar PDF
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
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
          </TabsContent>

          {!isTeacher && (
            <TabsContent value="submit" className="space-y-6">
              <div>
                <h3 className="mb-4">Entregar Tarea</h3>
                
                {assignment.type === 'form' ? (
                  <DynamicForm
                    fields={assignment.formFields}
                    responses={formResponses}
                    onChange={setFormResponses}
                  />
                ) : assignment.type === 'interactive' ? (
                  <DynamicForm
                    interactiveActivities={assignment.interactiveActivities}
                    responses={formResponses}
                    onChange={setFormResponses}
                  />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Tu respuesta</Label>
                      <Textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        rows={10}
                        placeholder="Escribe tu respuesta aquí..."
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full mt-4"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Enviando...' : 'Entregar Tarea'}
                </Button>
              </div>
            </TabsContent>
          )}

          {isTeacher && (
            <TabsContent value="submissions" className="space-y-4">
              {isLoadingSubmissions ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : submissions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay entregas todavía</p>
                  </CardContent>
                </Card>
              ) : (
                submissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    assignment={assignment}
                    onGrade={handleGrade}
                  />
                ))
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* PDF Annotator Dialog */}
        {assignment.files && assignment.files.some((f: any) => 
          f.type?.includes('pdf') || f.name?.toLowerCase().endsWith('.pdf')
        ) && (
          <PDFAnnotator
            pdfUrl={assignment.files.find((f: any) => 
              f.type?.includes('pdf') || f.name?.toLowerCase().endsWith('.pdf')
            )?.url || ''}
            assignmentId={assignment.id}
            open={isPDFEditorOpen}
            onOpenChange={setIsPDFEditorOpen}
            onSubmit={() => {
              if (onSubmissionComplete) {
                onSubmissionComplete();
              }
              setIsPDFEditorOpen(false);
              onOpenChange(false);
            }}
            readOnly={isTeacher}
          />
        )}
      </DialogContent>
    </Dialog>
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

  // Check if this is a PDF submission
  let submissionData;
  let isPDFSubmission = false;
  try {
    submissionData = JSON.parse(submission.content || '{}');
    isPDFSubmission = submissionData.type === 'pdf-annotated';
  } catch (e) {
    // Not JSON, regular text submission
  }

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
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">PDF Anotado por el Estudiante</p>
                  <p className="text-xs text-muted-foreground">
                    {submissionData.annotations?.length || 0} anotación{submissionData.annotations?.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewPDF(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver PDF con Anotaciones
                </Button>
              </div>
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
              <Label>Retroalimentación</Label>
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

        {/* PDF Viewer for annotated submissions */}
        {viewPDF && isPDFSubmission && (
          <PDFAnnotator
            pdfUrl={submissionData.originalPdfUrl}
            assignmentId={assignment.id}
            open={viewPDF}
            onOpenChange={setViewPDF}
            readOnly={true}
            initialAnnotations={submissionData.annotations || []}
          />
        )}
      </CardContent>
    </Card>
  );
}
