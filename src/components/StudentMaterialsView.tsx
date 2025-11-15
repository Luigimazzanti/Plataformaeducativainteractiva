import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FileText, BookOpen, Image, Music, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

interface Material {
  id: string;
  title: string;
  description: string;
  type: 'book' | 'pdf' | 'video' | 'photo' | 'audio';
  fileUrl: string;
  fileName: string;
  teacherName: string;
  createdAt: string;
  status: 'new' | 'unread' | 'read';
}

interface GroupedMaterials {
  [year: string]: {
    [month: string]: {
      [week: string]: Material[];
    };
  };
}

export function StudentMaterialsView() {
  const { t } = useLanguage();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      // TODO: Implementar endpoint de materiales
      // Por ahora, sin materiales disponibles
      setMaterials([]);
    } catch (error: any) {
      console.log('Materials endpoint not available yet');
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMaterial = async (material: Material) => {
    try {
      // Mark as opened (new -> unread)
      await apiClient.markNoteAsOpened(material.id);
      
      // Open the file
      window.open(material.fileUrl, '_blank');
      
      // Reload to update status
      loadMaterials();
    } catch (error) {
      console.error('Error opening material:', error);
    }
  };

  const handleMarkAsRead = async (material: Material) => {
    try {
      await apiClient.markNoteAsRead(material.id);
      toast.success(t('success'));
      loadMaterials();
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error(t('error'));
    }
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getWeekRange = (year: number, week: number) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    const weekEnd = new Date(ISOweekStart);
    weekEnd.setDate(ISOweekStart.getDate() + 6);
    
    return {
      start: ISOweekStart.getDate(),
      end: weekEnd.getDate(),
      month: ISOweekStart.toLocaleString('es-ES', { month: 'long' })
    };
  };

  const groupMaterialsByDate = (): GroupedMaterials => {
    const grouped: GroupedMaterials = {};
    
    materials.forEach(material => {
      const date = new Date(material.createdAt);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('es-ES', { month: 'long' });
      const weekNum = getWeekNumber(date);
      const weekRange = getWeekRange(date.getFullYear(), weekNum);
      const weekLabel = `${t('weekOf')} ${weekRange.start} ${t('to')} ${weekRange.end} ${t('of')} ${month}`;

      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][month]) grouped[year][month] = {};
      if (!grouped[year][month][weekLabel]) grouped[year][month][weekLabel] = [];
      
      grouped[year][month][weekLabel].push(material);
    });
    
    return grouped;
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

  const getStatusBadge = (status: Material['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-primary">{t('statusNew')}</Badge>;
      case 'unread':
        return <Badge variant="secondary">{t('statusUnread')}</Badge>;
      case 'read':
        return <Badge variant="outline">{t('statusRead')}</Badge>;
    }
  };

  const groupedMaterials = groupMaterialsByDate();
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">{t('materials')}</h2>
        <p className="text-muted-foreground">{t('notesDescription')}</p>
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
            <p className="text-muted-foreground text-center">
              {t('noNotesMessage')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={[currentYear]} className="space-y-4">
          {Object.keys(groupedMaterials).sort((a, b) => parseInt(b) - parseInt(a)).map(year => (
            <AccordionItem key={year} value={year} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{year}</span>
                  <Badge variant="secondary">
                    {Object.values(groupedMaterials[year]).reduce((acc, months) => 
                      acc + Object.values(months).reduce((acc2, weeks) => acc2 + weeks.length, 0), 0
                    )} {t('materials')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <Accordion type="multiple" defaultValue={year === currentYear ? [new Date().toLocaleString('es-ES', { month: 'long' })] : []}>
                  {Object.keys(groupedMaterials[year]).map(month => (
                    <AccordionItem key={month} value={month} className="border-l-2 pl-4 ml-2">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span>{month} {year}</span>
                          <Badge variant="outline">
                            {Object.values(groupedMaterials[year][month]).reduce((acc, weeks) => acc + weeks.length, 0)}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-4 space-y-4">
                        {Object.keys(groupedMaterials[year][month]).map(week => (
                          <div key={week} className="space-y-3">
                            <h4 className="text-sm text-muted-foreground">{week}</h4>
                            <div className="space-y-3">
                              {groupedMaterials[year][month][week].map(material => (
                                <Card 
                                  key={material.id} 
                                  className="hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => handleOpenMaterial(material)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                                          {getTypeIcon(material.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className="truncate">{material.title}</h4>
                                            {getStatusBadge(material.status)}
                                          </div>
                                          {material.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                              {material.description}
                                            </p>
                                          )}
                                          <p className="text-xs text-muted-foreground mt-2">
                                            {t('teacher')}: {material.teacherName}
                                          </p>
                                        </div>
                                      </div>
                                      {material.status !== 'read' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsRead(material);
                                          }}
                                        >
                                          {t('markAsRead')}
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
