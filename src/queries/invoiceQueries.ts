import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInvoices,
  fetchInvoicesByStore,
  createInvoice,
  updateInvoice,
} from '../services/InvoiceService';


export const useFetchAllInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
    staleTime: 1000 * 60 * 5, 
  });
};


export const useFetchInvoicesByStore = (storeId: string) => {
  return useQuery({
    queryKey: ['invoices', storeId],
    queryFn: () => fetchInvoicesByStore(storeId),
    staleTime: 1000 * 60 * 5, 
  });
};


export const useAddInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};


export const useUpdateInvoiceStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: updateInvoice,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      },
    });
  };
  