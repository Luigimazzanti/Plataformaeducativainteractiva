import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, UserCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '../utils/api';

interface AssignmentStatsCardProps {
  assignment: any;
}

export function AssignmentStatsCard({ assignment }: AssignmentStatsCardProps) {
  const [assignedCount, setAssignedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [assignment]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const { studentIds } = await apiClient.getAssignedStudents(assignment.id);
      setAssignedCount(studentIds?.length || 0);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {assignedCount > 0 ? (
        <Badge variant="default" className="gap-1">
          <UserCheck className="w-3 h-3" />
          Asignado a {assignedCount} estudiante{assignedCount !== 1 ? 's' : ''}
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Sin asignar
        </Badge>
      )}
    </div>
  );
}
