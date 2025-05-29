import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Symbol {
  _id: string;
  name: string;
  description?: string;
}

export const useWorkerSymbols = (workerId: string) => {
  return useQuery<Symbol[]>({
    queryKey: ['workerSymbols', workerId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/workers/${workerId}/symbols`);
      return data;
    },
  });
}; 