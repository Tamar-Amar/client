import { useState } from 'react';
import axios from 'axios';
import React from 'react';
import { Button, Typography } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL as string;

interface Props {
  onSuccess?: () => void;
}


const ExportToSheetsButton: React.FC<Props> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/api/activities/export-to-sheets`);
      setMessage(res.data.message);
      if (onSuccess) onSuccess();
    } catch (err) {
      setMessage('שגיאה בשליחה לגיליון');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <Button
        variant="outlined"
        sx={{
            color: 'black',
            borderColor: 'black',
            '&:hover': {
            borderColor: 'black',
            backgroundColor: '#f5f5f5',
            },
        }}
        onClick={handleExport}
        disabled={loading}
        >
        {loading ? 'שולח דוח...' : 'שלח דוח ל־Google Sheets'}
        </Button>

      {message && (
        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}
    </>
  );
};

export default ExportToSheetsButton;
