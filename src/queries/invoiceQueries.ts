import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInvoices,
  fetchInvoicesByStore,
  createInvoice,
  updateInvoice,
} from '../services/InvoiceService';
import { Invoice } from '../types/index';

// Fetch all invoices
export const useFetchAllInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch invoices by store
export const useFetchInvoicesByStore = (storeId: string) => {
  return useQuery({
    queryKey: ['invoices', storeId],
    queryFn: () => fetchInvoicesByStore(storeId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Add a new invoice
export const useAddInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

// Update invoice status
export const useUpdateInvoiceStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: updateInvoice,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      },
    });
  };
  