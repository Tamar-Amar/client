import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Backdrop
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Update as UpdateIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';
import { useFetchClasses } from '../queries/classQueries';
import { useAddMultipleWorkersAfterNoon, useFetchAllWorkersAfterNoon, useUpdateWorkerAfterNoon } from '../queries/workerAfterNoonQueries';
import { useCreateMultipleAssignments, useCheckAssignmentExists, useFetchAllWorkerAssignments } from '../queries/workerAssignmentQueries';
import { WorkerAfterNoon, Class } from '../types';
import { normalizePhone, isValidPhone,validateIsraeliID, parseDate } from '../components/workers/excelImportUtils';

const projectTypes = [
  { label: 'צהרון 2025', value: 1 },
  { label: 'קייטנת חנוכה 2025', value: 2 },
  { label: 'קייטנת פסח 2025', value: 3 },
  { label: 'קייטנת קיץ 2025', value: 4 },
  { label: 'צהרון 2026', value: 5 },
];

interface PreviewWorker extends Omit<WorkerAfterNoon, '_id' | 'isAfterNoon' | 'isBaseWorker' | 'isHanukaCamp' | 'isPassoverCamp' | 'isSummerCamp' | 'startDate' | 'endDate' | 'roleName'> {
  _id?: string;
  isDuplicate?: boolean;
  isBestDuplicate?: boolean;
  workingSymbol?: string;
  allSymbols?: string[];
  symbols?: string[]; 
  projectCodes?: number[];
  isNew?: boolean;
  isExisting?: boolean;
  isInvalid?: boolean;
  isUnrecognizedSymbol?: boolean;
  isUpToDate?: boolean;
  validationErrors?: string[];
  existingWorker?: WorkerAfterNoon;
  changes?: {
    before: Partial<PreviewWorker>;
    after: Partial<PreviewWorker>;
  };  
  assignmentData?: {
    startDate: Date;
    endDate?: Date;
    roleName: string;
  };
}

interface ImportSummary {
  totalWorkers: number;
  newWorkersWithSymbol: number;
  newWorkersUnrecognizedSymbol: number;
  newWorkersWithoutSymbol: number;
  invalidWorkers: number;
  existingWorkers: number;
  updatedWorkers: number;
  duplicateWorkers: number;
}

    const normalize = (val: string | undefined | null) => (val ?? '').trim().toLowerCase();

const getCurrentSymbolsForWorker = (workerId: string, classes: Class[], workerAssignments: any[], selectedProjects: number[]) => {
  const workerSymbols: string[] = [];
  
  selectedProjects.forEach(projectCode => {
    const assignment = workerAssignments.find((a: any) => {
      const assignmentWorkerId = typeof a.workerId === 'object' ? a.workerId._id : a.workerId;
      return assignmentWorkerId === workerId && 
             a.projectCode === projectCode && 
             a.isActive;
    });
    
    if (assignment) {
      const classObj = classes.find(c => {
        const classId = typeof assignment.classId === 'object' ? assignment.classId._id : assignment.classId;
        return c._id === classId;
      });
      
      if (classObj && !workerSymbols.includes(classObj.uniqueSymbol)) {
        workerSymbols.push(classObj.uniqueSymbol);
      }
    }
  });
  
  return workerSymbols;
};



const WorkersImportPage: React.FC = () => {
  const isMountedRef = useRef(true);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [allWorkers, setAllWorkers] = useState<PreviewWorker[]>([]);
  const [originalExcelData, setOriginalExcelData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDecisions, setImportDecisions] = useState<{
    unrecognizedSymbols: string[];
    invalidWorkers: string[];
    existingWorkers: string[];
  }>({
    unrecognizedSymbols: [],
    invalidWorkers: [],
    existingWorkers: []
  });

  const addMultipleWorkersMutation = useAddMultipleWorkersAfterNoon();
  const updateWorkerMutation = useUpdateWorkerAfterNoon();
  const createMultipleAssignmentsMutation = useCreateMultipleAssignments();
  const checkAssignmentExistsMutation = useCheckAssignmentExists();
  const { data: classes = [], isLoading: isLoadingClasses } = useFetchClasses();
  const { data: existingWorkers = [] } = useFetchAllWorkersAfterNoon();
  const { data: workerAssignments = [] } = useFetchAllWorkerAssignments();
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const steps = [
    'בחירת פרויקטים',
    'העלאת קובץ',
    'סקירת נתונים',
    'אישור ייבוא'
  ];

  const findClassIdBySymbol = (symbol: string): string | null => {
    if (isLoadingClasses) return null;
    
    const trimmedSymbol = symbol.trim();
    
    const exactMatch = classes.find((c: Class) => c.uniqueSymbol === trimmedSymbol);
    if (exactMatch) return exactMatch._id;
    
    if (trimmedSymbol.includes('-')) {
      const baseSymbol = trimmedSymbol.split('-')[0].trim();
      const baseMatch = classes.find((c: Class) => c.uniqueSymbol === baseSymbol);
      if (baseMatch) return baseMatch._id;
    }
    
    return null;
  };

  const convertExcelRowToWorker = (row: any): PreviewWorker => {
    let id = row[3]?.toString()?.trim() || '';
    if (id.includes('E') || id.includes('e')) {
      const originalValue = row[3];
      id = Number(originalValue).toString();
    }
    
    const firstName = row[5]?.toString()?.trim() || '';
    const lastName = row[4]?.toString()?.trim() || '';
    
    if (!id || !firstName || !lastName) {
      throw new Error(`נתונים חסרים: תעודת זהות: ${id}, שם פרטי: ${firstName}, שם משפחה: ${lastName}`);
    }
    
    if (!validateIsraeliID(id)) {
      throw new Error(`תעודת זהות ${id} אינה תקינה`);
    }
    
    const now = new Date().toISOString();
    const symbol = row[0]?.toString().trim();
    const is101 = row[11]?.toString()?.trim() === 'יש' || row[11]?.toString()?.trim() === 'כן' ? true : false;

    const assignmentData = {
      startDate: parseDate(row[8]) ? new Date(parseDate(row[8])) : new Date(now),
      endDate: parseDate(row[9]) ? new Date(parseDate(row[9])) : undefined,
      roleName: row[2] || 'לא נבחר'
    };

    return {
      firstName: firstName,
      lastName: lastName,
      id: id,
      phone: row[6]?.toString() || '',
      email: row[7]?.toString() || '',
      isActive: true,
      createDate: new Date(now),
      updateDate: new Date(now),
      updateBy: 'מערכת',
      status: row[10] || 'לא נבחר',
      notes: 'לא נבחר',     
      workingSymbol: symbol || '',
      is101: is101,
      projectCodes: [],
      validationErrors: [],
      modelCode: row[1]?.toString() || 'לא נבחר',
      assignmentData: assignmentData
    };
  };

  const validateWorker = (worker: PreviewWorker, existingWorker?: WorkerAfterNoon): string[] => {
    const errors: string[] = [];
    
    if (!validateIsraeliID(worker.id)) {
      errors.push('תעודת זהות לא תקינה');
    }
    
    if (worker.phone && !isValidPhone(worker.phone)) {
      errors.push('מספר טלפון לא תקין');
    }
    
    if (!worker.phone && (!existingWorker || !existingWorker.phone)) {
      errors.push('מספר טלפון חסר');
    }
    
    return errors;
  };

  const generateStatusReport = (originalData: any[], categorizedWorkers: any, importResults: any) => {
    const reportData = originalData.map((row, index) => {
      const workerId = row[3]?.toString()?.trim() || '';
      const worker = allWorkers.find(w => w.id === workerId);
      
      let status = 'לא עובד';
      let details = '';
      
      if (!worker) {
        status = 'לא נבדק';
        details = 'העובד לא נבדק';
      } else if (worker.isInvalid) {
        status = 'שגיאה';
        details = worker.validationErrors?.join(', ') || 'שגיאה לא ידועה';
      } else if (worker.isDuplicate) {
        if (worker.isBestDuplicate) {
          status = 'יובא בהצלחה';
          details = 'עובד כפול - נבחרה השורה המלאה ביותר';
        } else {
          status = 'לא יובא';
          details = 'עובד כפול - שורה לא נבחרה';
        }
      } else if (worker.isExisting) {
        if (importDecisions.existingWorkers.includes(worker.id)) {
          status = 'עודכן בהצלחה';
          details = 'עובד קיים - עודכן';
        } else {
          status = 'לא עודכן';
          details = 'עובד קיים - לא עודכן';
        }
      } else if (worker.isUnrecognizedSymbol) {
        if (importDecisions.unrecognizedSymbols.includes(worker.id)) {
          status = 'יובא בהצלחה';
          details = 'עובד חדש עם סמל לא מוכר';
        } else {
          status = 'לא יובא';
          details = 'עובד חדש עם סמל לא מוכר - לא אושר';
        }
      } else if (worker.isNew) {
        status = 'יובא בהצלחה';
        details = 'עובד חדש';
      }
      
      return [
        row[0] || '', 
        row[1] || '', 
        row[2] || '', 
        row[3] || '', 
        row[4] || '', 
        row[5] || '', 
        row[6] || '', 
        row[7] || '', 
        row[8] || '', 
        row[9] || '', 
        row[10] || '', 
        row[11] || '', 
        status, 
        details 
      ];
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        'סמל מוסד',
        'מודל',
        'שם תפקיד',
        'תעודת זהות',
        'שם משפחה',
        'שם פרטי',
        'טלפון',
        'אימייל',
        'תאריך התחלה',
        'תאריך סיום',
        'סטטוס',
        'טופס 101',
        'סטטוס ייבוא',
        'פרטי סטטוס'
      ],
      ...reportData
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'דוח ייבוא');
    
    const fileName = `דוח_ייבוא_עובדים_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return fileName;
  };

  const categorizeWorkers = (workers: PreviewWorker[]) => {
    const categorized = {
      newWorkersWithSymbol: [] as PreviewWorker[],
      newWorkersUnrecognizedSymbol: [] as PreviewWorker[],
      newWorkersWithoutSymbol: [] as PreviewWorker[],
      invalidWorkers: [] as PreviewWorker[],
      existingWorkers: [] as PreviewWorker[],
      duplicateWorkers: [] as PreviewWorker[]
    };

    const idCounts = new Map<string, number>();
    workers.forEach(worker => {
      const count = idCounts.get(worker.id) || 0;
      idCounts.set(worker.id, count + 1);
    });

    const duplicateGroups = new Map<string, PreviewWorker[]>();
    
    workers.forEach(worker => {
      const count = idCounts.get(worker.id) || 0;
      if (count > 1) {
        worker.isDuplicate = true;
        worker.validationErrors = worker.validationErrors || [];
        worker.validationErrors.push(`תעודת זהות ${worker.id} מופיעה ${count} פעמים בקובץ`);

        if (!duplicateGroups.has(worker.id)) {
          duplicateGroups.set(worker.id, []);
        }
        duplicateGroups.get(worker.id)!.push(worker);
      }
    });

    
    duplicateGroups.forEach((group, id) => {
      let bestRow = group[0];
      let maxFields = 0;

      group.forEach(worker => {
        const filledFields = [
          worker.firstName,
          worker.lastName,
          worker.phone,
          worker.email,
          worker.workingSymbol,
          worker.assignmentData?.roleName,
          worker.status
        ].filter(field => field && field !== '' && field !== 'לא נבחר').length;

        if (filledFields > maxFields) {
          maxFields = filledFields;
          bestRow = worker;
        }
      });

      
      const allSymbols = [...new Set(group.map(w => w.workingSymbol).filter((s): s is string => !!s))];
      
      
      group.forEach(worker => {
        if (worker === bestRow) {
          worker.isBestDuplicate = true;
          worker.allSymbols = allSymbols; 
          worker.validationErrors = worker.validationErrors || [];
          worker.validationErrors.push(`שורה זו נבחרה לייבוא (הכי מלאה בפרטים). העובד ישויך לסמלים: ${allSymbols.join(', ')}`);
        }
      });
    });

    
    
    workers.forEach(worker => {
      
      if (worker.isDuplicate) {
        
        if (worker.isBestDuplicate) {
          const existingWorker = existingWorkers.find(w => w.id === worker.id);
          if (existingWorker) {
            worker.isExisting = true;
            worker.existingWorker = existingWorker;
            
            const changes = {
              before: { ...existingWorker },
              after: { ...existingWorker }
            };
            
            
            const currentSymbols = getCurrentSymbolsForWorker(worker.id, classes, workerAssignments, selectedProjects);
            const importedSymbols = worker.allSymbols && worker.allSymbols.length > 0
              ? worker.allSymbols
              : worker.workingSymbol ? [worker.workingSymbol] : [];
            const symbolsChanged =
              currentSymbols.length !== importedSymbols.length ||
              currentSymbols.some(s => !importedSymbols.includes(s)) ||
              importedSymbols.some(s => !currentSymbols.includes(s));

            const hasChanges = 
              normalize(existingWorker.phone) !== normalize(worker.phone) ||
              normalize(existingWorker.email) !== normalize(worker.email) ||
              normalize(existingWorker.status) !== normalize(worker.status) ||
              normalize(existingWorker.firstName) !== normalize(worker.firstName) ||
              normalize(existingWorker.lastName) !== normalize(worker.lastName) ||
              symbolsChanged ||
              !!existingWorker.is101 !== !!worker.is101;
            
            if (hasChanges) {
              worker.changes = changes;
              categorized.existingWorkers.push(worker); 
            }
          } else {
            const validationErrors = validateWorker(worker);
            if (validationErrors.length > 0) {
              worker.validationErrors = validationErrors;
              worker.isInvalid = true;
              categorized.invalidWorkers.push(worker);
              return;
            }

            worker.isNew = true;
            
            if (worker.workingSymbol) {
              const classId = findClassIdBySymbol(worker.workingSymbol);
              if (classId) {
                categorized.newWorkersWithSymbol.push(worker);
              } else {
                worker.isUnrecognizedSymbol = true;
                categorized.newWorkersUnrecognizedSymbol.push(worker);
              }
            } else {
              categorized.newWorkersWithoutSymbol.push(worker);
            }
          }
        } else {
          categorized.duplicateWorkers.push(worker);
        }
        return;
      }

      const existingWorker = existingWorkers.find(w => w.id === worker.id);
      
      if (existingWorker) {
        worker.isExisting = true;
        worker.existingWorker = existingWorker;
        
        const changes = {
          before: { ...existingWorker },
          after: { ...existingWorker }
        };
        
        
        const currentSymbols = getCurrentSymbolsForWorker(worker.id, classes, workerAssignments, selectedProjects);
        const importedSymbols = worker.allSymbols && worker.allSymbols.length > 0
          ? worker.allSymbols
          : worker.workingSymbol ? [worker.workingSymbol] : [];
        const symbolsChanged =
          currentSymbols.length !== importedSymbols.length ||
          currentSymbols.some(s => !importedSymbols.includes(s)) ||
          importedSymbols.some(s => !currentSymbols.includes(s));

        const hasChanges = 
          normalize(existingWorker.phone) !== normalize(worker.phone) ||
          normalize(existingWorker.email) !== normalize(worker.email) ||
          normalize(existingWorker.status) !== normalize(worker.status) ||
          normalize(existingWorker.firstName) !== normalize(worker.firstName) ||
          normalize(existingWorker.lastName) !== normalize(worker.lastName) ||
          symbolsChanged ||
          !!existingWorker.is101 !== !!worker.is101;
        
        if (hasChanges) {
          worker.changes = changes;
          categorized.existingWorkers.push(worker); 
        }
        return;
      }

      const validationErrors = validateWorker(worker);
      if (validationErrors.length > 0) {
        worker.validationErrors = validationErrors;
        worker.isInvalid = true;
        categorized.invalidWorkers.push(worker);
        return;
      }

      worker.isNew = true;
      
      if (worker.workingSymbol) {
        const classId = findClassIdBySymbol(worker.workingSymbol);
        if (classId) {
          categorized.newWorkersWithSymbol.push(worker);
        } else {
          worker.isUnrecognizedSymbol = true;
          categorized.newWorkersUnrecognizedSymbol.push(worker);
        }
      } else {
        categorized.newWorkersWithoutSymbol.push(worker);
      }
    });

    return categorized;
  };

  const handleProjectSelection = (projectValue: number) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectValue)) {
        return prev.filter(p => p !== projectValue);
      } else {
        return [...prev, projectValue];
      }
    });
  };

  const downloadTemplate = () => {
    const templateData = [
      [
        'סמל מוסד',
        'מודל',
        'שם תפקיד',
        'תעודת זהות',
        'שם משפחה',
        'שם פרטי',
        'טלפון',
        'אימייל',
        'תאריך התחלה',
        'תאריך סיום',
        'סטטוס',
        'טופס 101'
      ],
      [
        '123',
        'דוגמה מודל',
        'מורה',
        '123456789',
        'כהן',
        'יוסי',
        '050-1234567',
        'yossi@example.com',
        '01/09/2024',
        '31/08/2025',
        'פעיל',
        'כן'
      ]
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    const wscols = [
      { wch: 12 }, // סמל מוסד
      { wch: 12 }, // מודל
      { wch: 15 }, // שם תפקיד
      { wch: 12 }, // תעודת זהות
      { wch: 12 }, // שם משפחה
      { wch: 12 }, // שם פרטי
      { wch: 13 }, // טלפון
      { wch: 20 }, // אימייל
      { wch: 12 }, // תאריך התחלה
      { wch: 12 }, // תאריך סיום
      { wch: 10 }, // סטטוס
      { wch: 10 }  // טופס 101
    ];
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'תבנית עובדים');
    
    const fileName = `תבנית_ייבוא_עובדים_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, header: 1 }) as any[];

        const dataRows = jsonData.slice(1);
        const filteredData = dataRows.filter(row => {
          const id = row[3]?.toString()?.trim(); 
          const firstName = row[5]?.toString()?.trim(); 
          const lastName = row[4]?.toString()?.trim(); 
          
          return id && firstName && lastName && id !== '' && firstName !== '' && lastName !== '';
        });

        setOriginalExcelData(dataRows);

        const workers: PreviewWorker[] = filteredData.map(row => {
          try {
            return convertExcelRowToWorker(row);
          } catch (error) {
            return { 
              id: row[5]?.toString() || '', 
              firstName: row[7] || '', 
              lastName: row[6] || '', 
              isActive: false,
              validationErrors: ['שגיאה בעיבוד השורה']
            } as PreviewWorker;
          }
        });

        setAllWorkers(workers);
        setActiveStep(2);
      } catch (err) {
        console.error('Error reading Excel file:', err);
        alert(err instanceof Error ? err.message : 'שגיאה בקריאת הקובץ');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const categorizedWorkers = useMemo(() => {
    return categorizeWorkers(allWorkers);
  }, [allWorkers, selectedProjects, existingWorkers, workerAssignments, classes]);

  const importSummary: ImportSummary = useMemo(() => ({
    totalWorkers: allWorkers.length,
    newWorkersWithSymbol: categorizedWorkers.newWorkersWithSymbol.length,
    newWorkersUnrecognizedSymbol: categorizedWorkers.newWorkersUnrecognizedSymbol.length,
    newWorkersWithoutSymbol: categorizedWorkers.newWorkersWithoutSymbol.length,
    invalidWorkers: categorizedWorkers.invalidWorkers.length,
    existingWorkers: categorizedWorkers.existingWorkers.length,
    updatedWorkers: categorizedWorkers.existingWorkers.length,
    duplicateWorkers: categorizedWorkers.duplicateWorkers.length
  }), [categorizedWorkers]);

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      const cleanWorkerData = (worker: PreviewWorker) => {
        const { 
          workingSymbol, 
          allSymbols, 
          isDuplicate, 
          isBestDuplicate, 
          isNew, 
          isExisting, 
          isInvalid, 
          isUnrecognizedSymbol, 
          validationErrors, 
          existingWorker, 
          changes,
          assignmentData, 
          ...cleanData 
        } = worker;
        
        return {
          ...cleanData,
          phone: normalizePhone(worker.phone),
          isAfterNoon: false,
          isBaseWorker: false,
          isHanukaCamp: false,
          isPassoverCamp: false,
          isSummerCamp: false,
          startDate: new Date(),
          endDate: new Date(),
          roleName: 'לא נבחר'
        };
      };

      const newWorkersWithSymbol = categorizedWorkers.newWorkersWithSymbol.map(cleanWorkerData);

      const newWorkersUnrecognizedSymbol = categorizedWorkers.newWorkersUnrecognizedSymbol
        .filter(worker => importDecisions.unrecognizedSymbols.includes(worker.id))
        .map(cleanWorkerData);

      const newWorkersWithoutSymbol = categorizedWorkers.newWorkersWithoutSymbol.map(cleanWorkerData);

      const invalidWorkers = categorizedWorkers.invalidWorkers
        .filter(worker => importDecisions.invalidWorkers.includes(worker.id))
        .map(cleanWorkerData);

      const duplicateWorkers = categorizedWorkers.duplicateWorkers
        .filter(worker => worker.isBestDuplicate)
        .map(cleanWorkerData);

      const allNewWorkers = [
        ...newWorkersWithSymbol,
        ...newWorkersUnrecognizedSymbol,
        ...newWorkersWithoutSymbol,
        ...invalidWorkers,
        ...duplicateWorkers
      ];

      const existingWorkerIds = new Set(categorizedWorkers.existingWorkers.map(w => w.id));
      const workersToImport = allNewWorkers.filter(worker => !existingWorkerIds.has(worker.id));

      if (workersToImport.length > 0) {
        const savedWorkers = await addMultipleWorkersMutation.mutateAsync(workersToImport);
        
        const assignmentsToCreate: any[] = [];
        
        for (let i = 0; i < savedWorkers.length; i++) {
          const savedWorker = savedWorkers[i];
          let originalWorker: PreviewWorker | undefined;
          let workerIndex = 0;
          
          for (const category of [
            categorizedWorkers.newWorkersWithSymbol,
            categorizedWorkers.newWorkersUnrecognizedSymbol.filter(w => importDecisions.unrecognizedSymbols.includes(w.id)),
            categorizedWorkers.newWorkersWithoutSymbol,
            categorizedWorkers.invalidWorkers.filter(w => importDecisions.invalidWorkers.includes(w.id)),
            categorizedWorkers.duplicateWorkers.filter(w => w.isBestDuplicate)
          ].filter(cat => cat.filter(w => !existingWorkerIds.has(w.id)))) {
            if (workerIndex + category.length > i) {
              originalWorker = category[i - workerIndex];
              break;
            }
            workerIndex += category.length;
          }
          
          if (!originalWorker) continue;
          
          const symbols = originalWorker.allSymbols && originalWorker.allSymbols.length > 0
            ? originalWorker.allSymbols
            : originalWorker.workingSymbol ? [originalWorker.workingSymbol] : [];
            
          for (const symbol of symbols) {
            const classObj = classes.find((c: Class) => c.uniqueSymbol === symbol);
            if (classObj) {
              for (const projectCode of selectedProjects) {
                const assignment = {
                  workerId: savedWorker._id,
                  classId: classObj._id,
                  projectCode: projectCode,
                  roleName: originalWorker.assignmentData?.roleName || 'לא נבחר',
                  startDate: originalWorker.assignmentData?.startDate || new Date(),
                  endDate: originalWorker.assignmentData?.endDate,
                  updateBy: 'מערכת'
                };
                assignmentsToCreate.push(assignment);
              }
            }
          }
        }
        
        if (assignmentsToCreate.length > 0) {
          await createMultipleAssignmentsMutation.mutateAsync(assignmentsToCreate);
        }
      }

      const existingWorkerAssignments: any[] = [];
      
      for (const worker of categorizedWorkers.existingWorkers) {
        if (importDecisions.existingWorkers.includes(worker.id) && worker.changes) {
          await updateWorkerMutation.mutateAsync({
            id: worker.existingWorker!._id,
            data: {
              phone: normalizePhone(worker.phone)
            }
          });
          
          const symbols = worker.allSymbols && worker.allSymbols.length > 0
            ? worker.allSymbols
            : worker.workingSymbol ? [worker.workingSymbol] : [];
            
          for (const symbol of symbols) {
            const classObj = classes.find((c: Class) => c.uniqueSymbol === symbol);
            if (classObj) {
              for (const projectCode of selectedProjects) {
                try {
                  const assignmentExists = await checkAssignmentExistsMutation.mutateAsync({
                    workerId: worker.existingWorker!._id,
                    classId: classObj._id,
                    projectCode: projectCode
                  });
                  
                  if (!assignmentExists) {
                    const assignment = {
                      workerId: worker.existingWorker!._id,
                      classId: classObj._id,
                      projectCode: projectCode,
                      roleName: worker.assignmentData?.roleName || 'לא נבחר',
                      startDate: worker.assignmentData?.startDate || new Date(),
                      endDate: worker.assignmentData?.endDate,
                      updateBy: 'מערכת'
                    };
                    existingWorkerAssignments.push(assignment);
                  }
                } catch (error) {
                  console.error('Error checking assignment existence:', error);
                }
              }
            }
          }
        }
      }
      
      if (existingWorkerAssignments.length > 0) {
        await createMultipleAssignmentsMutation.mutateAsync(existingWorkerAssignments);
      }

      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });

      try {
        const fileName = generateStatusReport(originalExcelData, categorizedWorkers, { success: true });
        alert(`הייבוא הושלם בהצלחה! דוח יורד: ${fileName}`);
      } catch (reportError) {
        console.error('Error generating report:', reportError);
        alert('הייבוא הושלם בהצלחה! שגיאה ביצירת הדוח');
      }
      
      if (isMountedRef.current) {
        setActiveStep(0);
        setAllWorkers([]);
        setOriginalExcelData([]);
        setSelectedProjects([]);
        setSelectedFile(null);
        setImportDecisions({
          unrecognizedSymbols: [],
          invalidWorkers: [],
          existingWorkers: []
        });
      }
    } catch (error) {
      console.error('Error importing workers:', error);
      
      try {
        const fileName = generateStatusReport(originalExcelData, categorizedWorkers, { success: false, error: error });
        alert(`שגיאה בייבוא העובדים! דוח יורד: ${fileName}`);
      } catch (reportError) {
        console.error('Error generating report:', reportError);
        alert('שגיאה בייבוא העובדים! שגיאה ביצירת הדוח');
      }
    } finally {
      if (isMountedRef.current) {
        setIsImporting(false);
      }
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Card>
            <CardHeader 
              title="בחירת פרויקטים לייבוא" 
              subheader="בחר את הפרויקטים שייוחסו לעובדים שייובאו"
            />
            <CardContent>
              <Typography variant="body1" gutterBottom>
                העובדים שייובאו ייוחסו לפרויקטים הבאים:
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                {projectTypes.map((project) => (
                  <FormControlLabel
                    key={project.value}
                    control={
                      <Checkbox
                        checked={selectedProjects.includes(project.value)}
                        onChange={() => handleProjectSelection(project.value)}
                      />
                    }
                    label={project.label}
                  />
                ))}
              </Box>
              
              {selectedProjects.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary.contrastText">
                    פרויקטים נבחרים: {selectedProjects.map(p => 
                      projectTypes.find(pt => pt.value === p)?.label
                    ).join(', ')}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                  disabled={selectedProjects.length === 0}
                  startIcon={<UploadIcon />}
                >
                  המשך להעלאת קובץ
                </Button>
              </Box>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader 
              title="העלאת קובץ אקסל" 
              subheader="העלה קובץ אקסל עם נתוני עובדים"
            />
            <CardContent>
              <Typography variant="body1" gutterBottom>
                הקובץ צריך להכיל את העמודות הבאות בסדר הזה:
              </Typography>
              
              <Box component="ol" sx={{ pl: 2 }}>
                <li>סמל מוסד</li>
                <li>מודל</li>
                <li>שם תפקיד</li>
                <li>תעודת זהות</li>
                <li>שם משפחה</li>
                <li>שם פרטי</li>
                <li>טלפון</li>
                <li>אימייל</li>
                <li>תאריך התחלה</li>
                <li>תאריך סיום</li>
                <li>סטטוס</li>
                <li>טופס 101</li>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>הערה:</strong> סדר העמודות חשוב! ודא שהעמודות בקובץ שלך מופיעות בדיוק בסדר הזה.
                </Typography>
              </Alert>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={downloadTemplate}
                  startIcon={<DownloadIcon />}
                >
                  הורד תבנית אקסל
                </Button>
                
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'מעבד קובץ...' : 'בחר קובץ אקסל'}
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </Button>
              </Box>
              
              {selectedFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    קובץ נבחר: {selectedFile.name}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardHeader title="סיכום נתונים" />
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">{importSummary.totalWorkers}</Typography>
                    <Typography variant="body2">סך הכל עובדים</Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                    <Typography variant="h4" color="success.contrastText">{importSummary.newWorkersWithSymbol}</Typography>
                    <Typography variant="body2">עובדים חדשים עם סמל מוכר</Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                    <Typography variant="h4" color="warning.contrastText">{importSummary.newWorkersUnrecognizedSymbol}</Typography>
                    <Typography variant="body2">עובדים חדשים עם סמל לא מוכר</Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                    <Typography variant="h4" color="info.contrastText">{importSummary.newWorkersWithoutSymbol}</Typography>
                    <Typography variant="body2">עובדים חדשים ללא סמל</Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                    <Typography variant="h4" color="error.contrastText">{importSummary.invalidWorkers}</Typography>
                    <Typography variant="body2">עובדים לא תקינים</Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light' }}>
                    <Typography variant="h4" color="secondary.contrastText">{importSummary.existingWorkers}</Typography>
                    <Typography variant="body2">עובדים קיימים</Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light' }}>
                    <Typography variant="h4" color="secondary.contrastText">{importSummary.updatedWorkers}</Typography>
                    <Typography variant="body2">עובדים לעדכון</Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                    <Typography variant="h4" color="error.contrastText">{importSummary.duplicateWorkers}</Typography>
                    <Typography variant="body2">עובדים כפולים</Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>

            {categorizedWorkers.newWorkersWithSymbol.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="h6">
                      עובדים חדשים עם סמל מוכר ({categorizedWorkers.newWorkersWithSymbol.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <WorkersTable workers={categorizedWorkers.newWorkersWithSymbol} showRole={true} />
                </AccordionDetails>
              </Accordion>
            )}

            {categorizedWorkers.newWorkersUnrecognizedSymbol.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    <Typography variant="h6">
                      עובדים חדשים עם סמל לא מוכר ({categorizedWorkers.newWorkersUnrecognizedSymbol.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    עובדים אלו יש להם סמל שלא קיים במערכת. הם יישמרו ללא קישור לכיתה.
                  </Alert>
                  <WorkersTable 
                    workers={categorizedWorkers.newWorkersUnrecognizedSymbol}
                    showImportDecision={true}
                    onImportDecision={(workerId, shouldImport) => {
                      setImportDecisions(prev => ({
                        ...prev,
                        unrecognizedSymbols: shouldImport 
                          ? [...prev.unrecognizedSymbols, workerId]
                          : prev.unrecognizedSymbols.filter(id => id !== workerId)
                      }));
                    }}
                    importDecisions={importDecisions.unrecognizedSymbols}
                    showRole={true}
                  />
                </AccordionDetails>
              </Accordion>
            )}


            {categorizedWorkers.newWorkersWithoutSymbol.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="info" />
                    <Typography variant="h6">
                      עובדים חדשים ללא סמל ({categorizedWorkers.newWorkersWithoutSymbol.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    עובדים אלו יישמרו במערכת ללא קישור לכיתה.
                  </Alert>
                  <WorkersTable workers={categorizedWorkers.newWorkersWithoutSymbol} />
                </AccordionDetails>
              </Accordion>
            )}


            {categorizedWorkers.duplicateWorkers.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon color="error" />
                    <Typography variant="h6">
                      עובדים כפולים ({categorizedWorkers.duplicateWorkers.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    עובדים אלו מופיעים יותר מפעם אחת בקובץ האקסל. השורות המודגשות בצבע ירוק נבחרו לייבוא (הכי מלאות בפרטים).
                  </Alert>
                  <WorkersTable 
                    workers={categorizedWorkers.duplicateWorkers}
                    showValidationErrors={true}
                    showDuplicateHighlight={true}
                    showRole={true}
                  />
                </AccordionDetails>
              </Accordion>
            )}


            {categorizedWorkers.invalidWorkers.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon color="error" />
                    <Typography variant="h6">
                      עובדים לא תקינים ({categorizedWorkers.invalidWorkers.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    עובדים אלו מכילים שגיאות שעלולות לגרום לבעיות בשמירה.
                  </Alert>
                  <WorkersTable 
                    workers={categorizedWorkers.invalidWorkers}
                    showImportDecision={true}
                    onImportDecision={(workerId, shouldImport) => {
                      setImportDecisions(prev => ({
                        ...prev,
                        invalidWorkers: shouldImport 
                          ? [...prev.invalidWorkers, workerId]
                          : prev.invalidWorkers.filter(id => id !== workerId)
                      }));
                    }}
                    importDecisions={importDecisions.invalidWorkers}
                    showValidationErrors={true}
                  />
                </AccordionDetails>
              </Accordion>
            )}


            {categorizedWorkers.existingWorkers.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UpdateIcon color="warning" />
                    <Typography variant="h6">
                      עובדים לעדכון ({categorizedWorkers.existingWorkers.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    עובדים אלו קיימים במערכת ויש עדכונים לפרטיהם או לפרויקטים.
                  </Alert>
                  <WorkersTable 
                    workers={categorizedWorkers.existingWorkers}
                    showImportDecision={true}
                    onImportDecision={(workerId, shouldImport) => {
                      setImportDecisions(prev => ({
                        ...prev,
                        existingWorkers: shouldImport 
                          ? [...prev.existingWorkers, workerId]
                          : prev.existingWorkers.filter(id => id !== workerId)
                      }));
                    }}
                    importDecisions={importDecisions.existingWorkers}
                    showChanges={true}
                    selectedProjects={selectedProjects}
                    workerAssignments={workerAssignments}
                  />
                </AccordionDetails>
              </Accordion>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
              >
                חזור
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  try {
                    const fileName = generateStatusReport(originalExcelData, categorizedWorkers, { preview: true });
                    alert(`דוח יורד: ${fileName}`);
                  } catch (error) {
                    console.error('Error generating preview report:', error);
                    alert('שגיאה ביצירת הדוח');
                  }
                }}
                startIcon={<RefreshIcon />}
              >
                יצירת דוח מקדים
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
                startIcon={<SaveIcon />}
              >
                המשך לאישור ייבוא
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Card>
            <CardHeader 
              title="אישור ייבוא" 
              subheader="סקור את הנתונים ואשר את הייבוא"
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                סיכום ייבוא
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1">
                  • עובדים חדשים עם סמל מוכר: {categorizedWorkers.newWorkersWithSymbol.length}
                </Typography>
                <Typography variant="body1">
                  • עובדים חדשים עם סמל לא מוכר: {categorizedWorkers.newWorkersUnrecognizedSymbol.filter(w => 
                    importDecisions.unrecognizedSymbols.includes(w.id)
                  ).length}
                </Typography>
                <Typography variant="body1">
                  • עובדים חדשים ללא סמל: {categorizedWorkers.newWorkersWithoutSymbol.length}
                </Typography>
                <Typography variant="body1">
                  • עובדים לא תקינים: {categorizedWorkers.invalidWorkers.filter((w: PreviewWorker) => 
                    importDecisions.invalidWorkers.includes(w.id)
                  ).length}
                </Typography>
                <Typography variant="body1">
                  • עובדים לעדכון: {categorizedWorkers.existingWorkers.filter(w => 
                    importDecisions.existingWorkers.includes(w.id)
                  ).length}
                </Typography>
                <Typography variant="body1" color="error">
                  • עובדים כפולים: {categorizedWorkers.duplicateWorkers.length} (ייובאו {categorizedWorkers.duplicateWorkers.filter(w => w.isBestDuplicate).length})
                </Typography>
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  פרויקטים שייוחסו: {selectedProjects.map(p => 
                    projectTypes.find(pt => pt.value === p)?.label
                  ).join(', ')}
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(2)}
                >
                  חזור
                </Button>
                <Button
                  variant="contained"
                  onClick={handleImport}
                  disabled={isImporting}
                  startIcon={isImporting ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {isImporting ? 'מייבא...' : 'אישור וייבוא'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, maxWidth: '1000px' }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isProcessing || isImporting || isLoadingClasses}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography>
            {isProcessing ? 'מעבד קובץ...' : 
             isImporting ? 'מייבא עובדים...' : 
             isLoadingClasses ? 'טוען נתונים...' : ''}
          </Typography>
        </Box>
      </Backdrop>

      <Typography variant="h4" gutterBottom>
        ייבוא עובדים
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}
    </Container>
  );
};

interface WorkersTableProps {
  workers: PreviewWorker[];
  showImportDecision?: boolean;
  onImportDecision?: (workerId: string, shouldImport: boolean) => void;
  importDecisions?: string[];
  showValidationErrors?: boolean;
  showChanges?: boolean;
  showDuplicateHighlight?: boolean;
  selectedProjects?: number[];
  workerAssignments?: any[];
  currentProject?: number;
  showRole?: boolean;
}

const WorkersTable: React.FC<WorkersTableProps> = ({ 
  workers, 
  showImportDecision, 
  onImportDecision, 
  importDecisions = [],
  showValidationErrors,
  showChanges,
  showDuplicateHighlight,
  selectedProjects = [],
  workerAssignments = [],
  showRole = false
}) => {


  const getExistingWorkerProjectsInTable = (workerId: string): number[] => {
    if (!workerAssignments.length) return [];
    
    const projectCodes = workerAssignments
      .filter((assignment: any) => {
        const assignmentWorkerId = typeof assignment.workerId === 'object' ? assignment.workerId._id : assignment.workerId;
        return assignmentWorkerId === workerId && assignment.isActive;
      })
      .map((assignment: any) => assignment.projectCode)
      .filter((code: number, index: number, array: number[]) => array.indexOf(code) === index) 
      .sort();
        
    return projectCodes;
  };

  return (
    <TableContainer component={Paper} > 
      <Table size="small">
        <TableHead>
          <TableRow>
            {showImportDecision && <TableCell>ייבוא</TableCell>}
            <TableCell>תעודת זהות</TableCell>
            <TableCell>שם מלא</TableCell>
            <TableCell>טלפון</TableCell>
            <TableCell>אימייל</TableCell>
            <TableCell>סמל כיתה</TableCell>
            <TableCell>פרויקטים</TableCell>
            {(showChanges || showRole) && <TableCell>תפקיד</TableCell>}
            {showValidationErrors && <TableCell>שגיאות</TableCell>}
            {showChanges && <TableCell>שינויים</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {workers.map((worker, index) => (
            <TableRow 
              key={index}
              sx={{
                ...(showDuplicateHighlight && worker.isBestDuplicate && {
                  backgroundColor: 'success.light',
                  '&:hover': {
                    backgroundColor: 'success.main',
                    color: 'success.contrastText'
                  }
                })
              }}
            >
              {showImportDecision && (
                <TableCell>
                  <Checkbox
                    checked={importDecisions.includes(worker.id)}
                    onChange={(e) => onImportDecision?.(worker.id, e.target.checked)}
                  />
                </TableCell>
              )}
              <TableCell>{worker.id}</TableCell>
              <TableCell>{`${worker.firstName} ${worker.lastName}`}</TableCell>
              <TableCell>{worker.phone}</TableCell>
              <TableCell>{worker.email}</TableCell>
              <TableCell>
                {worker.isDuplicate ? (
                  worker.isBestDuplicate && worker.allSymbols ? (
                    <Box>
                      {worker.allSymbols.map((symbol, idx) => (
                        <Chip 
                          key={idx}
                          label={symbol} 
                          size="small" 
                          color="success"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Chip label="כפול" size="small" color="error" />
                  )
                ) : worker.workingSymbol ? (
                  <Chip 
                    label={worker.workingSymbol} 
                    size="small" 
                    color={worker.isUnrecognizedSymbol ? "warning" : "success"}
                  />
                ) : (
                  <Chip label="ללא סמל" size="small" color="default" />
                )}
              </TableCell>
              <TableCell>
                <Box>
                  {(() => {
                    const existingProjects = worker.existingWorker ? 
                      getExistingWorkerProjectsInTable(worker.existingWorker._id) : [];
                    return existingProjects.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          קיים:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {existingProjects.map((code, idx) => (
                            <Chip 
                              key={idx}
                              label={`פרויקט ${code}`}
                              size="small" 
                              color="default"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    );
                  })()}
                  {selectedProjects.length > 0 && (
                    <Box sx={{ mt: (() => {
                      const existingProjects = worker.existingWorker ? 
                        getExistingWorkerProjectsInTable(worker.existingWorker._id) : [];
                      return existingProjects.length > 0 ? 1 : 0;
                    })() }}>
                      <Typography variant="caption" color="success.main" fontWeight="bold">
                        חדש:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {selectedProjects.map((code, idx) => (
                          <Chip 
                            key={idx}
                            label={`פרויקט ${code} - ${worker.workingSymbol || worker.allSymbols?.join(',') || 'ללא סמל'}`}
                            size="small" 
                            color="success"
                            variant="filled"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </TableCell>
              {(showChanges || showRole) && (
                <TableCell>
                  {worker.assignmentData?.roleName || 'לא נבחר'}
                </TableCell>
              )}
              {showValidationErrors && (
                <TableCell>
                  {worker.validationErrors?.map((error, i) => (
                    <Chip key={i} label={error} size="small" color="error" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </TableCell>
              )}
              {showChanges && worker.changes && (
                <TableCell>
                  <Box>
                    {(worker.changes.before.firstName !== worker.changes.after.firstName ||
                      worker.changes.before.lastName !== worker.changes.after.lastName ||
                      worker.changes.before.phone !== worker.changes.after.phone ||
                      worker.changes.before.email !== worker.changes.after.email) && (
                      <>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                          <strong>פרטים אישיים:</strong>
                        </Typography>
                        {worker.changes.before.firstName !== worker.changes.after.firstName && (
                          <Typography variant="caption" display="block">
                            שם פרטי: {worker.changes.before.firstName} → {worker.changes.after.firstName}
                          </Typography>
                        )}
                        {worker.changes.before.lastName !== worker.changes.after.lastName && (
                          <Typography variant="caption" display="block">
                            שם משפחה: {worker.changes.before.lastName} → {worker.changes.after.lastName}
                          </Typography>
                        )}
                        {worker.changes.before.phone !== worker.changes.after.phone && (
                          <Typography variant="caption" display="block">
                            טלפון: {worker.changes.before.phone} → {worker.changes.after.phone}
                          </Typography>
                        )}
                        {worker.changes.before.email !== worker.changes.after.email && (
                          <Typography variant="caption" display="block">
                            אימייל: {worker.changes.before.email} → {worker.changes.after.email}
                          </Typography>
                        )}
                      </>
                    )}
                    

                    {(
                      normalize(worker.existingWorker?.roleName) !== normalize(worker.assignmentData?.roleName) ||
                      worker.changes.before.status !== worker.changes.after.status ||
                      worker.changes.before.is101 !== worker.changes.after.is101) && (
                      <>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                          <strong>פרטי תפקיד:</strong>
                        </Typography>

                        {normalize(worker.existingWorker?.roleName) !== normalize(worker.assignmentData?.roleName) && (
                          <Typography variant="caption" display="block">
                            שם תפקיד: {worker.existingWorker?.roleName || 'לא נבחר'} → {worker.assignmentData?.roleName || 'לא נבחר'}
                          </Typography>
                        )}
                        {worker.changes.before.status !== worker.changes.after.status && (
                          <Typography variant="caption" display="block">
                            סטטוס: {worker.changes.before.status} → {worker.changes.after.status}
                          </Typography>
                        )}
                        {worker.changes.before.is101 !== worker.changes.after.is101 && (
                          <Typography variant="caption" display="block">
                            תעודה 101: {worker.changes.before.is101 ? 'כן' : 'לא'} → {worker.changes.after.is101 ? 'כן' : 'לא'}
                          </Typography>
                        )}
                      </>
                    )}
                    {worker.changes.before.workingSymbol !== worker.changes.after.workingSymbol && (
                      <Typography variant="caption" display="block">
                        סמל כיתה: {worker.changes.before.workingSymbol || 'אין'} → {worker.changes.after.workingSymbol || 'אין'}
                      </Typography>
                    )}
                    {(worker.changes.before.symbols || worker.changes.after.symbols) &&
                      JSON.stringify(worker.changes.before.symbols?.sort() || []) !== JSON.stringify(worker.changes.after.symbols?.sort() || []) && (
                        <Typography variant="caption" display="block">
                          סמלים: {worker.changes.before.symbols?.join(', ') || 'אין'} → {worker.changes.after.symbols?.join(', ') || 'אין'}
                        </Typography>
                      )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default WorkersImportPage; 