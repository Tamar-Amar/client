import React, { useState } from "react";
import { useFormik } from "formik";
import { useFetchStores } from "../queries/storeQueries";
import { InvoiceSchema } from "../types/validations/InvoiceValidation";
import {
  TextField,
  Button,
  Box,
  MenuItem,
  Typography,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useAddInvoice } from "../queries/invoiceQueries";
import { useNavigate } from "react-router-dom";
import { InvoiceStatus, InvoiceType } from "../types/Invoice";

const InvoiceCreate: React.FC = () => {
  const { data: stores, isLoading, isError } = useFetchStores();
  const addInvoice = useAddInvoice();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      storeId: "",
      invoiceNumber: "",
      invoiceDate: "",
      totalAmount: 0,
      typeVat: 17,
      status: InvoiceStatus.NOT_RECEIVED,
      type: "חיוב",
    },
    validationSchema: InvoiceSchema,
    onSubmit: (values) => {
      addInvoice.mutate(
        {
            ...values,
            invoiceDate: new Date(values.invoiceDate),
            status: values.status as InvoiceStatus,
            type: values.type as InvoiceType,
        },
        {
        onError: (error) => {
            console.error("Error adding invoice:", error);
          setSnackbarMessage(error?.message || "שגיאה בהוספת חשבונית");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        },
        onSuccess: () => {
          setSnackbarMessage("חשבונית נוספה בהצלחה");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
          formik.resetForm();
          setTimeout(() => navigate("/"), 3000);
        },
      });
    },
  });

  if (isLoading) return <CircularProgress />;
  if (isError) return <div>שגיאה בטעינת החנויות</div>;

  return (
    <Box sx={{ maxWidth: 600, margin: "auto", mt: 4, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom color="primary">
        הוספת חשבונית חדשה
      </Typography>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Store Selection */}
          <Grid item xs={12}>
            <TextField
              select
              label="בחר חנות"
              name="storeId"
              value={formik.values.storeId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.storeId && Boolean(formik.errors.storeId)}
              helperText={formik.touched.storeId && formik.errors.storeId}
              fullWidth
            >
              <MenuItem value="" disabled>
                בחר חנות
              </MenuItem>
              {stores?.map((store: any) => (
                <MenuItem key={store._id} value={store._id}>
                  {store.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Invoice Number */}
          <Grid item xs={12}>
            <TextField
              label="מספר חשבונית"
              name="invoiceNumber"
              value={formik.values.invoiceNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.invoiceNumber && Boolean(formik.errors.invoiceNumber)}
              helperText={formik.touched.invoiceNumber && formik.errors.invoiceNumber}
              fullWidth
            />
          </Grid>

          {/* Received Date */}
          <Grid item xs={12}>
            <TextField
              label="תאריך קבלה"
              type="date"
              name="invoiceDate"
              value={formik.values.invoiceDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.invoiceDate && Boolean(formik.errors.invoiceDate)}
              helperText={formik.touched.invoiceDate && formik.errors.invoiceDate}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>

          {/* Total Amount */}
          <Grid item xs={12}>
            <TextField
              label="סכום סה״כ"
              type="number"
              name="totalAmount"
              value={formik.values.totalAmount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.totalAmount && Boolean(formik.errors.totalAmount)}
              helperText={formik.touched.totalAmount && formik.errors.totalAmount}
              fullWidth
            />
          </Grid>

          {/* Type VAT */}
          <Grid item xs={12}>
            <TextField
              select
              label="מע״מ"
              name="typeVat"
              value={formik.values.typeVat}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.typeVat && Boolean(formik.errors.typeVat)}
              helperText={formik.touched.typeVat && formik.errors.typeVat}
              fullWidth
            >
              <MenuItem value={17}>17%</MenuItem>
              <MenuItem value={18}>18%</MenuItem>
            </TextField>
          </Grid>

          {/* Status */}
          <Grid item xs={12}>
            <TextField
              select
              label="סטטוס"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.status && Boolean(formik.errors.status)}
              helperText={formik.touched.status && formik.errors.status}
              fullWidth
            >
            <MenuItem value={InvoiceStatus.NOT_RECEIVED}>לא התקבלה</MenuItem>
            <MenuItem value={InvoiceStatus.RECEIVED}>התקבלה</MenuItem>
            <MenuItem value={InvoiceStatus.ENTERED_TO_DATA}>הוכנסה לדאטה</MenuItem>
            <MenuItem value={InvoiceStatus.PAID}>שולמה</MenuItem>
            </TextField>
          </Grid>

          {/* Type */}
          <Grid item xs={12}>
            <TextField
              select
              label="סוג חשבונית"
              name="type"
              value={formik.values.type}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.type && Boolean(formik.errors.type)}
              helperText={formik.touched.type && formik.errors.type}
              fullWidth
            >
                <MenuItem value={InvoiceType.CHARGE}>חיוב</MenuItem>
                <MenuItem value={InvoiceType.CREDIT}>זיכוי</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Buttons */}
        <Grid container justifyContent="space-between" sx={{ mt: 4 }}>
          <Button variant="outlined" onClick={() => formik.resetForm()}>
            אפס טופס
          </Button>
          <Button type="submit" variant="contained" color="primary" onClick={() => {}}>
            הוספת חשבונית
          </Button>
        </Grid>
      </form>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default InvoiceCreate;
