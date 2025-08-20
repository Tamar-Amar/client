import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Warning as ExpiredIcon,
  Description as DocumentIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';

interface DocumentStatsProps {
  stats: {
    total: {
      totalDocuments: number;
      totalSize: number;
      avgSize: number;
    };
    byType: Array<{
      _id: string;
      count: number;
      totalSize: number;
    }>;
    byStatus: Array<{
      _id: string;
      count: number;
    }>;
    byMonth: Array<{
      _id: {
        year: number;
        month: number;
      };
      count: number;
    }>;
  };
}

const DocumentStats: React.FC<DocumentStatsProps> = ({ stats }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'מאושר':
        return <ApprovedIcon color="success" />;
      case 'נדחה':
        return <RejectedIcon color="error" />;
      case 'ממתין':
        return <PendingIcon color="warning" />;
      case 'פג תוקף':
        return <ExpiredIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'מאושר':
        return 'success';
      case 'נדחה':
        return 'error';
      case 'ממתין':
        return 'warning';
      case 'פג תוקף':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return months[month - 1];
  };

  const totalDocuments = stats.total.totalDocuments;
  const totalSize = stats.total.totalSize;

  return (
    <Box>
      {/* סטטיסטיקות כלליות */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <DocumentIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    סך הכל מסמכים
                  </Typography>
                  <Typography variant="h4">
                    {totalDocuments.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <StorageIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    גודל כולל
                  </Typography>
                  <Typography variant="h4">
                    {formatFileSize(totalSize)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <DocumentIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    גודל ממוצע למסמך
                  </Typography>
                  <Typography variant="h4">
                    {formatFileSize(stats.total.avgSize)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* סטטיסטיקות לפי סטטוס */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                סטטיסטיקות לפי סטטוס
              </Typography>
              <Stack spacing={2}>
                {stats.byStatus.map((statusStat) => {
                  const percentage = totalDocuments > 0 ? (statusStat.count / totalDocuments) * 100 : 0;
                  return (
                    <Box key={statusStat._id}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {getStatusIcon(statusStat._id)}
                          <Typography variant="body2">
                            {statusStat._id}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="textSecondary">
                          {statusStat.count} ({percentage.toFixed(1)}%)
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        color={getStatusColor(statusStat._id) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* סטטיסטיקות לפי סוג מסמך */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                סטטיסטיקות לפי סוג מסמך
              </Typography>
              <Stack spacing={2}>
                {stats.byType.slice(0, 10).map((typeStat) => {
                  const percentage = totalDocuments > 0 ? (typeStat.count / totalDocuments) * 100 : 0;
                  return (
                    <Box key={typeStat._id}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                          {typeStat._id}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" color="textSecondary">
                            {typeStat.count}
                          </Typography>
                          <Chip
                            label={`${percentage.toFixed(1)}%`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* סטטיסטיקות לפי חודש */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                מסמכים שהועלו בחודשים האחרונים
              </Typography>
              <Grid container spacing={2}>
                {stats.byMonth.map((monthStat) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={`${monthStat._id.year}-${monthStat._id.month}`}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="primary">
                          {monthStat.count}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {getMonthName(monthStat._id.month)} {monthStat._id.year}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentStats;
