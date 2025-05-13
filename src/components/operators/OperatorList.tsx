import React, { useState, useMemo } from 'react';
import { Typography, Paper, IconButton, Grid, Button, TextField, InputAdornment, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';
import { useDeleteOperator, useFetchOperators } from '../../queries/operatorQueries';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const OperatorList: React.FC = () => {
  const { data: operators, isLoading, isError } = useFetchOperators();
  const deleteMutation = useDeleteOperator();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const handleDelete = (id: string) => {
    if (window.confirm('האם את/ה בטוח/ה שברצונך למחוק מפעיל זה?')) {
      deleteMutation.mutate(id);
    }
  };

  const sortedOperators = useMemo(() => {
    if (!operators) return [];
    return [...operators].sort((a, b) => a.lastName.localeCompare(b.lastName, 'he'));
  }, [operators]);

  const filteredOperators = useMemo(() => {
    return sortedOperators.filter((operator: any) =>
      `${operator.firstName} ${operator.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedOperators, searchTerm]);

  const totalPages = Math.ceil(filteredOperators.length / pageSize);
  const currentOperators = useMemo(() => filteredOperators.slice(page * pageSize, (page + 1) * pageSize), [filteredOperators, page]);

  if (isLoading) return <Typography>טוען...</Typography>;
  if (isError) return <Typography color="error">שגיאה בטעינת מפעילים.</Typography>;

  return (
    <>
      <TextField
        variant="outlined"
        placeholder="חפש מפעיל"
        fullWidth
        sx={{ mb: 3, backgroundColor: '#f9f9f9', borderRadius: 2 }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {currentOperators.map((operator: any) => (
        <Paper
          key={operator._id}
          elevation={3}
          sx={{
            mb: 2,
            borderRadius: 3,
            overflow: 'hidden',
            transition: '0.3s',
            '&:hover': { boxShadow: 6 }
          }}
        >
          <Grid container alignItems="center" sx={{ p: 1 }}>
            <Grid item xs="auto" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pl: 1 }}>
              <AccountCircleIcon fontSize="large" color="primary" />
            </Grid>

            <Grid item xs sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
              <Typography variant="h6">{operator.lastName} {operator.firstName}</Typography>
            </Grid>

            <Grid item xs="auto" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="error" onClick={() => handleDelete(operator._id)}>
                <DeleteIcon />
              </IconButton>
              <IconButton color="primary" onClick={() => navigate(`/operators/${operator._id}`)}>
                <ArrowBackIosNewIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      ))}

      {filteredOperators.length > pageSize && (
        <Box display="flex" justifyContent="center" mt={4} gap={2}>
          <Button variant="outlined" onClick={() => setPage(prev => prev - 1)} disabled={page === 0}>הקודם</Button>
          <Typography variant="body1" alignSelf="center">עמוד {page + 1} מתוך {totalPages}</Typography>
          <Button variant="outlined" onClick={() => setPage(prev => prev + 1)} disabled={page >= totalPages - 1}>הבא</Button>
        </Box>
      )}
    </>
  );
};

export default OperatorList;
