import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClasses, createClass, deleteClass, updateClass } from '../services/ClassService';
import { Class } from '../types/index';

export const useFetchClasses = () => {
  console.log('Fetching classes');
  return useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updatedClass }: { id: string; updatedClass: Partial<Class> }) => updateClass(id, updatedClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};