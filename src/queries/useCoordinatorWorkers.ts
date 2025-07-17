import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCallback, useMemo } from 'react';
import { WorkerWithClassInfo } from '../types';
import { Document, DocumentStatus, DocumentType } from '../types/Document';

export function useCoordinatorWorkers(coordinatorId: string) {
  const queryClient = useQueryClient();

  // עובדים
  const {
    data: workers = [],
    isLoading: workersLoading,
    error: workersError,
    refetch: refetchWorkers
  } = useQuery<WorkerWithClassInfo[]>({
    queryKey: ['coordinator-workers', coordinatorId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/worker-after-noon/coordinator/${coordinatorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!coordinatorId
  });

  // מסמכים
  const {
    data: allWorkerDocuments = [],
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments
  } = useQuery<Document[]>({
    queryKey: ['coordinator-worker-documents', coordinatorId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/documents/coordinator/${coordinatorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!coordinatorId
  });

  // סטטיסטיקות מסמכים
  const documentsSummary = useMemo(() => {
    let totalUploaded = 0;
    let totalApproved = 0;
    let totalPending = 0;
    let totalRejected = 0;
    (allWorkerDocuments as Document[]).forEach((doc: Document) => {
      totalUploaded++;
      switch (doc.status) {
        case DocumentStatus.APPROVED:
          totalApproved++;
          break;
        case DocumentStatus.PENDING:
          totalPending++;
          break;
        case DocumentStatus.REJECTED:
          totalRejected++;
          break;
        default:
          totalPending++;
          break;
      }
    });
    return { totalUploaded, totalApproved, totalPending, totalRejected };
  }, [allWorkerDocuments]);

  // רענון כללי
  const refetchAll = useCallback(() => {
    refetchWorkers();
    refetchDocuments();
  }, [refetchWorkers, refetchDocuments]);

  return {
    workers,
    workersLoading,
    workersError,
    allWorkerDocuments,
    documentsLoading,
    documentsError,
    documentsSummary,
    refetchWorkers,
    refetchDocuments,
    refetchAll
  };
} 