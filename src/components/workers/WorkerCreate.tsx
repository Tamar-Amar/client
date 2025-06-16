import React, { useState } from 'react';
import { Box, Dialog, Paper, Tabs, Tab } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAddWorker, useUpdateWorker, useFetchWorker } from '../../queries/workerQueries';
import WorkerCreateStepper from './WorkerCreateStepper';
import PersonalDetails from './steps/PersonalDetails';
import ContactDetails from './steps/ContactDetails';
import EmploymentDetails from './steps/EmploymentDetails';
import TagsAndFinish from './steps/TagsAndFinish';
import WorkerTagManagement from './WorkerTagManagement';
import WorkerTags from './WorkerTags';
import WorkerDocuments from './WorkerDocuments';
import { Worker } from '../../types';
import { useParams, useNavigate } from 'react-router-dom';

interface FormValues extends Omit<Worker, 'bankDetails' | 'documents' | 'tags'> {
  password: string;
  bankDetails: {
    bankName: string;
    branchNumber: string;
    accountNumber: string;
    accountOwner: string;
  };
  documents: Document[];
  tags: string[];
}

interface Props {
  onSuccess?: () => void;
  mode?: 'create' | 'edit';
}

const WorkerSchema = Yup.object().shape({
  firstName: Yup.string().required('שדה חובה'),
  lastName: Yup.string().required('שדה חובה'),
  id: Yup.string()
    .matches(/^\d+$/, "מספר תעודת הזהות חייב לכלול רק ספרות")
    .required('שדה חובה'),
  password: Yup.string()
    .min(6, "סיסמא חייבת להכיל 6 תווים")
    .required('שדה חובה'),
  birthDate: Yup.string().required('שדה חובה'),
  city: Yup.string().required('שדה חובה'),
  street: Yup.string().required('שדה חובה'),
  buildingNumber: Yup.string().required('שדה חובה'),
  phone: Yup.string()
    .matches(/^\d+$/, "מספר הטלפון חייב לכלול רק ספרות")
    .required('שדה חובה'),
  email: Yup.string().email('כתובת אימייל לא תקינה').optional(),
  paymentMethod: Yup.string()
    .oneOf(['חשבונית', 'תלוש'], 'יש לבחור שיטת תשלום תקינה')
    .required('שדה חובה'),
  bankDetails: Yup.object().shape({
    bankName: Yup.string().optional(),
    branchNumber: Yup.string()
      .matches(/^\d+$/, "מספר סניף חייב לכלול רק ספרות")
      .optional(),
    accountNumber: Yup.string()
      .matches(/^\d+$/, "מספר חשבון חייב לכלול רק ספרות")
      .optional(),
    accountOwner: Yup.string().optional()
  }).optional(),
  workingSymbols: Yup.array().of(Yup.string()).optional(),
  accountantId: Yup.string().optional(),
  tags: Yup.array().of(Yup.string()).optional(),
  documents: Yup.array().of(Yup.string()).optional(),
  notes: Yup.string().optional(),
  apartmentNumber: Yup.string().optional(),
  weeklySchedule: Yup.array().of(Yup.object().shape({
    day: Yup.string().required('שדה חובה'),
    classes: Yup.array().of(Yup.string()).optional()
  })).optional()
});

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
      id={`worker-tabpanel-${index}`}
      aria-labelledby={`worker-tab-${index}`}
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

const WorkerCreate: React.FC<Props> = ({ onSuccess, mode = 'create' }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const addWorkerMutation = useAddWorker();
  const updateWorkerMutation = useUpdateWorker();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: existingWorkerData } = useFetchWorker(id || '');

  const formik = useFormik<FormValues>({
    initialValues: {
      _id: '',
      id: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      city: '',
      street: '',
      buildingNumber: '',
      apartmentNumber: '',
      workingSymbols: [],
      accountantId: '',
      tags: [],
      documents: [] as Document[],
      phone: '',
      email: '',
      paymentMethod: 'תלוש',
      password: '',
      bankDetails: {
        bankName: '',
        branchNumber: '',
        accountNumber: '',
        accountOwner: ''
      },
      notes: '',
      weeklySchedule: [
        { day: 'ראשון' as const, classes: [] },
        { day: 'שני' as const, classes: [] },
        { day: 'שלישי' as const, classes: [] },
        { day: 'רביעי' as const, classes: [] },
        { day: 'חמישי' as const, classes: [] }
      ],
      isActive: true,
      registrationDate: new Date().toISOString(),
      lastUpdateDate: new Date().toISOString(),
      status: 'לא נבחר',
      jobType: 'לא נבחר',
      jobTitle: 'לא נבחר'
    },
    validationSchema: WorkerSchema,
    onSubmit: async (values) => {
      try {
        const workerData: Worker = {
          ...values,
          _id: values._id,
          birthDate: values.birthDate ? new Date(values.birthDate).toISOString() : new Date().toISOString(),
          registrationDate: mode === 'create' ? new Date().toISOString() : existingWorkerData?.registrationDate || new Date().toISOString(),
          lastUpdateDate: new Date().toISOString(),
          isActive: true,
          workingSymbols: values.workingSymbols || [],
          tags: values.tags || [],
          documents: values.documents || [],
          weeklySchedule: values.weeklySchedule || [
            { day: 'ראשון' as const, classes: [] },
            { day: 'שני' as const, classes: [] },
            { day: 'שלישי' as const, classes: [] },
            { day: 'רביעי' as const, classes: [] },
            { day: 'חמישי' as const, classes: [] }
          ],
          status: mode === 'create' ? 'לא נבחר' : existingWorkerData?.status || 'לא נבחר',
          jobType: mode === 'create' ? 'לא נבחר' : existingWorkerData?.jobType || 'לא נבחר',
          jobTitle: mode === 'create' ? 'לא נבחר' : existingWorkerData?.jobTitle || 'לא נבחר'
        };

        if (mode === 'edit' && id) {
          await updateWorkerMutation.mutateAsync({ id, data: workerData });
        } else {
          await addWorkerMutation.mutateAsync(workerData);
        }

        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/workers');
        }
      } catch (error) {
        console.error('Error saving worker:', error);
      }
    },
  });



  const handleNext = async () => {
    if (activeStep === 4) {
      try {
        await formik.submitForm();
        // Only proceed if there are no errors
        if (Object.keys(formik.errors).length === 0) {
          if (onSuccess) {
            onSuccess();
          }
        }
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const isStepValid = () => {
    // בשלב האחרון, נאפשר לחיצה על סיום גם אם יש שדות לא חובה שלא מולאו
    if (activeStep === 4) {
      // נבדוק רק את השדות שהם חובה
      const requiredFields = [
        'firstName',
        'lastName',
        'id',
        'password',
        'birthDate',
        'city',
        'street',
        'buildingNumber',
        'phone',
        'paymentMethod'
      ];
      
      return requiredFields.every(field => {
        const error = formik.errors[field as keyof FormValues];
        const value = formik.values[field as keyof FormValues];
        return !error && value;
      });
    }

    // בשלבים הקודמים, נבדוק רק את השדות הרלוונטיים לשלב הנוכחי
    const stepFields = {
      0: ['firstName', 'lastName', 'id', 'password', 'birthDate'],
      1: ['city', 'street', 'buildingNumber', 'phone'],
      2: ['paymentMethod'],
      3: [],
      4: []
    }[activeStep] as (keyof FormValues)[];

    return stepFields?.every(field => {
      const error = formik.errors[field];
      const touched = formik.touched[field];
      const value = formik.values[field];
      return !error && (touched || value);
    }) ?? true;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStepContent = () => {
    const commonFormikProps = {
      values: formik.values,
      errors: formik.errors,
      touched: formik.touched,
      handleChange: formik.handleChange,
      handleBlur: formik.handleBlur,
      setFieldValue: formik.setFieldValue
    };

    if (activeStep === 3) {
      return (
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="worker management tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="תגיות" />
            <Tab label="מסמכים" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <WorkerTags
              workerId={formik.values._id}
              existingTags={formik.values.tags}
              onTagsChange={(tags) => formik.setFieldValue('tags', tags)}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <WorkerDocuments workerId={formik.values._id} />
          </TabPanel>
        </Paper>
      );
    }

    switch (activeStep) {
      case 0:
        return <PersonalDetails formik={commonFormikProps as any} />;
      case 1:
        return <ContactDetails formik={commonFormikProps as any} />;
      case 2:
        return <EmploymentDetails formik={commonFormikProps as any} />;
      case 4:
        return (
          <TagsAndFinish
            formik={commonFormikProps as any}
            onManageTags={() => setIsTagManagementOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <WorkerCreateStepper
        activeStep={activeStep}
        handleBack={handleBack}
        handleNext={handleNext}
        isLastStep={activeStep === 4}
        isValid={isStepValid()}
        isSubmitting={formik.isSubmitting || addWorkerMutation.isPending}
        steps={[
          'פרטים אישיים',
          'פרטי התקשרות',
          'פרטי העסקה',
          'תגיות ומסמכים',
          'סיום'
        ]}
      >
        {getStepContent()}
      </WorkerCreateStepper>

      <Dialog
        open={isTagManagementOpen}
        onClose={() => setIsTagManagementOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <WorkerTagManagement />
      </Dialog>
    </Box>
  );
};

export default WorkerCreate; 