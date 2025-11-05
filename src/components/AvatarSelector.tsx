import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, Smile, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { useLanguage } from '../utils/LanguageContext';
import { Alert, AlertDescription } from './ui/alert';

interface AvatarSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (avatarUrl: string) => void;
  currentAvatar?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSIONS = 2000; // 2000x2000px
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export function AvatarSelector({ open, onOpenChange, onSelect, currentAvatar }: AvatarSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<'upload' | 'choose'>('choose');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [validationSuccess, setValidationSuccess] = useState(false);
  const { t } = useLanguage();

  const validateImage = (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        resolve({ valid: false, error: t('invalidFileType') || 'Solo se permiten archivos PNG o JPG/JPEG' });
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        resolve({ 
          valid: false, 
          error: `${t('fileTooLarge') || 'Archivo muy grande'}: ${sizeMB}MB. ${t('maxFileSize') || 'Máximo 2MB'}.` 
        });
        return;
      }

      // Check dimensions
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
            resolve({ 
              valid: false, 
              error: `${t('imageTooLarge') || 'Imagen muy grande'}: ${img.width}x${img.height}px. ${t('maxDimensions') || 'Máximo 2000x2000px'}.` 
            });
          } else {
            resolve({ valid: true });
          }
        };
        img.onerror = () => {
          resolve({ valid: false, error: t('invalidImage') || 'Imagen inválida' });
        };
        img.src = e.target?.result as string;
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setValidationSuccess(false);

    const validation = await validateImage(file);
    
    if (!validation.valid) {
      setUploadError(validation.error || '');
      setUploadedImage('');
      return;
    }

    // If validation passed, read the file
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setSelectedAvatar(result);
      setValidationSuccess(true);
      setUploadError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPredefined = (index: number, variant: string = 'avataaars') => {
    const avatarUrl = `https://api.dicebear.com/7.x/${variant}/svg?seed=${index}`;
    setSelectedAvatar(avatarUrl);
    setUploadedImage('');
    setUploadError('');
    setValidationSuccess(false);
  };

  const handleConfirmSelection = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      setSelectedAvatar('');
      setUploadedImage('');
      setUploadError('');
      setValidationSuccess(false);
    }
  };

  const generateAvatarUrl = (index: number, variant: string = 'avataaars') => {
    return `https://api.dicebear.com/7.x/${variant}/svg?seed=${index}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <span className="truncate">{t('selectAvatar')}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t('customization')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="choose" className="text-xs sm:text-sm">
              <Smile className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="truncate">{t('selectAvatar')}</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs sm:text-sm">
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="truncate">{t('uploadOwn') || 'Subir propia'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="choose" className="mt-4">
            <ScrollArea className="max-h-[50vh] overflow-y-auto pr-2 sm:pr-4">
              <div className="space-y-4 sm:space-y-6">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('selectAvatar')}
                </p>
                
                {/* Avataaars Style */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t('style')}: Caricatura</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const avatarUrl = generateAvatarUrl(i, 'avataaars');
                      const isSelected = selectedAvatar === avatarUrl;
                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectPredefined(i, 'avataaars')}
                          className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${
                            isSelected 
                              ? 'border-primary ring-2 ring-primary ring-offset-2' 
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          <img
                            src={avatarUrl}
                            alt={`Avatar ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottts Style */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t('style')}: Robot</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const avatarUrl = generateAvatarUrl(i + 100, 'bottts');
                      const isSelected = selectedAvatar === avatarUrl;
                      return (
                        <button
                          key={i + 100}
                          onClick={() => handleSelectPredefined(i + 100, 'bottts')}
                          className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${
                            isSelected 
                              ? 'border-secondary ring-2 ring-secondary ring-offset-2' 
                              : 'border-border hover:border-secondary'
                          }`}
                        >
                          <img
                            src={avatarUrl}
                            alt={`Robot ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fun Emoji Style */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t('style')}: Divertido</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const avatarUrl = generateAvatarUrl(i + 200, 'fun-emoji');
                      const isSelected = selectedAvatar === avatarUrl;
                      return (
                        <button
                          key={i + 200}
                          onClick={() => handleSelectPredefined(i + 200, 'fun-emoji')}
                          className={`aspect-square rounded-full overflow-hidden border-2 transition-all bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 ${
                            isSelected 
                              ? 'border-amber-500 ring-2 ring-amber-500 ring-offset-2' 
                              : 'border-border hover:border-amber-500'
                          }`}
                        >
                          <img
                            src={avatarUrl}
                            alt={`Fun ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Adventurer Style */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t('style')}: Aventurero</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const avatarUrl = generateAvatarUrl(i + 300, 'adventurer');
                      const isSelected = selectedAvatar === avatarUrl;
                      return (
                        <button
                          key={i + 300}
                          onClick={() => handleSelectPredefined(i + 300, 'adventurer')}
                          className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${
                            isSelected 
                              ? 'border-green-500 ring-2 ring-green-500 ring-offset-2' 
                              : 'border-border hover:border-green-500'
                          }`}
                        >
                          <img
                            src={avatarUrl}
                            alt={`Adventurer ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Personas Style */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t('style')}: Personas</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                    {Array.from({ length: 18 }).map((_, i) => {
                      const avatarUrl = generateAvatarUrl(i + 400, 'personas');
                      const isSelected = selectedAvatar === avatarUrl;
                      return (
                        <button
                          key={i + 400}
                          onClick={() => handleSelectPredefined(i + 400, 'personas')}
                          className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${
                            isSelected 
                              ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' 
                              : 'border-border hover:border-blue-500'
                          }`}
                        >
                          <img
                            src={avatarUrl}
                            alt={`Persona ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            {/* Validation Rules */}
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-xs text-foreground">
                <strong className="block mb-1">{t('uploadRequirements') || 'Requisitos de subida'}:</strong>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>{t('maxFileSize') || 'Peso máximo'}: <strong>2 MB</strong></li>
                  <li>{t('maxDimensions') || 'Dimensiones máximas'}: <strong>2000 x 2000 px</strong></li>
                  <li>{t('allowedFormats') || 'Formatos permitidos'}: <strong>PNG, JPG, JPEG</strong></li>
                </ul>
              </AlertDescription>
            </Alert>

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {uploadError}
                </AlertDescription>
              </Alert>
            )}

            {validationSuccess && (
              <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-sm text-foreground">
                  {t('imageValidated') || '✓ Imagen validada correctamente'}
                </AlertDescription>
              </Alert>
            )}

            <div className="border-2 border-dashed border-border rounded-lg p-8 hover:border-primary transition-colors">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  {t('clickToUpload')}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG {t('upTo') || 'hasta'} 2MB · Max 2000x2000px
                </p>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadedImage && (
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-32 h-32 border-4 border-primary">
                  <AvatarImage src={uploadedImage} />
                </Avatar>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer with action buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedAvatar('');
              setUploadedImage('');
              setUploadError('');
              setValidationSuccess(false);
              onOpenChange(false);
            }}
          >
            {t('cancel') || 'Cancelar'}
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedAvatar}
          >
            {t('select') || 'Seleccionar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
