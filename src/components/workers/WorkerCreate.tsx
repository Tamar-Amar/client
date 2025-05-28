import React, { useState, useEffect } from 'react';
import { Box, Dialog } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAddWorker, useUpdateWorker, useFetchWorker } from '../../queries/workerQueries';
import WorkerCreateStepper from './WorkerCreateStepper';
import PersonalDetails from './steps/PersonalDetails';
import ContactDetails from './steps/ContactDetails';
import EmploymentDetails from './steps/EmploymentDetails';
import TagsAndFinish from './steps/TagsAndFinish';
import WorkerTagManagement from './WorkerTagManagement';
import { Worker, WeeklySchedule, WorkerDocument } from '../../types';
import { DocumentStatus } from '../../types/Document';
import { useParams, useNavigate } from 'react-router-dom';

interface FormValues extends Omit<Worker, 'bankDetails' | 'documents'> {
  password: string;
  bankDetails: {
    bankName: string;
    branchNumber: string;
    accountNumber: string;
    accountOwner: string;
  };
  documents: string[];
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

const WorkerCreate: React.FC<Props> = ({ onSuccess, mode = 'create' }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const addWorkerMutation = useAddWorker();
  const updateWorkerMutation = useUpdateWorker();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: existingWorkerData, isLoading } = useFetchWorker(id || '');

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
      documents: [],
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
        { day: 'ראשון', classes: [] },
        { day: 'שני', classes: [] },
        { day: 'שלישי', classes: [] },
        { day: 'רביעי', classes: [] },
        { day: 'חמישי', classes: [] }
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
        const workerData: Omit<Worker, '_id'> = {
          ...values,
          birthDate: values.birthDate ? new Date(values.birthDate).toISOString() : new Date().toISOString(),
          registrationDate: mode === 'create' ? new Date().toISOString() : existingWorkerData?.registrationDate || new Date().toISOString(),
          lastUpdateDate: new Date().toISOString(),
          isActive: true,
          workingSymbols: values.workingSymbols || [],
          tags: values.tags || [],
          documents: (values.documents || []).map(docId => ({
            documentId: docId,
            status: 'אושר' as const
          })) as WorkerDocument[],
          weeklySchedule: values.weeklySchedule || [
            { day: 'ראשון', classes: [] },
            { day: 'שני', classes: [] },
            { day: 'שלישי', classes: [] },
            { day: 'רביעי', classes: [] },
            { day: 'חמישי', classes: [] }
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

  useEffect(() => {
    if (mode === 'edit' && existingWorkerData) {
      formik.setValues({
        ...existingWorkerData,
        birthDate: existingWorkerData.birthDate ? new Date(existingWorkerData.birthDate).toISOString().split('T')[0] : '',
        password: '',
        workingSymbols: existingWorkerData.workingSymbols || [],
        tags: existingWorkerData.tags || [],
        documents: existingWorkerData.documents?.map(doc => doc.documentId) || [],
        bankDetails: {
          bankName: existingWorkerData.bankDetails?.bankName || '',
          branchNumber: existingWorkerData.bankDetails?.branchNumber || '',
          accountNumber: existingWorkerData.bankDetails?.accountNumber || '',
          accountOwner: existingWorkerData.bankDetails?.accountOwner || ''
        },
        weeklySchedule: existingWorkerData.weeklySchedule || [
          { day: 'ראשון', classes: [] },
          { day: 'שני', classes: [] },
          { day: 'שלישי', classes: [] },
          { day: 'רביעי', classes: [] },
          { day: 'חמישי', classes: [] }
        ],
        apartmentNumber: existingWorkerData.apartmentNumber || '',
        accountantId: existingWorkerData.accountantId || '',
        email: existingWorkerData.email || '',
        notes: existingWorkerData.notes || ''
      });
    }
  }, [existingWorkerData, mode]);

  const handleNext = async () => {
    if (activeStep === 3) {
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
    if (activeStep === 3) {
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
      3: []
    }[activeStep] as (keyof FormValues)[];

    return stepFields?.every(field => {
      const error = formik.errors[field];
      const touched = formik.touched[field];
      const value = formik.values[field];
      return !error && (touched || value);
    }) ?? true;
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

    switch (activeStep) {
      case 0:
        return <PersonalDetails formik={commonFormikProps as any} />;
      case 1:
        return <ContactDetails formik={commonFormikProps as any} />;
      case 2:
        return <EmploymentDetails formik={commonFormikProps as any} />;
      case 3:
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
        isLastStep={activeStep === 3}
        isValid={isStepValid()}
        isSubmitting={formik.isSubmitting || addWorkerMutation.isPending}
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