import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Upload, Video, FileText, Gamepad2, Check, Loader2 } from 'lucide-react';
import { apiClient } from '../utils/api';
import { FormBuilder } from './FormBuilder';
import { InteractiveFormBuilder, InteractiveActivity } from './InteractiveFormBuilder';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useLanguage } from '../utils/LanguageContext';
import { toast } from 'sonner@2.0.3';

interface EditAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
  onSubmit: (id: string, data: any) => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export function EditAssignmentDialog({ open, onOpenChange, assignment, onSubmit }: EditAssignmentDialogProps) {
  const { t } = useLanguage();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<'standard' | 'form' | 'video' | 'interactive' | 'ai-generated'>('standard');
  const [formFields, setFormFields] = useState<any[]>([]);
  const [interactiveActivities, setInteractiveActivities] = useState<InteractiveActivity[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del assignment cuando se abre el diálogo
  useEffect(() => {
    if (open && assignment) {
      setTitle(assignment.title || '');
      setDescription(assignment.description || '');
      setDueDate(assignment.dueDate ? assignment.dueDate.split('T')[0] : '');
      setType(assignment.type || 'standard');
      setFormFields(assignment.formFields || []);
      setInteractiveActivities(assignment.interactiveActivities || []);
      setVideoUrl(assignment.videoUrl || '');
      setFiles(assignment.files || []);
    }
  }, [open, assignment]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(fileList).map((file) => apiClient.uploadFile(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles([...files, ...uploadedFiles]);
      toast.success('Archivos subidos exitosamente');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(t('uploadError') || 'Error al subir archivos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Por favor ingresa un título');
      return;
    }

    setIsSaving(true);
    try {
      const assignmentData: any = {
        title,
        description,
        dueDate,
        type,
        files,
      };

      if (type === 'form' || type === 'ai-generated') {
        assignmentData.formFields = formFields;
      } else if (type === 'interactive') {
        assignmentData.interactiveActivities = interactiveActivities;
      } else if (type === 'video') {
        assignmentData.videoUrl = videoUrl;
      }

      // Preservar campos que no se editan
      if (assignment.spanishLevel) {
        assignmentData.spanishLevel = assignment.spanishLevel;
      }
      if (assignment.difficulty) {
        assignmentData.difficulty = assignment.difficulty;
      }

      await onSubmit(assignment.id, assignmentData);
      onOpenChange(false);
      toast.success('¡Tarea actualizada exitosamente!');
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast.error('Error al actualizar la tarea');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>
            Modifica los campos que necesites actualizar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">{t('title') || 'Título'}</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('enterTitle') || 'Ingresa el título'}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">{t('description') || 'Descripción'}</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('enterDescription') || 'Ingresa la descripción'}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-dueDate">{t('dueDate') || 'Fecha de vencimiento'}</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Mostrar badge del tipo (no editable para AI-generated) */}
            {type === 'ai-generated' && (
              <div>
                <Label>Tipo de tarea</Label>
                <Badge variant="secondary" className="mt-2">
                  Generada por IA
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Puedes editar las preguntas generadas por IA a continuación
                </p>
              </div>
            )}

            {/* Contenido según tipo */}
            <div>
              {type === 'standard' && (
                <div className="space-y-4">
                  <Label className="text-base mb-3 block">{t('uploadFiles') || 'Archivos'}</Label>
                  
                  {/* Drag & Drop Upload Area */}
                  <div
                    className="relative border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background to-muted/20"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                      const droppedFiles = Array.from(e.dataTransfer.files);
                      if (droppedFiles.length > 0) {
                        const input = document.getElementById('edit-file-upload') as HTMLInputElement;
                        const dataTransfer = new DataTransfer();
                        droppedFiles.forEach(f => dataTransfer.items.add(f));
                        input.files = dataTransfer.files;
                        handleFileUpload({ target: input } as any);
                      }
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="edit-file-upload"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                    />
                    
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      
                      <h4 className="mb-2 font-medium">
                        {isUploading ? t('uploading') || 'Subiendo...' : 'Arrastra archivos aquí'}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        o haz click para seleccionar
                      </p>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('edit-file-upload')?.click()}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploading ? 'Subiendo archivos...' : 'Seleccionar Archivos'}
                      </Button>
                      
                      <p className="text-xs text-muted-foreground mt-3">
                        PDF, Word, Imágenes, Videos, Audio
                      </p>
                    </div>
                  </div>

                  {/* Lista de archivos subidos */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        {files.length} archivo{files.length !== 1 ? 's' : ''} listo{files.length !== 1 ? 's' : ''}
                      </Label>
                      {files.map((file, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardContent className="flex items-center gap-3 p-3">
                            {/* Icono según tipo */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              {file.type?.includes('pdf') ? (
                                <FileText className="w-5 h-5 text-red-600" />
                              ) : file.type?.includes('image') ? (
                                <FileText className="w-5 h-5 text-green-600" />
                              ) : file.type?.includes('video') ? (
                                <Video className="w-5 h-5 text-blue-600" />
                              ) : (
                                <FileText className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            
                            {/* Info del archivo */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.type || 'Unknown'} • {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            
                            {/* Check verde */}
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                            
                            {/* Botón eliminar */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFiles(files.filter((_, i) => i !== index))}
                              className="flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(type === 'form' || type === 'ai-generated') && (
                <div>
                  <Label className="text-base mb-3 block">
                    {type === 'ai-generated' ? 'Preguntas (Generadas por IA - Editables)' : 'Formulario'}
                  </Label>
                  <FormBuilder fields={formFields} onChange={setFormFields} />
                </div>
              )}

              {type === 'video' && (
                <div>
                  <Label htmlFor="edit-videoUrl">{t('videoUrl') || 'URL del Video'}</Label>
                  <Input
                    id="edit-videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {type === 'interactive' && (
                <div>
                  <Label className="text-base mb-3 block">Actividades Interactivas</Label>
                  <InteractiveFormBuilder
                    activities={interactiveActivities}
                    onChange={setInteractiveActivities}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={handleDialogClose}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
