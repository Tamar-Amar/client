import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendanceService';



export const useAllCampAttendanceReports = () => {
  return useQuery({
    queryKey: ['allCampAttendanceReports'],
    queryFn: () => attendanceService.getCampAttendanceReports(),
    staleTime: 5 * 60 * 1000, // 5 דקות
    gcTime: 10 * 60 * 1000, // 10 דקות
  });
};

export const useCampAttendanceReport = (id: string) => {
  return useQuery({
    queryKey: ['campAttendanceReport', id],
    queryFn: () => attendanceService.getCampAttendanceReport(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCampAttendanceByCoordinator = (coordinatorId: string) => {
  return useQuery({
    queryKey: ['campAttendanceByCoordinator', coordinatorId],
    queryFn: () => attendanceService.getCampAttendanceByCoordinator(coordinatorId),
    enabled: !!coordinatorId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateCampAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceService.createCampAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReports'] });
    },
  });
};

export const useUpdateCampAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      attendanceService.updateCampAttendance(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReports'] });
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReport', variables.id] });
    },
  });
};

export const useDeleteCampAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceService.deleteCampAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReports'] });
    },
  });
};

export const useUploadAttendanceDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      recordId, 
      docType, 
      file, 
      docIndex 
    }: { 
      recordId: string; 
      docType: 'workerAttendanceDoc' | 'studentAttendanceDoc' | 'controlDocs'; 
      file: File; 
      docIndex?: number; 
    }) => attendanceService.uploadAttendanceDocument(recordId, docType, file, docIndex),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReports'] });
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReport', variables.recordId] });
    },
  });
};

export const useDeleteAttendanceDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceService.deleteCampAttendanceDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReports'] });
    },
  });
};

export const useDeleteCampAttendanceRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceService.deleteCampAttendanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReports'] });
    },
  });
};

export const useClassesByCoordinatorInstitutionCodes = (coordinatorId: string) => {
  return useQuery({
    queryKey: ['classesByCoordinatorInstitutionCodes', coordinatorId],
    queryFn: () => attendanceService.getClassesByCoordinatorInstitutionCodes(coordinatorId),
    enabled: !!coordinatorId,
  });
};

export const useCreateCampAttendanceWithFiles = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceService.createCampAttendanceWithFiles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campAttendanceReports'] });
    },
  });
};

export const useGetDocumentUrl = () => {
  return useMutation({
    mutationFn: attendanceService.getDocumentUrl,
  });
}; 

