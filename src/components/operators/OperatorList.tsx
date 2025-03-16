import React, { useState, useMemo } from 'react';
import { 
  Typography, 
  Card, 
  CardContent, 
  IconButton, 
  Collapse, 
  Grid, 
  Divider, 
  Button, 
  TextField 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useDeleteOperator, useFetchOperators } from '../../queries/operatorQueries';

const OperatorList: React.FC = () => {
  const { data: operators, isLoading, isError } = useFetchOperators();
  const deleteMutation = useDeleteOperator();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 משתנה לחיפוש
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this operator?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const sortedOperators = useMemo(() => {
    if (!operators) return [];
    return [...operators].sort((a, b) => a.lastName.localeCompare(b.lastName, 'he'));
  }, [operators]);

  // 🔍 סינון רשימת המפעילים לפי החיפוש
  const filteredOperators = useMemo(() => {
    return sortedOperators.filter((operator: any) =>
      `${operator.firstName} ${operator.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedOperators, searchTerm]);

  const totalPages = Math.ceil(filteredOperators.length / pageSize);

  const currentOperators = useMemo(() => {
    return filteredOperators.slice(page * pageSize, (page + 1) * pageSize);
  }, [filteredOperators, page]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading operators.</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto', minHeight: 937 }}>
      <Typography variant="h4" gutterBottom textAlign="center" color="primary">
        רשימת מפעילים
      </Typography>

      {/* 🔍 שדה חיפוש */}
      <TextField
        label="חפש מפעיל"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {currentOperators.map((operator: any) => (
        <Card key={operator._id} sx={{ mb: 2, boxShadow: 3, borderRadius: 2 }}>
          <Grid container alignItems="center">
            <Grid 
              item 
              xs={2} 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 1, 
                padding: '15px',
                backgroundColor: '#f4f4f4', 
                borderTopLeftRadius: '10px',
                borderBottomLeftRadius: '10px'
              }}
            >
              <IconButton color="error" onClick={() => handleDelete(operator._id)}>
                <DeleteIcon />
              </IconButton>
              <IconButton color="primary" onClick={() => navigate(`/operators/${operator._id}`)}>
                <VisibilityIcon />
              </IconButton>
            </Grid>

            <Grid 
              item 
              xs={10} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '15px',
                backgroundColor: '#ffffff',
                borderTopRightRadius: '10px',
                borderBottomRightRadius: '10px'
              }}
            >
              <Typography variant="h6">
                {operator.lastName} {operator.firstName}
              </Typography>
              <IconButton onClick={() => toggleExpand(operator._id)}>
                {expandedId === operator._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Grid>
          </Grid>

          <Collapse in={expandedId === operator._id} timeout="auto" unmountOnExit>
            <Divider />
            <CardContent sx={{ backgroundColor: '#fafafa' }}>
              <Typography variant="body2">ת"ז: {operator.id}</Typography>
              <Typography variant="body2">טלפון: {operator.phone}</Typography>
              <Typography variant="body2">כתובת: {operator.address}</Typography>
              <Typography variant="body2">אימייל: {operator.email}</Typography>
              <Typography variant="body2">סטטוס: {operator.status}</Typography>
              <Typography variant="body2">תיאור: {operator.description}</Typography>
            </CardContent>
          </Collapse>
        </Card>
      ))}

      {/* ניווט בין דפים */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '20px' }}>
        <Button 
          variant="contained" 
          onClick={() => setPage(prev => prev - 1)} 
          disabled={page === 0}
        >
          הקודם
        </Button>
        <Typography variant="body1" sx={{ alignSelf: 'center' }}>
          עמוד {page + 1} מתוך {totalPages}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setPage(prev => prev + 1)} 
          disabled={page >= totalPages - 1}
        >
          הבא
        </Button>
      </div>
    </div>
  );
};

export default OperatorList;
