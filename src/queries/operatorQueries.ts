import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOperators, createOperator, deleteOperator, updateOperatorDetails, fetchOperatorById } from '../services/OperatorService';
import { Operator } from '../types/Operator';

export const useFetchOperators = () => {
  return useQuery({
    queryKey: ['operators'],
    queryFn: fetchOperators,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddOperator = () => {
  console.log('use add operator');
  const queryClient = useQueryClient();
  console.log('queryClient', queryClient);
  return useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      console.log('onSuccess');
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      console.log('onSuccess');
    },
  });
};

export const useDeleteOperator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
  });
};

export const useUpdateOperator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOperatorDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
  });
};

export const useFetchOperator = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['operator'],
    queryFn: fetchOperators,
    enabled: options?.enabled ?? true, // ברירת מחדל: מאופשר
  });
};