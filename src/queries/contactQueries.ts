import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContacts, createContact, updateContact, deleteContact } from '../services/ContactService';
import { Contact } from '../types/index';

// 📌 הבאת כל אנשי הקשר
export const useFetchContacts = () => {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 1000 * 60 * 5,
  });
};

// 📌 הוספת איש קשר
export const useAddContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

// 📌 עדכון איש קשר
export const useUpdateContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, updatedData }: { id: string; updatedData: Partial<Contact> }) => {
        return updateContact(id, updatedData);
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      },
    });
  };

// 📌 מחיקת איש קשר
export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};
