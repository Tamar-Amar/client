import { Dayjs } from 'dayjs';

declare module '@mui/x-date-pickers/TimeField' {
  interface TimeFieldProps {
    value?: Dayjs | null;
    onChange?: (value: Dayjs | null) => void;
  }
} 