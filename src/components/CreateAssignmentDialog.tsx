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
      <DialogContent className="max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{t('createAssignment')}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t('createTaskDialog')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">{t('assignmentTitle')}</Label>
            <Input
              id="title"
              placeholder={t('enterTitle')}
              className="text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">{t('description')}</Label>
            <Textarea
              id="description"
              placeholder={t('enterDescription')}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm">{t('dueDate')}</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-sm"
            />
          </div>

          <Tabs value={type} onValueChange={(v) => setType(v as any)}>
            {/* Mobile: Horizontal Scroll */}
            <div className="lg:hidden -mx-6 px-6 overflow-x-auto scrollbar-hide mt-2">
              <div className="flex gap-2 pb-2 min-w-max">
                <button
                  type="button"
                  onClick={() => setType('standard')}
                  className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all min-w-[95px] ${
                    type === 'standard'
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <FileText className={`w-5 h-5 mb-1 ${type === 'standard' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${type === 'standard' ? 'text-primary' : 'text-foreground'}`}>
                    {t('standard')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('interactive')}
                  className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all min-w-[95px] ${
                    type === 'interactive'
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <Gamepad2 className={`w-5 h-5 mb-1 ${type === 'interactive' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${type === 'interactive' ? 'text-primary' : 'text-foreground'}`}>
                    {t('interactive')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('form')}
                  className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all min-w-[95px] ${
                    type === 'form'
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <Plus className={`w-5 h-5 mb-1 ${type === 'form' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${type === 'form' ? 'text-primary' : 'text-foreground'}`}>
                    {t('form')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('video')}
                  className={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border-2 transition-all min-w-[95px] ${
                    type === 'video'
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <Video className={`w-5 h-5 mb-1 ${type === 'video' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${type === 'video' ? 'text-primary' : 'text-foreground'}`}>
                    {t('video')}
                  </span>
                </button>
              </div>
            </div>

            {/* Desktop: Grid */}
            <TabsList className="hidden lg:grid w-full grid-cols-4">
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

            <TabsContent value="standard" className="space-y-3 sm:space-y-4">
              <div>
                <Label className="text-sm">{t('attachedFiles')}</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <div className="text-center">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-muted-foreground" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
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
                  <div className="mt-3 sm:mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          <div>
                            <p className="text-xs sm:text-sm">{file.name}</p>
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
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="interactive" className="space-y-3 sm:space-y-4">
              <InteractiveFormBuilder 
                activities={interactiveActivities} 
                onChange={setInteractiveActivities} 
              />
            </TabsContent>

            <TabsContent value="form" className="space-y-3 sm:space-y-4">
              <FormBuilder fields={formFields} onChange={setFormFields} />
            </TabsContent>

            <TabsContent value="video" className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="text-sm">{t('videoUrl')}</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  className="text-sm"
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('videoSupport')}
                </p>
              </div>
              
              <div>
                <Label className="text-sm">{t('uploadVideo')}</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <div className="text-center">
                      <Video className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-muted-foreground" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
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

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto">{t('createAssignment')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
