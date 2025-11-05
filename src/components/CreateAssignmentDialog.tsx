import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Upload, Video, FileText, Gamepad2 } from 'lucide-react';
import { apiClient } from '../utils/api';
import { FormBuilder } from './FormBuilder';
import { InteractiveFormBuilder, InteractiveActivity } from './InteractiveFormBuilder';
import { useLanguage } from '../utils/LanguageContext';

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

export function CreateAssignmentDialog({ open, onOpenChange, onSubmit }: CreateAssignmentDialogProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<'standard' | 'form' | 'video' | 'interactive'>('standard');
  const [formFields, setFormFields] = useState<any[]>([]);
  const [interactiveActivities, setInteractiveActivities] = useState<InteractiveActivity[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(fileList).map((file) => apiClient.uploadFile(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles([...files, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(t('uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert(t('pleaseEnterTitle'));
      return;
    }

    const assignmentData: any = {
      title,
      description,
      dueDate,
      type,
      files,
      createdAt: new Date().toISOString(),
    };

    if (type === 'form') {
      assignmentData.formFields = formFields;
    } else if (type === 'interactive') {
      assignmentData.interactiveActivities = interactiveActivities;
    } else if (type === 'video') {
      assignmentData.videoUrl = videoUrl;
    }

    onSubmit(assignmentData);
    
    // Reset form
    setTitle('');
    setDescription('');
    setDueDate('');
    setType('standard');
    setFormFields([]);
    setInteractiveActivities([]);
    setVideoUrl('');
    setFiles([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createAssignment')}</DialogTitle>
          <DialogDescription>
            {t('createTaskDialog')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">{t('assignmentTitle')}</Label>
            <Input
              id="title"
              placeholder={t('enterTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              placeholder={t('enterDescription')}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">{t('dueDate')}</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <Tabs value={type} onValueChange={(v) => setType(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="standard">
                <FileText className="w-4 h-4 mr-2" />
                {t('standard')}
              </TabsTrigger>
              <TabsTrigger value="interactive">
                <Gamepad2 className="w-4 h-4 mr-2" />
                {t('interactive')}
              </TabsTrigger>
              <TabsTrigger value="form">
                <Plus className="w-4 h-4 mr-2" />
                {t('form')}
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="w-4 h-4 mr-2" />
                {t('video')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-4">
              <div>
                <Label>{t('attachedFiles')}</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isUploading ? t('uploading') : t('clickToUpload')}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="interactive" className="space-y-4">
              <InteractiveFormBuilder 
                activities={interactiveActivities} 
                onChange={setInteractiveActivities} 
              />
            </TabsContent>

            <TabsContent value="form" className="space-y-4">
              <FormBuilder fields={formFields} onChange={setFormFields} />
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">{t('videoUrl')}</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('videoSupport')}
                </p>
              </div>
              
              <div>
                <Label>{t('uploadVideo')}</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <div className="text-center">
                      <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isUploading ? t('uploading') : t('clickToUploadVideo')}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmit}>{t('createAssignment')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
