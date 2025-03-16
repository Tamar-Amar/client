import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllActivities, createActivity, deleteActivity, fetchActivitiesByOperator } from '../services/ActivityService';
import { Activity } from '../types/index';

import { useState } from "react";
import { Snackbar, Alert } from "@mui/material";

export const useFetchActivities = () => {
  return useQuery({
    queryKey: ['activities'],
    queryFn: fetchAllActivities,
    staleTime: 1000 * 60 * 5, 
  });
};


export const useAddActivity = () => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation<Activity | null, any, Activity>({
    mutationFn: createActivity,
    onSuccess: async (newActivity) => {
      if (!newActivity) return;

      // בדיקה האם `classId` הוא אובייקט ולא `string`
      const classInfo =
        typeof newActivity.classId === "object" && "name" in newActivity.classId
          ? newActivity.classId
          : { name: "לא ידוע", uniqueSymbol: "לא ידוע" };

      // בדיקה האם `operatorId` הוא אובייקט ולא `string`
      const operatorInfo =
        typeof newActivity.operatorId === "object" && "firstName" in newActivity.operatorId
          ? newActivity.operatorId
          : { firstName: "לא ידוע", lastName: "" };

      setErrorMessage(
        `כבר קיימת פעילות בסמל ${classInfo.uniqueSymbol} (${classInfo.name}) על ידי ${operatorInfo.firstName} ${operatorInfo.lastName} בתאריך ${newActivity.date}`
      );

      return;
    },
    onError: () => {
      setErrorMessage("שגיאה בהוספת הפעילות. נסה שוב.");
    },
  });

  return { mutation, errorMessage, setErrorMessage };
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

