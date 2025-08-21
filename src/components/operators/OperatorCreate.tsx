import React, { useState, useRef } from "react";
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
  Chip,
  IconButton,
  Paper,
  CircularProgress,
  Autocomplete
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useFormik } from "formik";
import { OperatorSchema } from "../../types/validations/OperatorValidation";
import PasswordField from "../other/PasswordField";
import { useAddOperator } from "../../queries/operatorQueries";
import { useUpdateDocuments } from "../../queries/useDocuments";
import { EducationType, Gender, PaymentMethodChoicesEnum } from "../../types";
import { useFetchClasses } from "../../queries/classQueries";
import { useUploadDocument } from "../../queries/useDocuments";
import { styled } from '@mui/material/styles';

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

const StyledTabPanel = styled(Box)(({ theme }) => ({
  backgroundColor: '#fff',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  margin: theme.spacing(2, 0),
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  minWidth: 120,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: '8px',
  padding: theme.spacing(0.5),
  '& .MuiChip-label': {
    fontWeight: 500,
  },
  '&:hover': {
    backgroundColor: theme.palette.error.light,
  },
}));

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <StyledTabPanel
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </StyledTabPanel>
  );
}

interface Props {
  onSuccess?: () => void;
}

interface FormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  status: string;
  id: string;
  address: string;
  description: string;
  paymentMethod: PaymentMethodChoicesEnum;
  gender: Gender;
  educationType: EducationType;
  isActive: boolean;
  regularClasses: string[];
}


const NewOperatorDocuments: React.FC<{ tempOperatorId: string }> = ({ tempOperatorId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tag, setTag] = useState('');
  const [customTag, setCustomTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadMutation = useUploadDocument();
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, tag: string, size: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const isDuplicate = uploadedFiles.some(
        existingFile => existingFile.name === file.name && existingFile.size === file.size
      );

      if (isDuplicate) {
        setError('קובץ זה כבר הועלה');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(null);
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || (!tag || (tag === 'אחר' && !customTag))) return;

    const finalTag = tag === 'אחר' ? customTag : tag;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workerId', tempOperatorId);
    formData.append('documentType', finalTag);
    formData.append('tag', finalTag);

    try {
      const result = await uploadMutation.mutateAsync(formData);
      
      setUploadedFiles(prev => [...prev, { 
        name: selectedFile.name, 
        tag: finalTag,
        size: selectedFile.size 
      }]);
      setSelectedFile(null);
      setTag('');
      setCustomTag('');
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('שגיאה בהעלאת הקובץ');
    }
  };

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <Box display="flex" gap={2} alignItems="center" mb={3} flexWrap="wrap">
          <TextField
            select
            label="סוג מסמך"
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              if (e.target.value !== 'אחר') {
                setCustomTag('');
              }
            }}
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          >
            <MenuItem value="צילום תעודת זהות">צילום תעודת זהות</MenuItem>
            <MenuItem value="טופס 101">טופס 101</MenuItem>
            <MenuItem value="אחר">אחר</MenuItem>
          </TextField>

          {tag === 'אחר' && (
            <TextField
              label="תגית חופשית"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          )}

          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept="application/pdf,image/*"
            onChange={handleFileChange}
          />

          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            startIcon={<CloudUploadIcon />}
            sx={{ 
              borderRadius: 2,
              borderColor: 'rgba(0, 0, 0, 0.23)',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'transparent'
              }
            }}
          >
            {selectedFile ? selectedFile.name : 'בחר קובץ'}
          </Button>

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || !tag || (tag === 'אחר' && !customTag) || uploadMutation.isPending}
            sx={{ 
              borderRadius: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: 'primary.dark',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }
            }}
          >
            {uploadMutation.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'העלה'
            )}
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {error}
          </Alert>
        )}

        {uploadedFiles.length > 0 && (
          <Paper 
            sx={{ 
              p: 3, 
              mt: 2,
              borderRadius: 2,
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <Typography variant="h6" gutterBottom color="primary" fontWeight="600">
              מסמכים שהועלו
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {uploadedFiles.map((file, index) => (
                <StyledChip
                  key={index}
                  label={`${file.tag} - ${file.name}`}
                  onDelete={() => {
                    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};

const OperatorCreate: React.FC<Props> = ({ onSuccess }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [tabValue, setTabValue] = useState(0);
  const addOperatorMutation = useAddOperator();
  const updateDocumentsMutation = useUpdateDocuments();
  const { data: classes = [] } = useFetchClasses();
  const [tempOperatorId] = useState<string>('temp-' + Date.now());

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formik = useFormik<FormValues>({
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
      gender: Gender.ALL,
      educationType: EducationType.ALL,
      isActive: true,
      regularClasses: [],
    },
    validationSchema: OperatorSchema,
    onSubmit: async (values) => {
      try {
        const result = await addOperatorMutation.mutateAsync(values);
        
        if (!result?._id) {
          throw new Error('לא התקבל מזהה למפעיל החדש');
        }

        try {
          await updateDocumentsMutation.mutateAsync({
            tempId: tempOperatorId,
            newOperatorId: result._id
          });
        } catch (docError) {
          console.error('שגיאה בעדכון המסמכים:', docError);
        }

        setSnackbarMessage("המפעיל נוסף בהצלחה");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        formik.resetForm();
        
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } catch (error: any) {
        console.error('שגיאה בהוספת מפעיל:', error);
        setSnackbarMessage(error?.message || "שגיאה בהוספת מפעיל");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    },
  });

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleClassesChange = (event: any, newValue: Class[]) => {
    const classIds = newValue.map(cls => cls._id);
    formik.setFieldValue('regularClasses', classIds);
  };

  const selectedClasses = classes.filter((cls: Class) => 
    formik.values.regularClasses.includes(cls._id)
  );

  return (
    <Box sx={{ 
      maxWidth: 800, 
      margin: "auto", 
      p: 3, 
      minHeight: 700, 
      position: 'relative', 
      pb: 10,
      bgcolor: 'transparent'
    }}>
      <form id="operator-create-form" onSubmit={formik.handleSubmit}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0'
          }
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="operator creation tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTabs-flexContainer': {
                gap: 2
              }
            }}
          >
            <StyledTab label="פרטים אישיים" />
            <StyledTab label="פרטי תשלום" />
            <StyledTab label="קבוצות משויכות" />
            <StyledTab label="מסמכים" />
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
                <Autocomplete
                  multiple
                  id="classes-autocomplete"
                  options={classes}
                  value={selectedClasses}
                  onChange={handleClassesChange}
                  getOptionLabel={(option: Class) => `${option.name} (${option.uniqueSymbol})`}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="בחר קבוצות"
                      error={formik.touched.regularClasses && Boolean(formik.errors.regularClasses)}
                      helperText={formik.touched.regularClasses && formik.errors.regularClasses}
                    />
                  )}
                  renderOption={(props, option: Class) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography>{option.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                          {option.uniqueSymbol}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const props = getTagProps({ index });
                      return (
                        <Chip
                          {...props}
                          label={`${option.name} (${option.uniqueSymbol})`}
                          sx={{
                            borderRadius: '8px',
                            '& .MuiChip-label': {
                              fontWeight: 500,
                            },
                          }}
                        />
                      );
                    })
                  }
                  PaperComponent={props => (
                    <Paper 
                      {...props} 
                      elevation={3}
                      sx={{ 
                        borderRadius: 2,
                        mt: 1,
                        '& .MuiAutocomplete-option': {
                          px: 2,
                          py: 1,
                        }
                      }}
                    />
                  )}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>העלאת מסמכים</Typography>
            <Box sx={{ mt: 2 }}>
              <NewOperatorDocuments tempOperatorId={tempOperatorId} />
            </Box>
          </TabPanel>
        </Box>
      </form>

      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 20, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 4,
          alignItems: 'center',
          zIndex: 1000,
          padding: 2,
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,1) 100%)'
        }}
      >
        <IconButton
          onClick={() => setTabValue(Math.max(0, tabValue - 1))}
          disabled={tabValue === 0}
          size="large"
          sx={{ 
            color: theme => tabValue === 0 ? theme.palette.action.disabled : theme.palette.primary.main,
            transition: 'transform 0.2s',
            '&:hover': {
              backgroundColor: 'transparent',
              transform: 'scale(1.2)',
            }
          }}
        >
          <ArrowForwardIcon fontSize="large" />
        </IconButton>

        {tabValue === 3 ? (
          <AnimatedButton
            variant="contained"
            onClick={() => formik.handleSubmit()}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              padding: '12px 32px',
              fontSize: '1.1rem'
            }}
          >
            שמור
          </AnimatedButton>
        ) : (
          <IconButton
            onClick={() => setTabValue(Math.min(3, tabValue + 1))}
            size="large"
            sx={{ 
              color: theme => theme.palette.primary.main,
              transition: 'transform 0.2s',
              '&:hover': {
                backgroundColor: 'transparent',
                transform: 'scale(1.2)',
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
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ 
            width: "100%",
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OperatorCreate;
