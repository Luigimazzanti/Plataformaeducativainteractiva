import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { apiClient } from '../utils/api';
import { Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ScrollArea } from './ui/scroll-area';
import { useLanguage } from '../utils/LanguageContext';

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
  onAssignmentUpdated?: () => void;
}

export function AssignTaskDialog({ open, onOpenChange, assignment, onAssignmentUpdated }: AssignTaskDialogProps) {
  const { t } = useLanguage();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && assignment) {
      loadData();
    }
  }, [open, assignment]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [studentsRes, assignedRes] = await Promise.all([
        apiClient.getMyStudents(),
        apiClient.getAssignedStudents(assignment.id)
      ]);
      
      setStudents(studentsRes.students || []);
      setSelectedStudents(assignedRes.studentIds || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAll = () => {
    setSelectedStudents(students.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedStudents([]);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiClient.assignTask(assignment.id, selectedStudents);
      toast.success(t('assignTaskSuccess'));
      onAssignmentUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error(t('assignError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>{t('assignStudents')}</DialogTitle>
          <DialogDescription>
            {t('assignStudents')}: "{assignment?.title}"
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
            <h3 className="text-xl mb-2">{t('noStudents')}</h3>
            <p className="text-muted-foreground text-center mb-2">
              {t('allStudents')}
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 my-4 text-left max-w-md mx-auto">
              <p className="text-sm mb-2 text-foreground">
                <strong>{t('howAssignmentWorks')}</strong>
              </p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-foreground">
                <li>{t('assignmentStep1')}</li>
                <li>{t('assignmentStep2')}</li>
                <li>{t('assignmentStep3')}</li>
              </ol>
            </div>
            <Button onClick={() => onOpenChange(false)}>
              {t('close')}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll} className="flex-1">
                  {t('selectAll')}
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll} className="flex-1">
                  {t('cancelAll')}
                </Button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 justify-center bg-accent/50 rounded-md py-2">
                <UserCheck className="w-4 h-4" />
                <span>{selectedStudents.length} {t('of')} {students.length}</span>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <Label className="cursor-pointer">
                        <p className="truncate">{student.name}</p>
                        <p className="text-sm text-gray-600 truncate">{student.email}</p>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? t('saving') : t('save')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
