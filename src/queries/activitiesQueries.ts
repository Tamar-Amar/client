import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllActivities, createActivity, deleteActivity, fetchActivitiesByOperator } from '../services/ActivityService';
import { Activity } from '../types/index';

export const useFetchActivities = () => {
  return useQuery({
    queryKey: ['activities'],
    queryFn: fetchAllActivities,
    staleTime: 1000 * 60 * 5, 
  });
};

export const useAddActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createActivity,
    onSuccess: (newActivity: Activity) => {
      queryClient.setQueryData(['activities'], (oldData: Activity[] | undefined) => {
        return oldData ? [...oldData, newActivity] : [newActivity];
      });
    },
  });
};


// Delete an activity
export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: async ({ operatorId }) => {
      await queryClient.invalidateQueries({ queryKey: ['activities'] });

      if (operatorId) {
        await queryClient.invalidateQueries({ queryKey: ['activities', operatorId] });
      }
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

