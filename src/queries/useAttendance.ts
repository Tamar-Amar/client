import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendanceService';

interface AttendanceSubmission {
  workerId: string;
  classId: string;
  month: string;
  studentAttendanceDoc?: string;
  workerAttendanceDoc?: string;
  controlDoc?: string;
}

export const useAttendance = (workerId: string) => {
  const queryClient = useQueryClient();

  const attendance = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceService.geAllAttendance()
  });

  const workerAttendance = useQuery({
    queryKey: ['worker-attendance', workerId],
    queryFn: () => attendanceService.getWorkerAttendance(workerId)
  });

  const submitAttendanceMutation = useMutation({
    mutationFn: (data: AttendanceSubmission) => attendanceService.submitAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-attendance', workerId] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: string) => attendanceService.deleteAttendanceRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-attendance', workerId] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  return {
    attendance: attendance.data || [],
    workerAttendance: workerAttendance.data || [],
    isLoading: attendance.isLoading,
    isError: attendance.isError,
    error: attendance.error,
    submitAttendance: submitAttendanceMutation.mutate,
    deleteAttendance: deleteAttendanceMutation.mutate,
    isDeleting: deleteAttendanceMutation.isPending
  };
}; 