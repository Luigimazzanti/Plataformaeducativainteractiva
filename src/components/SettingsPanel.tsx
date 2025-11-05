import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sun, Moon, Globe, User, Palette, Save } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';
import { useLanguage, languageNames, Language } from '../utils/LanguageContext';
import { AvatarSelector } from './AvatarSelector';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: any;
  onUpdateProfile: (updates: any) => void;
}

export function SettingsPanel({ open, onOpenChange, userProfile, onUpdateProfile }: SettingsPanelProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  // Local state for pending changes
  const [pendingAvatar, setPendingAvatar] = useState<string>('');
  const [pendingTheme, setPendingTheme] = useState<'light' | 'dark'>('light');
  const [pendingLanguage, setPendingLanguage] = useState<Language>('es');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize pending state when modal opens or userProfile changes
  useEffect(() => {
    if (open && userProfile) {
      setPendingAvatar(userProfile.avatar || '');
      setPendingTheme(theme);
      setPendingLanguage(language);
      setHasChanges(false);
    }
  }, [open, userProfile, theme, language]);

  // Check if there are changes
  useEffect(() => {
    if (!userProfile) return;
    
    const avatarChanged = pendingAvatar !== (userProfile.avatar || '');
    const themeChanged = pendingTheme !== theme;
    const languageChanged = pendingLanguage !== language;
    
    setHasChanges(avatarChanged || themeChanged || languageChanged);
  }, [pendingAvatar, pendingTheme, pendingLanguage, userProfile, theme, language]);

  const handleAvatarSelect = (avatarUrl: string) => {
    setPendingAvatar(avatarUrl);
    setShowAvatarSelector(false);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setPendingTheme(newTheme);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setPendingLanguage(newLanguage);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Apply theme change if needed
      if (pendingTheme !== theme) {
        toggleTheme();
      }
      
      // Apply language change if needed
      if (pendingLanguage !== language) {
        setLanguage(pendingLanguage);
      }
      
      // Update avatar in profile if changed
      if (pendingAvatar !== (userProfile.avatar || '')) {
        // Store avatar preference in localStorage for persistence
        localStorage.setItem(`user_avatar_${userProfile.id}`, pendingAvatar);
        
        // Update profile through parent component
        await onUpdateProfile({ avatar: pendingAvatar });
      }
      
      toast.success(t('changesSaved') || 'Cambios guardados correctamente');
      setHasChanges(false);
      
      // Close modal after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('errorSavingChanges') || 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset pending changes
    if (userProfile) {
      setPendingAvatar(userProfile.avatar || '');
    }
    setPendingTheme(theme);
    setPendingLanguage(language);
    setHasChanges(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen && hasChanges) {
          // Ask for confirmation if there are unsaved changes
          const confirmed = window.confirm(t('unsavedChanges') || '¿Descartar cambios no guardados?');
          if (!confirmed) return;
        }
        handleCancel();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              {t('settings')}
            </DialogTitle>
            <DialogDescription>
              {t('settingsDescription') || 'Personaliza tu perfil, tema e idioma'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white dark:border-gray-800 shadow-lg">
                      <AvatarImage src={pendingAvatar || userProfile?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                        {userProfile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => setShowAvatarSelector(true)}
                      className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-all shadow-md"
                    >
                      <User className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-medium truncate">{userProfile?.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{userProfile?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {userProfile?.role === 'teacher' ? t('teacher') : t('student')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAvatarSelector(true)}
                    className="w-full sm:w-auto"
                  >
                    {t('changeAvatar')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Theme Setting */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                {pendingTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {t('theme')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    pendingTheme === 'light'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                      <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-medium text-sm sm:text-base">{t('lightMode')}</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    pendingTheme === 'dark'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-gray-800 rounded-lg shadow-sm flex-shrink-0">
                      <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-medium text-sm sm:text-base">{t('darkMode')}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Language Setting */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('language')}
              </Label>
              <Select value={pendingLanguage} onValueChange={(v) => handleLanguageChange(v as Language)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(languageNames).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getLanguageFlag(code as Language)}</span>
                        <span>{name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-0 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 sm:flex-none"
              disabled={isSaving}
            >
              {t('cancel') || 'Cancelar'}
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={!hasChanges || isSaving}
              className="flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? (t('saving') || 'Guardando...') : (t('saveChanges') || 'Guardar Cambios')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AvatarSelector
        open={showAvatarSelector}
        onOpenChange={setShowAvatarSelector}
        onSelect={handleAvatarSelect}
        currentAvatar={pendingAvatar || userProfile?.avatar}
      />
    </>
  );
}

function getLanguageFlag(lang: Language): string {
  const flags: Record<Language, string> = {
    es: '🇪🇸',
    en: '🇬🇧',
    it: '🇮🇹',
    de: '🇩🇪',
    fr: '🇫🇷',
    pt: '🇵🇹',
    zh: '🇨🇳',
    ja: '🇯🇵',
  };
  return flags[lang] || '🌐';
}
