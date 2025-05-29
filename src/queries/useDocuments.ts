import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDocumentsByWorker, uploadDocument, updateOperatorDocuments, deleteDocument } from '../services/documentService';

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.get('operatorId')] });
    },
  });
};

export const useFetchDocumentsByWorker = (workerId: string) => {
  return useQuery({
    queryKey: ['documents', workerId],
    queryFn: () => fetchDocumentsByWorker(workerId),
    enabled: !!workerId,
  });
};

interface UpdateDocumentsParams {
  tempId: string;
  newOperatorId: string;
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
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-documents', workerId] });
    }
  });

  const updateDocumentsMutation = useMutation({
    mutationFn: (params: { tempId: string; newOperatorId: string }) => 
      updateOperatorDocuments(params.tempId, params.newOperatorId),
    onSuccess: () => {
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
    isUpdating: updateDocumentsMutation.isPending
  };
};
