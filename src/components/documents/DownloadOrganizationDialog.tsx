import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Box,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface DocumentSummary {
  total: number;
  byType: { [key: string]: number };
  byWorker: { [key: string]: number };
}

interface DownloadOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  documentSummary: DocumentSummary;
  onDownload: (organizationType: 'byType' | 'byWorker', fileNameFormat: 'simple' | 'detailed') => void;
  isDownloading: boolean;
}

const DownloadOrganizationDialog: React.FC<DownloadOrganizationDialogProps> = ({
  open,
  onClose,
  documentSummary,
  onDownload,
  isDownloading,
}) => {
  const [organizationType, setOrganizationType] = useState<'byType' | 'byWorker'>('byType');
  const [fileNameFormat, setFileNameFormat] = useState<'simple' | 'detailed'>('simple');

  const handleDownload = () => {
    onDownload(organizationType, fileNameFormat);
  };

  const getOrganizationDescription = () => {
    if (organizationType === 'byType') {
      return 'הקבצים יאורגנו בתיקיות לפי סוג מסמך';
    } else {
      return 'הקבצים יאורגנו בתיקיות לפי עובד (כל עובד תיקיה משלו)';
    }
  };

  const getFileNameDescription = () => {
    if (fileNameFormat === 'simple') {
      return 'שם_משפחה_שם_פרטי_סוג_מסמך.pdf';
    } else {
      return 'תז_שם_משפחה_שם_פרטי_סוג_מסמך_תאריך.pdf';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <DownloadIcon color="primary" />
          <Typography variant="h6">בחירת ארגון הקבצים</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>

          <Box>
            <Typography variant="h6" gutterBottom>
              סיכום המסמכים שנמצאו
            </Typography>
            <Typography variant="body1" color="primary" sx={{ mb: 2 }}>
              סה"כ {documentSummary.total} מסמכים
            </Typography>


            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                לפי סוג מסמך:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Object.entries(documentSummary.byType).map(([type, count]) => (
                  <Chip
                    key={type}
                    label={`${type}: ${count}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Stack>
            </Box>


            <Box>
              <Typography variant="subtitle1" gutterBottom>
                לפי עובד:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Object.entries(documentSummary.byWorker).slice(0, 10).map(([worker, count]) => (
                  <Chip
                    key={worker}
                    label={`${worker}: ${count}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {Object.keys(documentSummary.byWorker).length > 10 && (
                  <Chip
                    label={`+${Object.keys(documentSummary.byWorker).length - 10} עובדים נוספים`}
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                )}
              </Stack>
            </Box>
          </Box>

          <Divider />


          <Box>
            <Typography variant="h6" gutterBottom>
              ארגון תיקיות
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value as 'byType' | 'byWorker')}
              >
                <FormControlLabel
                  value="byType"
                  control={<Radio />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FolderIcon color="primary" />
                      <Box>
                        <Typography variant="body1">לפי סוג מסמך</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {getOrganizationDescription()}
                        </Typography>
                      </Box>
                    </Stack>
                  }
                />
                <FormControlLabel
                  value="byWorker"
                  control={<Radio />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonIcon color="primary" />
                      <Box>
                        <Typography variant="body1">לפי עובד</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {getOrganizationDescription()}
                        </Typography>
                      </Box>
                    </Stack>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Divider />


          <Box>
            <Typography variant="h6" gutterBottom>
              פורמט שם קובץ
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={fileNameFormat}
                onChange={(e) => setFileNameFormat(e.target.value as 'simple' | 'detailed')}
              >
                <FormControlLabel
                  value="simple"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">פשוט</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {getFileNameDescription()}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="detailed"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">מפורט</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {getFileNameDescription()}
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>דוגמה:</strong> {getFileNameDescription()}
              <br />
              <strong>ארגון:</strong> {getOrganizationDescription()}
              <br />
              <strong>הערה:</strong> עבור מסמכי נוכחות פרויקט, הארגון יהיה לפי כיתה או סוג נוכחות
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isDownloading}>
          ביטול
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          startIcon={isDownloading ? null : <DownloadIcon />}
          disabled={isDownloading}
        >
          {isDownloading ? 'מוריד...' : 'הורד ZIP'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadOrganizationDialog;
