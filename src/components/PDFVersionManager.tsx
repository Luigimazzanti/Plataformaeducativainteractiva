import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import {
  FileText,
  Edit,
  Eye,
  Download,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { FullScreenPDFEditor } from './FullScreenPDFEditor';
import { apiClient } from '../utils/api';
import { useLanguage } from '../utils/LanguageContext';

/**
 * Gestor de versiones de PDF para el flujo colaborativo profesor-estudiante
 * 
 * Flujo:
 * 1. Original: PDF subido por el profesor
 * 2. Estudiante: Versión editada por el estudiante
 * 3. Profesor: Versión corregida por el profesor
 * 4. Estudiante puede ver la corrección final
 */

interface PDFVersion {
  id: string;
  assignmentId: string;
  version: 'original' | 'student' | 'teacher' | 'final';
  fileUrl: string;
  annotations: any[];
  createdBy: string;
  createdByRole: 'student' | 'teacher';
  createdAt: string;
  status: 'draft' | 'submitted' | 'corrected' | 'final';
}

interface PDFVersionManagerProps {
  assignmentId: string;
  assignmentTitle: string;
  originalPdfUrl: string;
  userRole: 'student' | 'teacher';
  userId: string;
  userName: string;
  studentId?: string; // Para el profesor, ID del estudiante que está revisando
  onClose?: () => void;
}

export function PDFVersionManager({
  assignmentId,
  assignmentTitle,
  originalPdfUrl,
  userRole,
  userId,
  userName,
  studentId,
  onClose,
}: PDFVersionManagerProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [versions, setVersions] = useState<PDFVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<PDFVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workflowStatus, setWorkflowStatus] = useState<string>('');
  const { t } = useLanguage();

  useEffect(() => {
    loadVersions();
  }, [assignmentId, userId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      // Cargar versiones desde el backend
      const targetStudentId = userRole === 'teacher' ? studentId : userId;
      const { versions: loadedVersions, status } = await apiClient.getPDFVersions(
        assignmentId,
        targetStudentId || userId
      );

      setVersions(loadedVersions || []);
      setWorkflowStatus(status || 'not_started');

      // Determinar versión actual según el rol y estado
      const latestVersion = getLatestVersion(loadedVersions || []);
      setCurrentVersion(latestVersion);

      console.log('✅ [PDFVersionManager] Versiones cargadas:', {
        total: loadedVersions?.length || 0,
        status,
        latestVersion: latestVersion?.version,
      });
    } catch (error) {
      console.error('❌ [PDFVersionManager] Error cargando versiones:', error);
      
      // Fallback: usar PDF original
      const originalVersion: PDFVersion = {
        id: 'original',
        assignmentId,
        version: 'original',
        fileUrl: originalPdfUrl,
        annotations: [],
        createdBy: 'system',
        createdByRole: 'teacher',
        createdAt: new Date().toISOString(),
        status: 'draft',
      };
      
      setVersions([originalVersion]);
      setCurrentVersion(originalVersion);
      setWorkflowStatus('not_started');
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestVersion = (versionList: PDFVersion[]): PDFVersion | null => {
    if (versionList.length === 0) return null;

    // Ordenar por fecha de creación (más reciente primero)
    const sorted = [...versionList].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sorted[0];
  };

  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    loadVersions(); // Recargar versiones al cerrar el editor
  };

  const handleSaveFromEditor = async () => {
    console.log('✅ [PDFVersionManager] Versión guardada desde el editor');
    await loadVersions();
  };

  const handleDownloadVersion = async (version: PDFVersion) => {
    try {
      const link = document.createElement('a');
      link.href = version.fileUrl;
      link.download = `${assignmentTitle}_${version.version}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      
      toast.success('✅ Descarga iniciada');
    } catch (error) {
      console.error('❌ Error descargando versión:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  const getStatusBadge = () => {
    switch (workflowStatus) {
      case 'not_started':
        return <Badge variant="secondary">Sin iniciar</Badge>;
      case 'student_editing':
        return <Badge variant="default" className="bg-blue-500">Editando (Estudiante)</Badge>;
      case 'student_submitted':
        return <Badge variant="default" className="bg-orange-500">Enviado - Esperando corrección</Badge>;
      case 'teacher_correcting':
        return <Badge variant="default" className="bg-purple-500">En corrección (Profesor)</Badge>;
      case 'teacher_submitted':
        return <Badge variant="default" className="bg-green-500">Corregido</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const canEdit = (): boolean => {
    if (userRole === 'student') {
      return workflowStatus === 'not_started' || workflowStatus === 'student_editing' || workflowStatus === 'teacher_submitted';
    } else if (userRole === 'teacher') {
      return workflowStatus === 'student_submitted' || workflowStatus === 'teacher_correcting';
    }
    return false;
  };

  const getActionButtonLabel = (): string => {
    if (userRole === 'student') {
      if (workflowStatus === 'not_started' || workflowStatus === 'student_editing') {
        return 'Editar PDF';
      } else if (workflowStatus === 'teacher_submitted') {
        return 'Ver Corrección';
      } else if (workflowStatus === 'student_submitted') {
        return 'Ver mi entrega';
      }
    } else if (userRole === 'teacher') {
      if (workflowStatus === 'student_submitted' || workflowStatus === 'teacher_correcting') {
        return 'Corregir PDF';
      } else if (workflowStatus === 'teacher_submitted') {
        return 'Ver corrección enviada';
      }
    }
    return 'Ver PDF';
  };

  if (isEditorOpen) {
    return (
      <FullScreenPDFEditor
        assignmentId={assignmentId}
        assignmentTitle={assignmentTitle}
        pdfUrl={currentVersion?.fileUrl || originalPdfUrl}
        userRole={userRole}
        userId={userRole === 'teacher' && studentId ? studentId : userId}
        userName={userName}
        onClose={handleCloseEditor}
        onSave={handleSaveFromEditor}
      />
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando versiones...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Editor de PDF Colaborativo
            </CardTitle>
            <CardDescription className="mt-2">
              {assignmentTitle}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Flujo del proceso */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Flujo de trabajo
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                workflowStatus === 'not_started' || workflowStatus === 'student_editing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`} />
              <span className={workflowStatus === 'not_started' || workflowStatus === 'student_editing' ? 'font-semibold' : ''}>
                1. Estudiante edita el PDF
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                workflowStatus === 'student_submitted' ? 'bg-orange-500 animate-pulse' : 
                ['teacher_correcting', 'teacher_submitted', 'completed'].includes(workflowStatus) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={workflowStatus === 'student_submitted' ? 'font-semibold' : ''}>
                2. Estudiante envía al profesor
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                workflowStatus === 'teacher_correcting' ? 'bg-purple-500 animate-pulse' : 
                ['teacher_submitted', 'completed'].includes(workflowStatus) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={workflowStatus === 'teacher_correcting' ? 'font-semibold' : ''}>
                3. Profesor corrige el PDF
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                workflowStatus === 'teacher_submitted' || workflowStatus === 'completed' ? 'bg-green-600 animate-pulse' : 'bg-gray-300'
              }`} />
              <span className={workflowStatus === 'teacher_submitted' || workflowStatus === 'completed' ? 'font-semibold' : ''}>
                4. Estudiante recibe la corrección
              </span>
            </div>
          </div>
        </div>

        {/* Botón de acción principal */}
        <div className="flex gap-2">
          <Button
            onClick={handleOpenEditor}
            className="flex-1"
            disabled={!canEdit() && workflowStatus !== 'not_started'}
          >
            {canEdit() ? <Edit className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {getActionButtonLabel()}
          </Button>
          {currentVersion && (
            <Button
              variant="outline"
              onClick={() => handleDownloadVersion(currentVersion)}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          )}
        </div>

        {/* Historial de versiones */}
        {versions.length > 1 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historial de versiones
              </h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            Versión {version.version}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <User className="w-3 h-3" />
                            {version.createdByRole === 'teacher' ? 'Profesor' : 'Estudiante'}
                            <span>•</span>
                            {new Date(version.createdAt).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {version.status === 'submitted' && (
                          <Badge variant="outline" className="text-xs">
                            Enviado
                          </Badge>
                        )}
                        {version.status === 'corrected' && (
                          <Badge variant="default" className="text-xs bg-green-500">
                            Corregido
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadVersion(version)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 rounded-lg p-3">
          <p className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Los cambios se guardan automáticamente en el servidor
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Puedes descargar cualquier versión en cualquier momento
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Las anotaciones se mantienen entre ediciones
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
