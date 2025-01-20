import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import { useFormik } from "formik";
import { PurchaseSchema } from "../types/validations/PurchaseValidation";
import {useAddPurchase } from "../queries/purchaseQueries";
import { useFetchClasses } from "../queries/classQueries";
import { useFetchStores } from "../queries/storeQueries";



const PurchasesCreate: React.FC = () => {
  const { data: classes } = useFetchClasses();
  const { data: stores } = useFetchStores();
  const addPurchaseMutation = useAddPurchase();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const formik = useFormik({
    initialValues: {
      purchaseDate: "",
      classId: "",
      storeId: "",
      description: "",
      invoiceId: "",
      purchaseType: "",
      amount: 0,
      actualUsage:  0,
    },
    validationSchema: PurchaseSchema,
    onSubmit: (values) => {
      // הסרת `purchaseType` שאינו נדרש בשרת
      const { purchaseType, ...dataToSend } = values;
  
      addPurchaseMutation.mutate(dataToSend, {
        onError: (error) => {
          console.error("שגיאה בשליחת רכישה:", error.message);
        },
        onSuccess: () => {
          console.log("הרכישה נוספה בהצלחה!");
          formik.resetForm();
        },
      });
    },
  });
  
  

useEffect(() => {
  if (formik.values.purchaseType === "רכש צהרונים") {
    const selectedClass = classes?.find((cls: any) => cls._id === formik.values.classId);
    if (selectedClass) {
      const calculatedAmount = selectedClass.type === "גן" ? 200 : 250;
      formik.setFieldValue("amount", calculatedAmount);
    }
  } else {
    formik.setFieldValue("amount", formik.values.amount || 0); 
  }
}, [formik.values.purchaseType, formik.values.classId, classes]);
  


return (
    <Box sx={{ maxWidth: 700, margin: "auto", mt: 4, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom color="primary">
        הוספת רכישה
      </Typography>
      <form onSubmit={formik.handleSubmit}>
        {/* Month */}
        <Grid item xs={12} sx={{ mb: 2 }}>
          <TextField
            label="בחר חודש"
            type="month"
            name="month"
            value={formik.values.purchaseDate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.purchaseDate && Boolean(formik.errors.purchaseDate)}
            helperText={formik.touched.purchaseDate && formik.errors.purchaseDate}
            fullWidth
          />
        </Grid>

        {/* Class */}
        <Grid item xs={12} sx={{ mb: 2 }}>
          <TextField
            select
            label="בחר קבוצה"
            name="classId"
            value={formik.values.classId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.classId && Boolean(formik.errors.classId)}
            helperText={formik.touched.classId && formik.errors.classId}
            fullWidth
          >
            {classes?.map((cls: any) => (
              <MenuItem key={cls._id} value={cls._id}>
                {cls.uniqueSymbol} - {cls.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Store */}
        <Grid item xs={12} sx={{ mb: 2 }}>
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
            {stores?.map((store: any) => (
              <MenuItem key={store._id} value={store._id}>
                {store.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Description */}
        <Grid item xs={12} sx={{ mb: 2 }}>
          <TextField
            label="תיאור"
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
            multiline
            rows={3}
            fullWidth
          />
        </Grid>

        {/* Invoice ID */}
        <Grid item xs={12} sx={{ mb: 2 }}>
          <TextField
            label="מזהה חשבונית"
            name="invoiceId"
            value={formik.values.invoiceId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            fullWidth
          />
        </Grid>

        {/* Purchase Type */}
        <Grid item xs={12}>
        <TextField
          select
          label="סוג רכישה"
          name="purchaseType"
          value={formik.values.purchaseType}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.purchaseType && Boolean(formik.errors.purchaseType)}
          helperText={formik.touched.purchaseType && formik.errors.purchaseType}
          fullWidth
        >
          <MenuItem value="">בחר סוג</MenuItem>
          <MenuItem value="רכש צהרונים">רכש צהרונים</MenuItem>
          <MenuItem value="קייטנה חנוכה">קייטנה חנוכה</MenuItem>
          <MenuItem value="אחר">אחר</MenuItem>
        </TextField>
      </Grid>


        <Grid item xs={12}>
          {formik.values.purchaseType === "אחר" || formik.values.purchaseType === "קייטנה חנוכה" ? (
            <TextField
              label="סכום"
              name="amount"
              value={formik.values.amount || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.amount && Boolean(formik.errors.amount)}
              helperText={formik.touched.amount && formik.errors.amount}
              fullWidth
              type="number"
            />
          ) : (
            <TextField
              label="סכום"
              value={formik.values.amount || ""}
              disabled
              fullWidth
            />
          )}
        </Grid>


        <Button variant="contained" color="primary" type="submit" fullWidth>
          שמירה
        </Button>
      </form>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchasesCreate;
