import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDocumentsByWorker, uploadDocument, updateOperatorDocuments, deleteDocument, fetchAllDocuments, updateDocumentStatus, fetchAllPersonalDocuments } from '../services/documentService';
import { DocumentStatus } from '../types/Document';
import axiosInstance from '../services/axiosConfig';

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.get('operatorId')] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useFetchAllDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => fetchAllDocuments(),
  });
};

export const useFetchAllPersonalDocuments = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['personal-documents'],
    queryFn: () => fetchAllPersonalDocuments(),
    enabled: enabled,
  });
};

export const useFetchAttendanceDocuments = (projectCode: string) => {
  return useQuery({
    queryKey: ['attendance-documents', projectCode],
    queryFn: () => axiosInstance.get(`/api/documents/attendance/${projectCode}`).then(res => res.data),
    enabled: !!projectCode && projectCode !== '',
  });
};

interface UpdateDocumentsParams {
  tempId: string;
  newOperatorId: string;
}

interface UpdateStatusParams {
  documentId: string;
  status: DocumentStatus;
}

export const useUpdateDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tempId, newOperatorId }: UpdateDocumentsParams) => 
      updateOperatorDocuments(tempId, newOperatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['personal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['worker-documents'] });
    }
  });
};

export const useUpdateDocumentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, status }: UpdateStatusParams) => 
      updateDocumentStatus(documentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['personal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['worker-documents'] });
    }
  });
};

export const useWorkerDocuments = (workerId: string) => {
  const queryClient = useQueryClient();

  const documents = useQuery({
    queryKey: ['worker-documents', workerId],
    queryFn: () => fetchDocumentsByWorker(workerId)
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-documents', workerId] });
      queryClient.invalidateQueries({ queryKey: ['worker-attendance', workerId] });
      queryClient.invalidateQueries({ queryKey: ['personal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-documents', workerId] });
      queryClient.invalidateQueries({ queryKey: ['worker-attendance', workerId] });
      queryClient.invalidateQueries({ queryKey: ['personal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  const updateDocumentsMutation = useMutation({
    mutationFn: (params: { tempId: string; newOperatorId: string }) => 
      updateOperatorDocuments(params.tempId, params.newOperatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-documents', workerId] });
      queryClient.invalidateQueries({ queryKey: ['worker-attendance', workerId] });
      queryClient.invalidateQueries({ queryKey: ['personal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ documentId, status }: UpdateStatusParams) => 
      updateDocumentStatus(documentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['worker-documents', workerId] });
      queryClient.invalidateQueries({ queryKey: ['worker-attendance', workerId] });
      queryClient.invalidateQueries({ queryKey: ['personal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  return {
    documents: documents.data || [],
    isLoading: documents.isLoading,
    isError: documents.isError,
    error: documents.error,
    uploadDocument: uploadDocumentMutation.mutate,
    isUploading: uploadDocumentMutation.isPending,
    deleteDocument: deleteDocumentMutation.mutate,
    isDeleting: deleteDocumentMutation.isPending,
    updateDocuments: updateDocumentsMutation.mutate,
    isUpdating: updateDocumentsMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending
  };
};


export const useDocumentStats = () => {
  return useQuery({
    queryKey: ['documentStats'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/documents/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 דקות
  });
};

export const useDocumentTypes = () => {
  return useQuery({
    queryKey: ['documentTypes'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/documents/types');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 דקות
  });
};




export const useDownloadMultipleDocuments = () => {
  return useMutation({
    mutationFn: async (filters: {
      documentIds?: string[];
      documentType?: string;
      status?: string;
      workerId?: string;
      project?: string;
      dateFrom?: string;
      dateTo?: string;
      organizationType?: 'byType' | 'byWorker';
      fileNameFormat?: 'simple' | 'detailed';
      selectedProject?: string;
      projectOrganization?: 'byClass' | 'byType';
      maxDocuments?: number;
    }) => {
      const response = await axiosInstance.post('/api/documents/download-multiple', filters, {
        responseType: 'blob',
        timeout: 300000, // 5 דקות timeout
      });
      return response.data;
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `documents-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};

export const useBulkUpdateDocumentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      documentIds: string[];
      status: string;
      comments?: string;
    }) => {
      const response = await axiosInstance.patch('/api/documents/bulk-update-status', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentStats'] });
      queryClient.invalidateQueries({ queryKey: ['documentsWithFilters'] });
    },
  });
};

export const useBulkDeleteDocuments = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (documentIds: string[]) => {
      const response = await axiosInstance.delete('/api/documents/bulk-delete', {
        data: { documentIds }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentStats'] });
      queryClient.invalidateQueries({ queryKey: ['documentsWithFilters'] });
    },
  });
};
