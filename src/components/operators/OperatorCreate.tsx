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
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  IconButton
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon from "@mui/icons-material/Business";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CancelIcon from '@mui/icons-material/Cancel';
import { useFormik } from "formik";
import { OperatorSchema } from "../../types/validations/OperatorValidation";
import PasswordField from "../other/PasswordField";
import { useAddOperator } from "../../queries/operatorQueries";
import { useNavigate } from "react-router-dom";
import { EducationType, Gender, PaymentMethodChoicesEnum } from "../../types";
import { useFetchClasses } from "../../queries/classQueries";

interface Class {
  _id: string;
  name: string;
  uniqueSymbol: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Props {
  onSuccess?: () => void;
}

const OperatorCreate: React.FC<Props> = ({ onSuccess }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [tabValue, setTabValue] = useState(0);
  const addOperatorMutation = useAddOperator();
  const navigate = useNavigate();
  const { data: classes = [] } = useFetchClasses();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      status: "",
      id: "",
      address: "",
      description: "כללי",
      paymentMethod: PaymentMethodChoicesEnum.NONE,
      businessDetails: {
        businessId: "לא נבחר",
        businessName: "לא נבחר",
      },
      bankDetails: {
        bankName: "לא נבחר",
        accountNumber: "00",
        branchNumber: "00",
      },
      gender: Gender.ALL,
      educationType: EducationType.ALL,
      isActive: true,
      regularClasses: [],
    },
    validationSchema: OperatorSchema,
    onSubmit: (values) => {
      addOperatorMutation.mutate(values, {
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
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        },
      });
    },
  });

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleDeleteClass = (classIdToDelete: string) => {
    formik.setFieldValue(
      'regularClasses',
      formik.values.regularClasses.filter((id: string) => id !== classIdToDelete)
    );
  };

  return (
    <Box sx={{ 
      maxWidth: 700, 
      margin: "auto", 
      p: 3, 
      minHeight: 700, 
      position: 'relative', 
      pb: 10,
      bgcolor: 'transparent'
    }}>
      <form id="operator-create-form" onSubmit={formik.handleSubmit}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="operator creation tabs"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: theme => theme.palette.primary.main,
              }
            }}
          >
            <Tab label="פרטים אישיים" />
            <Tab label="פרטי תשלום" />
            <Tab label="קבוצות משויכות" />
          </Tabs>
        </Box>

        <Box sx={{ bgcolor: 'transparent' }}>
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>פרטים אישיים</Typography>
            <Grid container spacing={2}>
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
                  InputProps={{ startAdornment: (<InputAdornment position="start"><AccountCircleIcon /></InputAdornment>) }}
                />
              </Grid>

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
                  InputProps={{ startAdornment: (<InputAdornment position="start"><AccountCircleIcon /></InputAdornment>) }}
                />
              </Grid>

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
                  InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneIcon /></InputAdornment>) }}
                />
              </Grid>

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
                  InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon /></InputAdornment>) }}
                />
              </Grid>

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

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>כתובת</Typography>
            <Grid container spacing={2}>
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
                  InputProps={{ startAdornment: (<InputAdornment position="start"><LocationOnIcon /></InputAdornment>) }}
                />
              </Grid>

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
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>פרטי תשלום</Typography>
            <Grid container spacing={2}>
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

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>פרטי עסק</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
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

              <Grid item xs={6}>
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

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>פרטי בנק</Typography>
            <Grid container spacing={2}>
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
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>העדפות הפעלה</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="מגדר"
                  name="gender"
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.gender && Boolean(formik.errors.gender)}
                  helperText={formik.touched.gender && formik.errors.gender}
                  fullWidth
                >
                  <MenuItem value={Gender.MALE}>{Gender.MALE}</MenuItem>
                  <MenuItem value={Gender.FEMALE}>{Gender.FEMALE}</MenuItem>
                  <MenuItem value={Gender.ALL}>{Gender.ALL}</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  select
                  label="סוג חינוך"
                  name="educationType"
                  value={formik.values.educationType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.educationType && Boolean(formik.errors.educationType)}
                  helperText={formik.touched.educationType && formik.errors.educationType}
                  fullWidth
                >
                  <MenuItem value={EducationType.BASIC}>{EducationType.BASIC}</MenuItem>
                  <MenuItem value={EducationType.SPECIAL}>{EducationType.SPECIAL}</MenuItem>
                  <MenuItem value={EducationType.ALL}>{EducationType.ALL}</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>קבוצות משויכות</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="classes-label">בחר קבוצות</InputLabel>
                  <Select
                    labelId="classes-label"
                    multiple
                    value={formik.values.regularClasses}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    name="regularClasses"
                    input={<OutlinedInput label="בחר קבוצות" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((classId) => {
                          const selectedClass = classes.find((c: Class) => c._id === classId);
                          return (
                            <Chip 
                              key={classId} 
                              label={selectedClass ? `${selectedClass.name} (${selectedClass.uniqueSymbol})` : classId}
                              onDelete={() => handleDeleteClass(classId)}
                              deleteIcon={<CancelIcon />}
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {classes.map((classItem: Class) => (
                      <MenuItem key={classItem._id} value={classItem._id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{classItem.name}</span>
                          <Typography variant="body2" color="text.secondary">
                            {classItem.uniqueSymbol}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </form>

      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: 20, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 4,
          alignItems: 'center'
        }}
      >
        <IconButton
          onClick={() => setTabValue(Math.max(0, tabValue - 1))}
          disabled={tabValue === 0}
          size="large"
          sx={{ 
            color: theme => tabValue === 0 ? theme.palette.action.disabled : theme.palette.primary.main,
            '&:hover': {
              backgroundColor: 'transparent',
              transform: 'scale(1.2)',
              transition: 'transform 0.2s'
            }
          }}
        >
          <ArrowForwardIcon fontSize="large" />
        </IconButton>

        {tabValue === 2 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => formik.handleSubmit()}
          >
            שמור
          </Button>
        ) : (
          <IconButton
            onClick={() => setTabValue(Math.min(2, tabValue + 1))}
            size="large"
            sx={{ 
              color: theme => theme.palette.primary.main,
              '&:hover': {
                backgroundColor: 'transparent',
                transform: 'scale(1.2)',
                transition: 'transform 0.2s'
              }
            }}
          >
            <ArrowBackIcon fontSize="large" />
          </IconButton>
        )}
      </Box>

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
