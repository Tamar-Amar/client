import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Box,
  Divider,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import {
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useDownloadMultipleDocuments, useDocumentTypes } from '../../queries/useDocuments';
import { DocumentStatus } from '../../types/Document';

interface BulkDownloadDialogProps {
  open: boolean;
  onClose: () => void;
  selectedDocumentIds?: string[];
}

const BulkDownloadDialog: React.FC<BulkDownloadDialogProps> = ({
  open,
  onClose,
  selectedDocumentIds = [],
}) => {
  const [filters, setFilters] = useState({
    documentType: '',
    status: '',
    workerId: '',
    project: '',
    dateFrom: '',
    dateTo: '',
  });

  const [downloadMode, setDownloadMode] = useState<'selected' | 'filtered'>(
    selectedDocumentIds.length > 0 ? 'selected' : 'filtered'
  );

  const { data: documentTypes } = useDocumentTypes();
  const downloadMutation = useDownloadMultipleDocuments();

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = () => {
    if (downloadMode === 'selected' && selectedDocumentIds.length === 0) {
      return;
    }

    const downloadData = downloadMode === 'selected' 
      ? { documentIds: selectedDocumentIds }
      : filters;

    downloadMutation.mutate(downloadData, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        console.error('שגיאה בהורדת המסמכים:', error);
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      documentType: '',
      status: '',
      workerId: '',
      project: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const hasFilters = Object.values(filters).some(value => value !== '');

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <DownloadIcon color="primary" />
            <Typography variant="h6">הורדת מסמכים מרובה</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* בחירת מצב הורדה */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                בחר מצב הורדה:
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant={downloadMode === 'selected' ? 'contained' : 'outlined'}
                  onClick={() => setDownloadMode('selected')}
                  disabled={selectedDocumentIds.length === 0}
                >
                  הורד נבחרים ({selectedDocumentIds.length})
                </Button>
                <Button
                  variant={downloadMode === 'filtered' ? 'contained' : 'outlined'}
                  onClick={() => setDownloadMode('filtered')}
                >
                  הורד לפי פילטרים
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* פילטרים */}
            {downloadMode === 'filtered' && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <FilterIcon color="primary" />
                  <Typography variant="subtitle1">פילטרים להורדה</Typography>
                  {hasActiveFilters && (
                    <Button
                      startIcon={<ClearIcon />}
                      onClick={clearFilters}
                      size="small"
                      variant="outlined"
                    >
                      נקה פילטרים
                    </Button>
                  )}
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>סוג מסמך</InputLabel>
                      <Select
                        value={filters.documentType}
                        onChange={(e) => handleFilterChange('documentType', e.target.value)}
                      >
                        <MenuItem value="">הכל</MenuItem>
                        <MenuItem value="תעודת זהות">תעודת זהות</MenuItem>
                        <MenuItem value="אישור משטרה">אישור משטרה</MenuItem>
                        <MenuItem value="חוזה">חוזה</MenuItem>
                        <MenuItem value="תעודת השכלה">תעודת השכלה</MenuItem>
                        <MenuItem value="אישור וותק">אישור וותק</MenuItem>
                        <MenuItem value="נוכחות קייטנה רכז">נוכחות קייטנה רכז</MenuItem>
                        <MenuItem value="אישור רפואי">אישור רפואי</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>סטטוס</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <MenuItem value="">הכל</MenuItem>
                        {Object.values(DocumentStatus).map((status) => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="מזהה עובד"
                      value={filters.workerId}
                      onChange={(e) => handleFilterChange('workerId', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>פרויקט</InputLabel>
                      <Select
                        value={filters.project}
                        onChange={(e) => handleFilterChange('project', e.target.value)}
                      >
                        <MenuItem value="">הכל</MenuItem>
                        <MenuItem value="1">צהרון שוטף 2025</MenuItem>
                        <MenuItem value="2">קייטנת חנוכה 2025</MenuItem>
                        <MenuItem value="3">קייטנת פסח 2025</MenuItem>
                        <MenuItem value="4">קייטנת קיץ 2025</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="מתאריך"
                      value={filters.dateFrom ? new Date(filters.dateFrom) : null}
                      onChange={(date) => handleFilterChange('dateFrom', date?.toISOString())}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="עד תאריך"
                      value={filters.dateTo ? new Date(filters.dateTo) : null}
                      onChange={(date) => handleFilterChange('dateTo', date?.toISOString())}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                </Grid>

                {/* תצוגת פילטרים פעילים */}
                {hasActiveFilters && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      פילטרים פעילים:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {Object.entries(filters).map(([key, value]) => {
                        if (value) {
                          const getFilterLabel = (key: string, value: string) => {
                            switch (key) {
                              case 'documentType':
                                return `סוג מסמך: ${value}`;
                              case 'status':
                                return `סטטוס: ${value}`;
                              case 'workerId':
                                return `מזהה עובד: ${value}`;
                              case 'project':
                                const projectNames: { [key: string]: string } = {
                                  '1': 'צהרון שוטף 2025',
                                  '2': 'קייטנת חנוכה 2025',
                                  '3': 'קייטנת פסח 2025',
                                  '4': 'קייטנת קיץ 2025'
                                };
                                return `פרויקט: ${projectNames[value] || value}`;
                              case 'dateFrom':
                                return `מתאריך: ${new Date(value).toLocaleDateString('he-IL')}`;
                              case 'dateTo':
                                return `עד תאריך: ${new Date(value).toLocaleDateString('he-IL')}`;
                              default:
                                return `${key}: ${value}`;
                            }
                          };
                          
                          return (
                            <Chip
                              key={key}
                              label={getFilterLabel(key, value)}
                              size="small"
                              variant="outlined"
                              onDelete={() => handleFilterChange(key, '')}
                            />
                          );
                        }
                        return null;
                      })}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}

            {/* הודעות */}
            {downloadMode === 'selected' && selectedDocumentIds.length === 0 && (
              <Alert severity="warning">
                לא נבחרו מסמכים להורדה
              </Alert>
            )}

            {downloadMode === 'filtered' && !hasActiveFilters && (
              <Alert severity="info">
                לא נבחרו פילטרים - יורדו כל המסמכים כקובץ ZIP
              </Alert>
            )}

            <Alert severity="info">
              המסמכים יורדים כקובץ ZIP עם שמות מאורגנים:
              <br />• <strong>מסמכים אישיים:</strong> תז_שם_מלא_סוג_מסמך_שם_קובץ
              <br />• <strong>נוכחות קייטנה:</strong> תז_שם_מלא_נוכחות_קייטנה_תאריך_שם_קובץ
              <br />• <strong>מסמכים אחרים:</strong> תז_שם_מלא_סוג_מסמך_תאריך_שם_קובץ
              <br /><br /><strong>הערה:</strong> התהליך יכול לקחת מספר שניות בהתאם לכמות המסמכים
              <br />המערכת תחפש את פרטי העובדים לפי מזהה המסמך
            </Alert>

            {downloadMutation.isError && (
              <Alert severity="error">
                שגיאה בהורדת המסמכים
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={downloadMutation.isPending}>
            ביטול
          </Button>
          <Button
            onClick={handleDownload}
            variant="contained"
            startIcon={downloadMutation.isPending ? <CircularProgress size={20} /> : <DownloadIcon />}
            disabled={
              downloadMutation.isPending ||
              (downloadMode === 'selected' && selectedDocumentIds.length === 0)
            }
          >
            {downloadMutation.isPending ? 'מוריד...' : 'הורד'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default BulkDownloadDialog;
