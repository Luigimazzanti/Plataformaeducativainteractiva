import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, FileText, Trash2, Users, BookOpen, Image, Music } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';

interface Material {
  id: string;
  title: string;
  description: string;
  type: 'book' | 'pdf' | 'video' | 'photo' | 'audio';
  fileUrl: string;
  fileName: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
}

export function TeacherMaterialsView() {
  const { t } = useLanguage();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'pdf' as Material['type'],
    fileUrl: '',
    fileName: '',
  });

  useEffect(() => {
    loadMaterials();
    loadStudents();
  }, []);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const { notes } = await apiClient.getNotes();
      setMaterials(notes || []);
    } catch (error: any) {
      console.error('Error loading materials:', error);
      const errorMessage = error?.message || 'Unknown error';
      console.error('Detailed error:', errorMessage);
      toast.error(`${t('error')}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const { students: myStudents } = await apiClient.getMyStudents();
      setStudents(myStudents || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await apiClient.uploadFile(file);
      setFormData({
        ...formData,
        fileUrl: result.url,
        fileName: result.name,
      });
      toast.success(t('success'));
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.fileUrl) {
      toast.error(t('pleaseEnterTitle'));
      return;
    }

    try {
      await apiClient.createNote(formData);
      toast.success(t('noteCreated'));
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        type: 'pdf',
        fileUrl: '',
        fileName: '',
      });
      loadMaterials();
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error(t('createError'));
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm(t('confirmDeleteNote'))) return;
    
    try {
      await apiClient.deleteNote(id);
      toast.success(t('noteDeleted'));
      loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error(t('deleteError'));
    }
  };

  const handleOpenAssignDialog = async (material: Material) => {
    setSelectedMaterial(material);
    try {
      const { studentIds } = await apiClient.getAssignedStudentsForNote(material.id);
      setAssignedStudents(studentIds || []);
    } catch (error) {
      console.error('Error loading assigned students:', error);
      setAssignedStudents([]);
    }
    setIsAssignDialogOpen(true);
  };

  const handleToggleStudent = (studentId: string) => {
    setAssignedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedMaterial) return;

    try {
      await apiClient.assignNote(selectedMaterial.id, assignedStudents);
      toast.success(t('noteAssigned'));
      setIsAssignDialogOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Error assigning material:', error);
      toast.error(t('assignError'));
    }
  };

  const getTypeIcon = (type: Material['type']) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'photo':
        return <Image className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'video':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Material['type']) => {
    switch (type) {
      case 'book':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'pdf':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'photo':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'audio':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'video':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl">{t('materials')}</h2>
          <p className="text-muted-foreground">{t('notesDescription')}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('uploadMaterial')}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t('loading')}</p>
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl mb-2">{t('noNotes')}</h3>
            <p className="text-muted-foreground text-center mb-6">
              {t('noNotesMessage')}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('uploadMaterial')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(material.type)}`}>
                      {getTypeIcon(material.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{material.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {t(material.type)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {material.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {material.description}
                  </p>
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenAssignDialog(material)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t('assignStudents')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(material.fileUrl, '_blank')}
                  >
                    {t('viewDetails')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMaterial(material.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t('created')}: {new Date(material.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Material Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('createNote')}</DialogTitle>
            <DialogDescription>{t('uploadMaterial')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMaterial} className="space-y-4">
            <div>
              <Label htmlFor="title">{t('noteTitle')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('enterTitle')}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">{t('noteType')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Material['type']) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">{t('pdf')}</SelectItem>
                  <SelectItem value="book">{t('book')}</SelectItem>
                  <SelectItem value="photo">{t('photo')}</SelectItem>
                  <SelectItem value="video">{t('video')}</SelectItem>
                  <SelectItem value="audio">{t('audio')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('enterDescription')}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="file">{t('attachedFiles')}</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                accept="*/*"
              />
              {isUploading && <p className="text-sm text-muted-foreground mt-2">{t('uploading')}</p>}
              {formData.fileName && (
                <p className="text-sm text-primary mt-2">
                  ✓ {formData.fileName}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isUploading || !formData.fileUrl}>
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Students Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('assignStudents')}</DialogTitle>
            <DialogDescription>
              {t('select')} {students.length} {t('students')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => handleToggleStudent(student.id)}
              >
                <div>
                  <p>{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
                <input
                  type="checkbox"
                  checked={assignedStudents.includes(student.id)}
                  onChange={() => {}}
                  className="w-5 h-5"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveAssignments}>
              {t('assign')} ({assignedStudents.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
