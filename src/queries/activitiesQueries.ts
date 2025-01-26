import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllActivities, createActivity, deleteActivity, fetchActivitiesByOperator } from '../services/ActivityService';
import { Activity } from '../types/Activity';

// Fetch all activities
export const useFetchActivities = () => {
  return useQuery({
    queryKey: ['activities'],
    queryFn: fetchAllActivities,
    staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
  });
};

// Add a new activity
export const useAddActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] }); // Refresh activities after adding
    },
  });
};

// Delete an activity
export const useDeleteActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] }); // Refresh activities after deletion
    },
  });
};

export const useFetchActivitiesByOperator = (operatorId: string) => {
  return useQuery({
    queryKey: ['activities', operatorId],
    queryFn: () => fetchActivitiesByOperator(operatorId),
    staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
  });
};