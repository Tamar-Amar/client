import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendanceService';

export const useUpdateAttendanceDocumentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, status }: { documentId: string, status: string }) =>
      attendanceService.updateAttendanceDocumentStatus(documentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReports'] });
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReport'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });
}; 