import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import axios from 'axios';

interface Props {
  operatorId: string;
  onVerified: () => void;
}

const OperatorVerificationDialog: React.FC<Props> = ({ operatorId, onVerified }) => {
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'sending' | 'input' | 'error'>('initial');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const sendCode = async () => {
    try {
      setLoading(true);
      setStep('sending');
      const res = await axios.post(`${API_URL}/api/email/send-code/${operatorId}`);
      setMaskedEmail(res.data.maskedEmail);
      setStep('input');
    } catch (err) {
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/email/verify-code`, {
        operatorId,
        code,
      });
      if (res.data.valid) {
        onVerified();
      } else {
        alert('הקוד שהוזן אינו נכון. אנא נסי שוב.');
      }
    } catch {
      alert('אירעה שגיאה באימות הקוד. נסי שוב מאוחר יותר.');
    }
  };

  return (
    <Dialog open fullWidth maxWidth="xs">
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        אימות זהות מפעיל
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'left', py: 3 }}>
        {loading ? (
          <CircularProgress />
        ) : step === 'initial' ? (
          <Typography variant="body1">
            על מנת לדווח פעילות, יישלח אליכם קוד אימות לכתובת המייל השמורה במערכת לצורך זיהוי.
            <br />
            יש ללחוץ על <strong>"שלח קוד אימות"</strong> כדי לקבל את הקוד.
          </Typography>
        ) : step === 'error' ? (
          <Typography variant="body1" color="error">
            אירעה שגיאה בשליחת הקוד. אנא נסו שוב מאוחר יותר.
          </Typography>
        ) : (
          <>
            <Typography sx={{ mb: 2 }}>
              שלחנו קוד אימות לכתובת: <b>{maskedEmail}</b>
              <br />
              אנא הזינו את הקוד שקיבלתם:
            </Typography>

            <TextField
              label="קוד אימות"
              variant="outlined"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              sx={{ mb: 1 }}
            />
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        {step === 'initial' && (
          <Button variant="contained" color="primary" onClick={sendCode}>
            שלח קוד אימות
          </Button>
        )}
        {step === 'input' && (
          <Button variant="contained" color="success" onClick={handleVerify} disabled={!code}>
            אשר
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OperatorVerificationDialog;
