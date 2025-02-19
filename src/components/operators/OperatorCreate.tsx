import React, { useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  MenuItem,
  Snackbar,
  Alert,
  InputAdornment,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon from "@mui/icons-material/Business";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { useFormik } from "formik";
import { OperatorSchema } from "../../types/validations/OperatorValidation";
import PasswordField from "../PasswordField";
import { useAddOperator } from "../../queries/operatorQueries";
import { useNavigate } from "react-router-dom";
import { EducationType, Gender, PaymentMethodChoicesEnum } from "../../types";

const OperatorCreate: React.FC = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const addOperatorMutation = useAddOperator();
  const navigate = useNavigate();



  const formik = useFormik({
    initialValues: {
      firstName: "",
      description: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      status: "",
      id: "",
      address: "",
      paymentMethod: PaymentMethodChoicesEnum.NONE,
      businessDetails: {
        businessId: "",
        businessName: "",
      },
      bankDetails: {
        bankName: "",
        accountNumber: "",
        branchNumber: "",
      },
      gender:Gender.ALL,
      educationType:EducationType.ALL,
    },
    validationSchema: OperatorSchema,
    onSubmit: (values) => {

      addOperatorMutation.mutate(values,{
        onError: (error) => {
          setSnackbarMessage(error?.message || "שגיאה בהוספת מפעיל");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        },
        onSuccess: () => {
          setSnackbarMessage("המפעיל נוסף בהצלחה");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
          formik.resetForm();
          setTimeout(() => navigate("/"), 3000);
        },
      })
    }
});

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 700, margin: "auto", mt: 4, p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom color="primary">
        הוספת מפעיל חדש
      </Typography>
      <form onSubmit={formik.handleSubmit}>
        {/* Personal Details */}
        <Typography variant="h6" gutterBottom>
          פרטים אישיים
        </Typography>
        <Grid container spacing={3}>
          {/* First Name */}
          <Grid item xs={6}>
            <TextField
              label="שם פרטי"
              name="firstName"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.firstName && Boolean(formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Last Name */}
          <Grid item xs={6}>
            <TextField
              label="שם משפחה"
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={6}>
            <TextField
              label="מספר טלפון"
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={6}>
            <TextField
              label="כתובת אימייל"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Id */}
          <Grid item xs={6}>
            <TextField
              label="מספר זהות"
              name="id"
              value={formik.values.id}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.id && Boolean(formik.errors.id)}
              helperText={formik.touched.id && formik.errors.id}
              fullWidth
            />
          </Grid>

          {/* Password */}
          <Grid item xs={6}>
            <PasswordField
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
            />
          </Grid> 


        </Grid>

        {/* Address */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          כתובת
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="כתובת מגורים"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

                  {/* Description */}
                  <Grid item xs={12}>
            <TextField
              label="תיאור הפעלה"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
              fullWidth
            />
          </Grid>

        </Grid>

        {/* Payment Method */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          פרטי תשלום
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6}>
          <TextField
            select
            label="אופן תשלום"
            name="paymentMethod"
            value={formik.values.paymentMethod}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
            helperText={formik.touched.paymentMethod && formik.errors.paymentMethod}
            fullWidth
          >
            <MenuItem value={PaymentMethodChoicesEnum.NONE}>{PaymentMethodChoicesEnum.NONE}</MenuItem>
            <MenuItem value={PaymentMethodChoicesEnum.CHEABONIT}>{PaymentMethodChoicesEnum.CHEABONIT}</MenuItem>
            <MenuItem value={PaymentMethodChoicesEnum.TLUSH}>{PaymentMethodChoicesEnum.TLUSH}</MenuItem>
          </TextField>
          </Grid>
        </Grid>


          {/* Business Details */}
          <Typography variant="subtitle1">פרטי עסק</Typography>
          <Grid container spacing={1}>
          <Grid item xs={6} >
            <TextField
              label="ח.פ. עסק"
              name="businessDetails.businessId"
              value={formik.values.businessDetails.businessId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.businessDetails?.businessId && Boolean(formik.errors.businessDetails?.businessId)}
              helperText={formik.touched.businessDetails?.businessId && formik.errors.businessDetails?.businessId}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={6} >
            <TextField
              label="שם העסק"
              name="businessDetails.businessName"
              value={formik.values.businessDetails.businessName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.businessDetails?.businessName && Boolean(formik.errors.businessDetails?.businessName)}
              helperText={formik.touched.businessDetails?.businessName && formik.errors.businessDetails?.businessName}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          </Grid>

        {/* Bank Details */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          פרטי בנק
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={4}>
            <TextField
              label="שם הבנק"
              name="bankDetails.bankName"
              value={formik.values.bankDetails.bankName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.bankDetails?.bankName && Boolean(formik.errors.bankDetails?.bankName)}
              helperText={formik.touched.bankDetails?.bankName && formik.errors.bankDetails?.bankName}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCardIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              label="מספר חשבון"
              name="bankDetails.accountNumber"
              value={formik.values.bankDetails.accountNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.bankDetails?.accountNumber && Boolean(formik.errors.bankDetails?.accountNumber)}
              helperText={formik.touched.bankDetails?.accountNumber && formik.errors.bankDetails?.accountNumber}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCardIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              label="מספר סניף"
              name="bankDetails.branchNumber"
              value={formik.values.bankDetails.branchNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.bankDetails?.branchNumber && Boolean(formik.errors.bankDetails?.branchNumber)}
              helperText={formik.touched.bankDetails?.branchNumber && formik.errors.bankDetails?.branchNumber}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCardIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Grid container justifyContent="center" sx={{ mt: 4 }}>
          <Button type="submit" variant="contained" color="primary">
            הוספת מפעיל
          </Button>
        </Grid>
      </form>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OperatorCreate;
