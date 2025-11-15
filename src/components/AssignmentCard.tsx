import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Trash2, Eye, FileText, Video, ClipboardList, Gamepad2, Users, Pencil } from 'lucide-react';
import { AssignmentDetailDialog } from './AssignmentDetailDialog';
import { AssignTaskDialog } from './AssignTaskDialog';
import { AssignmentStatsCard } from './AssignmentStatsCard';
import { EditAssignmentDialog } from './EditAssignmentDialog';

interface AssignmentCardProps {
  assignment: any;
  isTeacher: boolean;
  onDelete?: (id: string) => void;
  onSubmissionComplete?: () => void;
  onAssignmentUpdated?: () => void;
  currentUser?: any; // ✅ NUEVO
}

export function AssignmentCard({ assignment, isTeacher, onDelete, onSubmissionComplete, onAssignmentUpdated, currentUser }: AssignmentCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  const getTypeIcon = () => {
    switch (assignment.type) {
      case 'ia-quiz':
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

  const getTypeBadge = () => {
    switch (assignment.type) {
      case 'ia-quiz':
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

  // Calcular si hay entregas nuevas sin revisar
  const hasNewSubmissions = isTeacher && assignment.newSubmissionsCount > 0;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer relative" onClick={() => setShowDetail(true)}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <div className="p-2 bg-accent rounded-lg text-primary flex-shrink-0">
                {getTypeIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg line-clamp-1 break-words">{assignment.title}</CardTitle>
                {assignment.teacherName && (
                  <CardDescription className="text-xs mt-1 truncate">
                    Profesor: {assignment.teacherName}
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-1 mb-4 break-words">{assignment.description}</p>
          
          {/* Badges en una sola línea SIEMPRE */}
          <div className="flex gap-2 items-center mb-4 overflow-x-auto whitespace-nowrap">
            {/* Badge de tipo */}
            <div className="flex-shrink-0">
              {getTypeBadge()}
            </div>
            
            {/* Badge de fecha */}
            {assignment.dueDate ? (
              <Badge variant={isOverdue ? 'destructive' : 'outline'} className="text-xs flex-shrink-0">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{new Date(assignment.dueDate).toLocaleDateString('es-ES')}</span>
              </Badge>
            ) : null}
            
            {/* Stats */}
            {isTeacher && (
              <div className="flex-shrink-0">
                <AssignmentStatsCard assignment={assignment} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 min-w-[90px]"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetail(true);
              }}
            >
              <Eye className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Ver Detalles</span>
            </Button>
            {isTeacher && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditDialog(true);
                  }}
                  title="Editar tarea"
                  className="flex-shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAssignDialog(true);
                  }}
                  title="Asignar a estudiantes"
                  className="flex-shrink-0"
                >
                  <Users className="w-4 h-4" />
                </Button>
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(assignment.id);
                    }}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AssignmentDetailDialog
        assignment={assignment}
        open={showDetail}
        onOpenChange={setShowDetail}
        isTeacher={isTeacher}
        onSubmissionComplete={onSubmissionComplete}
        currentUser={currentUser}
      />

      {isTeacher && (
        <>
          <AssignTaskDialog
            assignment={assignment}
            open={showAssignDialog}
            onOpenChange={setShowAssignDialog}
            onAssignmentUpdated={onAssignmentUpdated}
          />
          
          <EditAssignmentDialog
            assignment={assignment}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSubmit={async (id, data) => {
              // Llamar al API para actualizar la tarea
              const { apiClient } = await import('../utils/api');
              await apiClient.updateAssignment(id, data);
              // Notificar al componente padre
              if (onAssignmentUpdated) {
                onAssignmentUpdated();
              }
            }}
          />
        </>
      )}
    </>
  );
}