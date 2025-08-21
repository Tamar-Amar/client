import { styled } from '@mui/material/styles';
import { Table, Card, CardContent, Stack, Typography, Box, Button, TextField, FormControl, Chip, IconButton, TableRow, TableCell } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const StyledTable = styled(Table)(({ theme }) => ({
  tableLayout: 'fixed',
  '& thead th': {
    padding: '4px 8px',
    width: 120,
    backgroundColor: theme.palette.grey[100],
    fontWeight: 'bold',
  },
  '& tbody td': {
    padding: '1px 8px',
    width: 120,
  },
}));

interface StatCardProps {
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export const StatCard = styled(Card)<StatCardProps>(({ theme, color }) => {
  const getColorConfig = () => {
    switch (color) {
      case 'primary':
        return {
          bg: alpha('#2196f3', 0.1),
          text: theme.palette.primary.dark
        };
      case 'success':
        return {
          bg: alpha('#4caf50', 0.1),
          text: theme.palette.success.dark
        };
      case 'warning':
        return {
          bg: alpha('#ff9800', 0.1),
          text: theme.palette.warning.dark
        };
      case 'error':
        return {
          bg: alpha('#f44336', 0.1),
          text: theme.palette.error.dark
        };
      default:
        return {
          bg: theme.palette.grey[100],
          text: theme.palette.text.primary
        };
    }
  };

  const colors = getColorConfig();
  
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  };
});

export const DownloadCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#f3e5f5',
  color: '#6a1b9a',
  cursor: 'pointer',
  border: '2px solid',
  borderColor: '#9c27b0',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: '#e1bee7',
    transform: 'scale(1.02)',
  },
}));

export const DownloadCardContent = styled(CardContent)({
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 16,
  paddingRight: 16,
  textAlign: 'center',
});

export const SmallTypography = styled(Typography)({
  fontSize: '0.75rem',
  margin: 0,
});

export const TableContainerBox = styled(Box)({
  minHeight: 500,
});

export const FilterStack = styled(Stack)({
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
});

export const CompactTextField = styled(TextField)({
  '& .MuiInputBase-root': {
    height: '36px',
    fontSize: '0.875rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
  },
  minWidth: '120px',
  maxWidth: '200px',
});

export const CompactFormControl = styled(FormControl)({
  '& .MuiInputBase-root': {
    height: '36px',
    fontSize: '0.875rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
  },
  minWidth: '140px',
  maxWidth: '200px',
});

export const CompactButton = styled(Button)({
  height: '36px',
  fontSize: '0.875rem',
  padding: '6px 12px',
  minWidth: 'auto',
});

export const StyledButton = styled(Button)({
  minWidth: 36,
  padding: '2px 8px',
});

// New filter components
export const FilterChip = styled(Chip)(({ theme }) => ({
  height: '28px',
  fontSize: '0.75rem',
  '& .MuiChip-label': {
    padding: '0 8px',
  },
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.dark,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
  },
}));

export const ActiveFiltersContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  alignItems: 'center',
  padding: '8px 12px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
  marginBottom: '12px',
  minHeight: '44px',
});

export const FilterSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '16px',
});

export const FilterRow = styled(Stack)({
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'center',
});

export const FilterLabel = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#666',
  minWidth: '80px',
});

export const FilterDropdown = styled(FormControl)({
  minWidth: '160px',
  maxWidth: '200px',
  '& .MuiInputBase-root': {
    height: '32px',
    fontSize: '0.8rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.8rem',
  },
});

export const FilterAutocomplete = styled(TextField)({
  minWidth: '180px',
  maxWidth: '220px',
  '& .MuiInputBase-root': {
    height: '32px',
    fontSize: '0.8rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.8rem',
  },
});

// New action buttons row
export const ActionButtonsRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  padding: '8px 0',
});

export const ActionButton = styled(Button)({
  height: '40px',
  fontSize: '0.875rem',
  padding: '8px 16px',
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 500,
});

export const FilterDialogContent = styled(Box)({
  padding: '16px',
  minWidth: '500px',
});

export const FilterDialogRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
  '&:last-child': {
    marginBottom: 0,
  },
});

export const FilterDialogLabel = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#333',
  minWidth: '100px',
  flexShrink: 0,
});

export const FilterDialogField = styled(Box)({
  flex: 1,
});

// Status typography styles
export const StatusApprovedTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.success.main,
  fontWeight: 'bold',
}));

export const StatusRejectedTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  fontWeight: 'bold',
}));

// Main container
export const MainContainer = styled(Box)({
  padding: '8px',
});

// Filter card
export const FilterCard = styled(Card)({
  marginBottom: '24px',
  padding: '16px',
});

// Filter header
export const FilterHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '16px',
});

export const FilterTitle = styled(Typography)({
  fontWeight: 600,
  color: '#333',
});

export const FilterDivider = styled(Typography)({
  margin: '0 16px',
  color: '#666',
});

// Icon styles
export const FilterIcon = styled('span')(({ theme }) => ({
  marginRight: '8px',
  color: theme.palette.text.secondary,
  fontSize: '20px',
}));

export const UploadIcon = styled('span')({
  marginRight: '4px',
});

// Table styles
export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '& th': {
    backgroundColor: theme.palette.grey[100],
    fontWeight: 'bold',
  },
}));

export const EmptyTableCell = styled(TableCell)({
  paddingTop: '40px',
  paddingBottom: '40px',
});

// Upload button styles
export const UploadButton = styled(IconButton)({
  fontSize: '13px',
});

// Italic text
export const ItalicTypography = styled(Typography)({
  fontStyle: 'italic',
});

// Card content styles
export const CenteredCardContent = styled(CardContent)({
  paddingTop: '16px',
  paddingBottom: '16px',
  paddingLeft: '16px',
  paddingRight: '16px',
  textAlign: 'center',
});

export const BoldTypography = styled(Typography)({
  fontWeight: 'bold',
});

// Clickable text
export const ClickableText = styled(Typography)({
  cursor: 'pointer',
  textDecoration: 'underline',
  '&:hover': {
    color: 'rgb(19, 108, 196)',
  },
});

// New compact filter tab components
export const FilterTabCard = styled(Card)({
  marginBottom: '16px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  overflow: 'hidden',
});

export const FilterTabHeader = styled(Box)({
  backgroundColor: '#f8f9fa',
  borderBottom: '1px solid #e9ecef',
  padding: '12px 16px',
});

export const FilterTabContent = styled(Box)({
  padding: '16px',
});

export const CompactFilterField = styled(Box)({
  marginBottom: '12px',
  '&:last-child': {
    marginBottom: 0,
  },
});

export const CompactFilterLabel = styled(Typography)({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#666',
  marginBottom: '4px',
  textAlign: 'right',
});

export const CompactFilterInput = styled(TextField)({
  '& .MuiInputBase-root': {
    height: '32px',
    fontSize: '0.8rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.8rem',
  },
  width: '100%',
});

export const CompactFilterSelect = styled(FormControl)({
  '& .MuiInputBase-root': {
    height: '32px',
    fontSize: '0.8rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.8rem',
  },
  width: '100%',
});

export const CompactFilterAutocomplete = styled(Box)({
  '& .MuiInputBase-root': {
    height: '32px',
    fontSize: '0.8rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.8rem',
  },
  width: '100%',
});

export const FilterTabActions = styled(Box)({
  display: 'flex',
  gap: '8px',
  marginTop: '16px',
  paddingTop: '12px',
  borderTop: '1px solid #e9ecef',
});

export const CompactActionButton = styled(Button)({
  height: '32px',
  fontSize: '0.75rem',
  padding: '4px 12px',
  textTransform: 'none',
  flex: 1,
}); 