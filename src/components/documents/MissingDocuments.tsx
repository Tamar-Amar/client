import React from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { useFetchWorkers } from '../../queries/workerQueries';
import { useFetchAllDocuments } from '../../queries/useDocuments';
import { Worker } from '../../types';
import { Document, DocumentType } from '../../types/Document';
const requiredDocuments = [
  'תעודת זהות',
  'אישור העסקה',
  'הסכם עבודה',
  'אישור בריאות',
];

const MissingDocuments: React.FC = () => {
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchWorkers();
  const { data: allDocuments = [], isLoading: isLoadingDocuments } = useFetchAllDocuments();

  if (isLoadingWorkers || isLoadingDocuments) {
    return <Typography>טוען...</Typography>;
  }

  const workersWithMissingDocs = workers.map((worker: Worker) => {
    const workerDocuments = allDocuments.filter((doc: Document) => doc.operatorId === worker._id);
    const existingDocTypes = new Set(workerDocuments.map((doc: Document) => doc.tag));
    const missingDocs = requiredDocuments.filter(docType => !existingDocTypes.has(docType));

    return {
      worker,
      missingDocs,
    };
  }).filter(item => item.missingDocs.length > 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        עובדים עם מסמכים חסרים
      </Typography>
      <List>
        {workersWithMissingDocs.map(({ worker, missingDocs }) => (
          <ListItem key={worker._id} sx={{ px: 0 }}>
            <Card variant="outlined" sx={{ width: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {`${worker.firstName} ${worker.lastName}`}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {missingDocs.map((docType) => (
                    <Chip
                      key={docType}
                      label={docType}
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </ListItem>
        ))}
        {workersWithMissingDocs.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            אין עובדים עם מסמכים חסרים
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default MissingDocuments; 