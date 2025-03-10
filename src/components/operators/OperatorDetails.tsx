import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, Typography, Box, Divider, Grid, Paper, Button, TextField, MenuItem } from '@mui/material';
import { useFetchOperatorById, useUpdateOperator } from '../../queries/operatorQueries';
import { useFetchClasses } from '../../queries/classQueries';

const OperatorDetails: React.FC = () => {
  const { id } = useParams();
  const { data: operator, isLoading, isError } = useFetchOperatorById(id!);
  const { data: classes = [] } = useFetchClasses();
  const updateOperatorMutation = useUpdateOperator();
  console.log("operator: " , operator)

  const [month, setMonth] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const handleAddClass = () => {
    if (!selectedClassId || !operator) return;

    const updatedClasses = [...(operator.regularClasses || []), selectedClassId];

    updateOperatorMutation.mutate(
      { id: operator._id as string, regularClasses: updatedClasses },
      {
        onSuccess: () => {
          setSelectedClassId(''); 
        },
      }
    );

    console.log()
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !operator) return <div>Operator not found.</div>;

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', mt: 4, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom textAlign="center" color="primary">
        פרטי מפעיל
      </Typography>
      
      <Grid container spacing={3}>
        {/* ✅ חלק ימין - פרטים כלליים */}
        <Grid item xs={6}>
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>פרטים כלליים</Typography>
              <Divider sx={{ mb: 2 }} />

              {/* ✅ מידע אישי */}
              <Paper sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>מידע אישי</Typography>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="body1"><strong>שם מלא:</strong> {operator.lastName} {operator.firstName}</Typography>
                <Typography variant="body1"><strong>ת"ז:</strong> {operator.id}</Typography>
                <Typography variant="body1"><strong>סטטוס:</strong> {operator.status}</Typography>
                <Typography variant="body1"><strong>תיאור:</strong> {operator.description}</Typography>
              </Paper>

              {/* ✅ פרטי התקשרות */}
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>פרטי התקשרות</Typography>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="body1"><strong>טלפון:</strong> {operator.phone}</Typography>
                <Typography variant="body1"><strong>אימייל:</strong> {operator.email}</Typography>
                <Typography variant="body1"><strong>כתובת:</strong> {operator.address}</Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* ✅ חלק שמאל - דוח הפעלות */}
        <Grid item xs={6}>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>דוח הפעלות</Typography>
            <Divider sx={{ mb: 2 }} />

            {/* ✅ בחירת חודש לדוח נוכחות */}
            <TextField
              label="בחר חודש"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              sx={{ marginBottom: 2, width: '100%' }}
            />
            <Button variant="contained" color="primary" fullWidth>
              צור דוח נוכחות
            </Button>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>הוספת כיתה להפעלה קבועה</Typography>
            <TextField
              select
              fullWidth
              label="בחר קבוצה"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              sx={{ marginBottom: 2 }}
            >
              <MenuItem value="">-- כל הקבוצות --</MenuItem>
                {classes.slice().sort((a: any, b: any) => a.uniqueSymbol.localeCompare(b.uniqueSymbol))
                  .map((cls:any) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name} ({cls.uniqueSymbol})
                    </MenuItem>
                  ))}

            </TextField>
            <Button 
              variant="contained" 
              color="secondary" 
              fullWidth 
              disabled={!selectedClassId} // ✅ הכפתור פעיל רק אם נבחרה כיתה
              onClick={handleAddClass}
            >
              הוסף כיתה קבועה
            </Button>

            <Divider sx={{ my: 3 }} />

            {/* ✅ רשימת כיתות קבועות */}
            <Typography variant="h6" sx={{ mb: 2 }}>כיתות קבועות</Typography>
            {(operator.regularClasses&&operator.regularClasses?.length > 0) ? (
              operator.regularClasses.map((cls: any) => (
                <Typography key={cls._id} variant="body2">
                  {cls.name} ({cls.uniqueSymbol})
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                אין כיתות קבועות למפעיל זה
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OperatorDetails;
