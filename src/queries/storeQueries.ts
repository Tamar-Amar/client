import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStores, createStore, deleteStore, updateStoreDetails } from '../services/StoreService';
import { Store } from '../types/index';

// Fetch all stores
export const useFetchStores = () => {
  return useQuery({
    queryKey: ['stores'],
    queryFn: fetchStores,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Add a new store
export const useAddStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
};

// Delete a store
export const useDeleteStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
};


export const useUpdateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updatedStore }: { id: string; updatedStore: Partial<Store> }) => {
      return updateStoreDetails(id, updatedStore);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] }); // מרענן את כל החנויות
    },
  });
};
