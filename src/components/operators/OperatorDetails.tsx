import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { useFetchOperatorById } from '../../queries/operatorQueries';

const OperatorDetails: React.FC = () => {
  const { id } = useParams();
  const { data: operator, isLoading, isError } = useFetchOperatorById(id!);

  if (isLoading) return <div>Loading...</div>;
  if (isError || !operator) return <div>Operator not found.</div>;

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom textAlign="center" color="primary">
        פרטי מפעיל
      </Typography>
      <Card sx={{ p: 2 }}>
        <CardContent>
          <Typography variant="h6">{operator.lastName} {operator.firstName}</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1"><strong>ת"ז:</strong> {operator.id}</Typography>
          <Typography variant="body1"><strong>טלפון:</strong> {operator.phone}</Typography>
          <Typography variant="body1"><strong>כתובת:</strong> {operator.address}</Typography>
          <Typography variant="body1"><strong>אימייל:</strong> {operator.email}</Typography>
          <Typography variant="body1"><strong>סטטוס:</strong> {operator.status}</Typography>
          <Typography variant="body1"><strong>תיאור:</strong> {operator.description}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OperatorDetails;
