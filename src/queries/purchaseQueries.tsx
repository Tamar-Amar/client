import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPurchases,
  fetchPurchasesByClass,
  fetchPurchasesByStore,
  createPurchase,
} from '../services/PurchaseService';

export const useFetchAllPurchases = () => {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: fetchPurchases,
    staleTime: 1000 * 60 * 5, 
  });
};


export const useFetchPurchasesByClass = (classId: string) => {
  return useQuery({
    queryKey: ['purchases', classId],
    queryFn: () => fetchPurchasesByClass(classId),
    staleTime: 1000 * 60 * 5, 
  });
};


export const useFetchPurchasesByStore = (storeId: string) => {
  return useQuery({
    queryKey: ['purchases', storeId],
    queryFn: () => fetchPurchasesByStore(storeId),
    staleTime: 1000 * 60 * 5, 
  });
};


export const useAddPurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
};
