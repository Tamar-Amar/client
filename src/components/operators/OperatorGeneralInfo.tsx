import React from "react";
import { Card, CardContent, Typography, Paper, Divider, Grid } from "@mui/material";
import { PaymentMethodChoicesEnum } from "../../types"; // ייבוא ה-enum

const OperatorGeneralInfo: React.FC<{ operator: any }> = ({ operator }) => {
  const paymentMethodLabel =
    operator.paymentMethod === PaymentMethodChoicesEnum.TLUSH
      ? "תלוש"
      : operator.paymentMethod === PaymentMethodChoicesEnum.CHEABONIT
      ? "חשבונית"
      : "לא נבחר";

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={{ p: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>פרטים כלליים</Typography>
            <Divider sx={{ mb: 2 }} />

            <Paper sx={{ p: 2, backgroundColor: "#f9f9f9", borderRadius: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>מידע אישי</Typography>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="body1"><strong>שם מלא:</strong> {operator.lastName} {operator.firstName}</Typography>
              <Typography variant="body1"><strong>ת"ז:</strong> {operator.id}</Typography>
              <Typography variant="body1"><strong>סטטוס:</strong> {operator.status}</Typography>
              <Typography variant="body1"><strong>תיאור:</strong> {operator.description}</Typography>
              <Typography variant="body1"><strong>סוג תשלום:</strong> {paymentMethodLabel}</Typography>
            </Paper>

            <Paper sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>פרטי התקשרות</Typography>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="body1"><strong>טלפון:</strong> {operator.phone}</Typography>
              <Typography variant="body1"><strong>אימייל:</strong> {operator.email}</Typography>
              <Typography variant="body1"><strong>כתובת:</strong> {operator.address}</Typography>
            </Paper>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OperatorGeneralInfo;
