import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  styled,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { useWorkerClasses } from '../../queries/classQueries';
import axios from 'axios';

interface Props {
  workerId: string;
}

interface WeeklySchedule {
  day: string;
  classes: string[];
}

interface Symbol {
  _id: string;
  name: string;
  description?: string;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const DayBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
}));

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'] as const;
type Day = typeof days[number];

const WorkerSchedule: React.FC<Props> = ({ workerId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [schedule, setSchedule] = useState<WeeklySchedule[]>(
    days.map(day => ({ day, classes: [] }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { data: classes = [], isLoading: isLoadingClasses } = useWorkerClasses(workerId);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data } = await axios.get(`/api/workers/${workerId}`);
        if (data.weeklySchedule) {
          setSchedule(data.weeklySchedule);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [workerId]);

  const handleSymbolChange = (day: string, value: string[]) => {
    setSchedule(prev => 
      prev.map(item => 
        item.day === day 
          ? { ...item, classes: value }
          : item
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.put(`/api/workers/${workerId}/schedule`, { schedule });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingClasses) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <StyledPaper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="primary">
          מערכת שעות שבועית
        </Typography>
        <IconButton 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          color="primary"
          disabled={isSaving}
        >
          {isEditing ? (
            isSaving ? <CircularProgress size={24} /> : <SaveIcon />
          ) : (
            <EditIcon />
          )}
        </IconButton>
      </Box>

      <Grid container spacing={2}>
        {schedule.map((daySchedule) => (
          <Grid item xs={12} key={daySchedule.day}>
            <DayBox>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ width: 80 }}>{daySchedule.day}</Typography>
                <FormControl fullWidth disabled={!isEditing || isSaving}>
                  <InputLabel id={`symbol-select-${daySchedule.day}`}>סמלים</InputLabel>
                  <Select
                    labelId={`symbol-select-${daySchedule.day}`}
                    multiple
                    value={daySchedule.classes}
                    onChange={(event: SelectChangeEvent<string[]>) => {
                      const value = event.target.value;
                      handleSymbolChange(daySchedule.day, typeof value === 'string' ? [value] : value);
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const symbol = classes.find((s: any) => s._id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={symbol ? symbol.name : value} 
                              size="small" 
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {classes.map((symbol: any) => (
                      <MenuItem key={symbol._id} value={symbol._id}>
                        {symbol.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </DayBox>
          </Grid>
        ))}
      </Grid>
    </StyledPaper>
  );
};

export default WorkerSchedule; 