import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDocumentsByOperator, uploadDocument, updateOperatorDocuments } from '../services/documentService';

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.get('operatorId')] });
    },
  });
};

export const useFetchDocumentsByOperator = (operatorId: string) => {
  return useQuery({
    queryKey: ['documents', operatorId],
    queryFn: () => fetchDocumentsByOperator(operatorId),
    enabled: !!operatorId,
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
