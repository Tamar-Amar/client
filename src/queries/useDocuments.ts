import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDocumentsByWorker, uploadDocument, updateOperatorDocuments, deleteDocument, fetchAllDocuments, updateDocumentStatus } from '../services/documentService';
import { DocumentStatus } from '../types/Document';

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
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-documents', workerId] });
      queryClient.invalidateQueries({ queryKey: ['worker-attendance', workerId] });
    }
  });

  const updateDocumentsMutation = useMutation({
    mutationFn: (params: { tempId: string; newOperatorId: string }) => 
      updateOperatorDocuments(params.tempId, params.newOperatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-documents', workerId] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ documentId, status }: UpdateStatusParams) => 
      updateDocumentStatus(documentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['worker-documents', workerId] });
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
