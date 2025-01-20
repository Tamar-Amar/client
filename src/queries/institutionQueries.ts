// src/queries/institutionQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Institution } from '../types/Institution';
import { createInstitution, deleteInstitution, fetchInstitutions } from '../services/InstitutionService';

// Fetch all institutions
export const useFetchInstitutions = () => {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: fetchInstitutions,
    staleTime: 1000 * 60 * 5,
  });
};
  
// Add a new institution
export const useAddInstitution = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (newInstitution: Institution) => {
        const { data } = await createInstitution(newInstitution);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['institutions'] });
      },
    });
  };
  

// Delete an institution
export const useDeleteInstitution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (institutionId: string) => {
        await deleteInstitution(institutionId);
        },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });
};
