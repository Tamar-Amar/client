import React, { useState, useMemo } from 'react';
import {
  Box, TableBody, TableCell, 
  TableHead, TableRow, Paper, TextField, Select,
  MenuItem, InputLabel, FormControl, Stack, Typography,
  Chip,
  IconButton,
  Tooltip,
  Autocomplete,
  Button,
  Grid,
  Card,
  CardContent,
  TablePagination
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useFetchAllPersonalDocuments, useUpdateDocumentStatus, useUploadDocument } from '../../queries/useDocuments';
import { useFetchAllWorkersAfterNoon } from '../../queries/workerAfterNoonQueries';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { DocumentStatus } from '../../types/Document';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Class, WorkerAfterNoon } from '../../types';
import { useFetchAllUsers } from '../../queries/useUsers';
import { useFetchClasses } from '../../queries/classQueries';
import { useNavigate } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import DownloadReportDialog from './DownloadReportDialog';
import UploadDocumentDialog from './UploadDocumentDialog';
import {
  StyledTable,
  StatCard,
  DownloadCard,
  DownloadCardContent,
  SmallTypography,
  TableContainerBox,
  FilterChip,
  ActionButton,
  StatusApprovedTypography,
  StatusRejectedTypography,
  MainContainer,
  FilterCard,
  FilterHeader,
  FilterTitle,
  FilterDivider,
  FilterIcon,
  UploadIcon,
  StyledTableRow,
  EmptyTableCell,
  UploadButton,
  ItalicTypography,
  CenteredCardContent,
  BoldTypography,
  ClickableText,
} from './AllDocumentsTable.styles';

const ROWS_PER_PAGE = 15;

const getStatusChip = (status: DocumentStatus) => {
  switch (status) {
    case DocumentStatus.APPROVED:
      return <StatusApprovedTypography variant="body2">מאושר</StatusApprovedTypography>;
    case DocumentStatus.REJECTED:
      return <StatusRejectedTypography variant="body2">נדחה</StatusRejectedTypography>;
    case DocumentStatus.PENDING:
      return null;
    default:
      return null;
  }
};

const getRequiredDocumentsForWorker = (worker: WorkerAfterNoon) => {
  const baseDocuments = ['אישור משטרה', 'חוזה', 'תעודת זהות'];
  
  // תעודת השכלה נדרשת רק עבור מובילים ורכזים
  if (worker.roleName && (worker.roleName.includes('מוביל') || worker.roleName.includes('רכז'))) {
    // אם התפקיד הוא רכז - צריך גם אישור וותק
    if (worker.roleName.includes('רכז')) {
      return [...baseDocuments, 'תעודת השכלה', 'אישור וותק'];
    }
    // אם התפקיד הוא מוביל - רק תעודת השכלה
    return [...baseDocuments, 'תעודת השכלה'];
  }
  
  // אחרת - רק מסמכים בסיסיים
  return baseDocuments;
};

const AllDocumentsTable: React.FC = () => {
  const navigate = useNavigate();
  const { data: personalDocuments = [], isLoading: isLoadingPersonalDocs } = useFetchAllPersonalDocuments();
  const { data: workers = [], isLoading: isLoadingWorkers } = useFetchAllWorkersAfterNoon();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateDocumentStatus();
  const { mutate: uploadDocument, isPending: isUploading } = useUploadDocument();
  const { data: users = [] } = useFetchAllUsers();
  const { data: classes = [], isLoading: isLoadingClasses } = useFetchClasses();

  // Basic filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('');
  const [filterProject, setFilterProject] = useState('');
  const [filterAccountant, setFilterAccountant] = useState('');
  
  // Advanced filters
  const [filterInstitutionCode, setFilterInstitutionCode] = useState('');
  const [filterClassCode, setFilterClassCode] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  // Upload dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ workerId: string; workerName: string; workerTz: string; tag: string } | null>(null);
  const [manualUploadData, setManualUploadData] = useState<{ worker: WorkerAfterNoon | null; tag: string }>({ worker: null, tag: '' });
  const [page, setPage] = useState(0);

  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

  const workerDocumentsData = useMemo(() => {
    const workerMap = new Map<string, { worker: WorkerAfterNoon; docs: { [key: string]: any } }>();
    workers.forEach(w => {
      workerMap.set(w._id, { worker: w, docs: {} });
    });

    personalDocuments.forEach(doc => {
      if (workerMap.has(doc.operatorId)) {
        const entry = workerMap.get(doc.operatorId)!;
        entry.docs[doc.tag] = doc;
      }
    });
    return Array.from(workerMap.values());
  }, [workers, personalDocuments]);

  const PROJECT_OPTIONS = [
    { value: '', label: 'הכל' },
    { value: '1', label: 'צהרון שוטף 2025' },
    { value: '2', label: 'קייטנת חנוכה 2025' },
    { value: '3', label: 'קייטנת פסח 2025' },
    { value: '4', label: 'קייטנת קיץ 2025' },
  ];

  // אפשרויות קודי מוסד עם שמות
  const institutionOptions = useMemo(() => {
    const institutionMap = new Map<string, { code: string; name: string }>();
    classes.forEach((cls: Class) => {
      if (cls.institutionCode && cls.institutionName) {
        institutionMap.set(cls.institutionCode, { 
          code: cls.institutionCode, 
          name: cls.institutionName 
        });
      }
    });
    return [
      { value: '', label: 'הכל' },
      ...Array.from(institutionMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(institution => ({ 
          value: institution.code, 
          label: `${institution.code} - ${institution.name}` 
        }))
    ];
  }, [classes]);

  // אפשרויות סמלי כיתה עם שמות
  const classCodeOptions = useMemo(() => {
    const classMap = new Map<string, { symbol: string; name: string }>();
    classes.forEach((cls: Class) => {
      if (cls.uniqueSymbol && cls.name) {
        classMap.set(cls.uniqueSymbol, { 
          symbol: cls.uniqueSymbol, 
          name: cls.name 
        });
      }
    });
    return [
      { value: '', label: 'הכל' },
      ...Array.from(classMap.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(classItem => ({ 
          value: classItem.symbol, 
          label: `${classItem.symbol} - ${classItem.name}` 
        }))
    ];
  }, [classes]);

  // אפשרויות תפקידים
  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    workers.forEach(worker => {
      if (worker.roleName) {
        // נרמול התפקיד - הסרת רווחים מיותרים ותווי בלתי נראים
        const normalizedRole = worker.roleName.trim();
        if (normalizedRole) {
          roles.add(normalizedRole);
        }
      }
    });
    return [
      { value: '', label: 'כל התפקידים' },
      ...Array.from(roles).sort().map(role => ({ value: role, label: role }))
    ];
  }, [workers]);

  // אפשרויות חשבי שכר מתוך המשתמשים
  const accountantUserOptions = useMemo(() => {
    return [
      { value: '', label: 'כל חשבי השכר', accountant: null },
      ...users
        .filter((u: any) => u.role === 'accountant')
        .map((u: any) => ({
          value: u._id,
          label: `${u.firstName} ${u.lastName}`,
          accountant: u
        }))
    ];
  }, [users]);

  const filteredData = useMemo(() => {
    let filtered = workerDocumentsData.filter(({ worker, docs }) => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = !searchTerm ||
      (`${worker.lastName} ${worker.firstName}`.toLowerCase().includes(searchLower) ||
       (worker.id || '').toLowerCase().includes(searchLower) ||
       (worker.email || '').toLowerCase().includes(searchLower) ||
       (worker.phone || '').toLowerCase().includes(searchLower));
    
      const projectMatch = !filterProject || (worker.projectCodes && worker.projectCodes.includes(parseInt(filterProject)));
      
      // סינון לפי חשב שכר
      let accountantMatch = true;
      if (filterAccountant) {
        const accountant = users.find((u: any) => u._id === filterAccountant && u.role === 'accountant');
        if (accountant && Array.isArray(accountant.accountantInstitutionCodes) && classes.length > 0) {
          const workerClasses = classes.filter((cls: any) =>
            Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
          );
          const workerInstitutionCodes = workerClasses.map((cls: any) => cls.institutionCode);
          accountantMatch = workerInstitutionCodes.some((code: string) => accountant.accountantInstitutionCodes.includes(code));
        } else {
          accountantMatch = false;
        }
      }

      // סינון לפי קוד מוסד
      let institutionMatch = true;
      if (filterInstitutionCode) {
        const workerClasses = classes.filter((cls: any) =>
          Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
        );
        institutionMatch = workerClasses.some((cls: any) => cls.institutionCode === filterInstitutionCode);
      }

      // סינון לפי סמל כיתה
      let classCodeMatch = true;
      if (filterClassCode) {
        const workerClasses = classes.filter((cls: Class) =>
          Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
        );
        classCodeMatch = workerClasses.some((cls: Class) => cls.uniqueSymbol === filterClassCode);
      }

      // סינון לפי תפקיד
      const roleMatch = !filterRole || worker.roleName === filterRole;

      if (!nameMatch || !projectMatch || !accountantMatch || !institutionMatch || !classCodeMatch || !roleMatch) return false;

      if (filterStatus) {
        return Object.values(docs).some(doc => doc.status === filterStatus);
      }
      return true;
    });
    return filtered;
  }, [workerDocumentsData, searchTerm, filterStatus, filterProject, filterAccountant, filterInstitutionCode, filterClassCode, filterRole, users, classes]);

  const paginatedData = useMemo(() => {
    return filteredData.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);
  }, [filteredData, page]);
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // סטטיסטיקות מותאמות לסינון
  const filteredWorkers = workers.filter(worker => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = !searchTerm ||
      (`${worker.lastName} ${worker.firstName}`.toLowerCase().includes(searchLower) ||
       (worker.id || '').toLowerCase().includes(searchLower) ||
       (worker.email || '').toLowerCase().includes(searchLower) ||
       (worker.phone || '').toLowerCase().includes(searchLower));
    
    const projectMatch = !filterProject || (worker.projectCodes && worker.projectCodes.includes(parseInt(filterProject)));
    
    let accountantMatch = true;
    if (filterAccountant) {
      const accountant = users.find((u: any) => u._id === filterAccountant && u.role === 'accountant');
      if (accountant && Array.isArray(accountant.accountantInstitutionCodes) && classes.length > 0) {
        const workerClasses = classes.filter((cls: any) =>
          Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
        );
        const workerInstitutionCodes = workerClasses.map((cls: any) => cls.institutionCode);
        accountantMatch = workerInstitutionCodes.some((code: string) => accountant.accountantInstitutionCodes.includes(code));
      } else {
        accountantMatch = false;
      }
    }

    let institutionMatch = true;
    if (filterInstitutionCode) {
      const workerClasses = classes.filter((cls: any) =>
        Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
      );
      institutionMatch = workerClasses.some((cls: any) => cls.institutionCode === filterInstitutionCode);
    }

    let classCodeMatch = true;
    if (filterClassCode) {
      const workerClasses = classes.filter((cls: any) =>
        Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
      );
      classCodeMatch = workerClasses.some((cls: any) => cls.uniqueSymbol === filterClassCode);
    }

    // סינון לפי תפקיד
    const roleMatch = !filterRole || worker.roleName === filterRole;
    
    return nameMatch && projectMatch && accountantMatch && institutionMatch && classCodeMatch && roleMatch;
  });

  // מסמכים של העובדים המסוננים
  const filteredDocuments = personalDocuments.filter(doc => {
    const worker = workers.find(w => w._id === doc.operatorId);
    if (!worker) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = !searchTerm ||
      (`${worker.lastName} ${worker.firstName}`.toLowerCase().includes(searchLower) ||
       (worker.id || '').toLowerCase().includes(searchLower) ||
       (worker.email || '').toLowerCase().includes(searchLower) ||
       (worker.phone || '').toLowerCase().includes(searchLower));
    
    const projectMatch = !filterProject || (worker.projectCodes && worker.projectCodes.includes(parseInt(filterProject)));
    
    let accountantMatch = true;
    if (filterAccountant) {
      const accountant = users.find((u: any) => u._id === filterAccountant && u.role === 'accountant');
      if (accountant && Array.isArray(accountant.accountantInstitutionCodes) && classes.length > 0) {
        const workerClasses = classes.filter((cls: any) =>
          Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
        );
        const workerInstitutionCodes = workerClasses.map((cls: any) => cls.institutionCode);
        accountantMatch = workerInstitutionCodes.some((code: string) => accountant.accountantInstitutionCodes.includes(code));
      } else {
        accountantMatch = false;
      }
    }

    let institutionMatch = true;
    if (filterInstitutionCode) {
      const workerClasses = classes.filter((cls: any) =>
        Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
      );
      institutionMatch = workerClasses.some((cls: any) => cls.institutionCode === filterInstitutionCode);
    }

    let classCodeMatch = true;
    if (filterClassCode) {
      const workerClasses = classes.filter((cls: any) =>
        Array.isArray(cls.workers) && cls.workers.some((w: any) => w.workerId === worker._id)
      );
      classCodeMatch = workerClasses.some((cls: any) => cls.uniqueSymbol === filterClassCode);
    }
    
    return nameMatch && projectMatch && accountantMatch && institutionMatch && classCodeMatch;
  });

  const approvedDocsCount = filteredDocuments.filter(d => d.status === DocumentStatus.APPROVED).length;
  const pendingDocsCount = filteredDocuments.filter(d => d.status === DocumentStatus.PENDING).length;
  const rejectedDocsCount = filteredDocuments.filter(d => d.status === DocumentStatus.REJECTED).length;



  if (isLoadingPersonalDocs || isLoadingWorkers || isLoadingClasses) {
    return <Typography>טוען...</Typography>;
  }

  const handleOpenUploadDialog = (worker: WorkerAfterNoon, tag: string) => {
    setUploadTarget({ 
      workerId: worker._id, 
      workerName: `${worker.firstName} ${worker.lastName}`,
      workerTz: worker.id || '', 
      tag 
    });
    setIsUploadDialogOpen(true);
  };
  
  const handleOpenManualUploadDialog = () => {
    setUploadTarget(null);
    setManualUploadData({ worker: null, tag: '' });
    setIsUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
    setUploadTarget(null);
    setManualUploadData({ worker: null, tag: '' });
  };

  const handleUploadDocument = (formData: FormData) => {
    uploadDocument(formData, {
      onSuccess: () => {
        handleCloseUploadDialog();
      }
    });
  };

  const handleApprove = (documentId: string) => updateStatus({ documentId, status: DocumentStatus.APPROVED });
  const handleReject = (documentId: string) => updateStatus({ documentId, status: DocumentStatus.REJECTED });

  const handleWorkerClick = (workerId: string) => {
    navigate(`/workers/${workerId}`);
  };

  // פונקציה ליצירת תגיות סינון פעילות
  const getActiveFilters = () => {
    const filters = [];
    
    if (searchTerm) {
      filters.push({
        key: 'search',
        label: `חיפוש: "${searchTerm}"`,
        onDelete: () => setSearchTerm('')
      });
    }
    
    if (filterProject) {
      const project = PROJECT_OPTIONS.find(p => p.value === filterProject);
      filters.push({
        key: 'project',
        label: `פרויקט: ${project?.label}`,
        onDelete: () => setFilterProject('')
      });
    }
    
    if (filterAccountant) {
      const accountant = accountantUserOptions.find(a => a.value === filterAccountant);
      filters.push({
        key: 'accountant',
        label: `חשב שכר: ${accountant?.label}`,
        onDelete: () => setFilterAccountant('')
      });
    }
    
    if (filterInstitutionCode) {
      const institution = institutionOptions.find(i => i.value === filterInstitutionCode);
      filters.push({
        key: 'institution',
        label: `מוסד: ${institution?.label}`,
        onDelete: () => setFilterInstitutionCode('')
      });
    }
    
    if (filterClassCode) {
      const classItem = classCodeOptions.find(c => c.value === filterClassCode);
      filters.push({
        key: 'class',
        label: `קבוצה: ${classItem?.label}`,
        onDelete: () => setFilterClassCode('')
      });
    }
    
    if (filterStatus) {
      const statusLabels: Record<DocumentStatus, string> = {
        [DocumentStatus.APPROVED]: 'מאושר',
        [DocumentStatus.PENDING]: 'ממתין',
        [DocumentStatus.REJECTED]: 'נדחה',
        [DocumentStatus.EXPIRED]: 'פג תוקף'
      };
      filters.push({
        key: 'status',
        label: `סטטוס: ${statusLabels[filterStatus]}`,
        onDelete: () => setFilterStatus('')
      });
    }
    
    if (filterRole) {
      filters.push({
        key: 'role',
        label: `תפקיד: ${filterRole}`,
        onDelete: () => setFilterRole('')
      });
    }
    
    return filters;
  };

  return (
    <MainContainer>
      
      {/* סרגל סינון מתקדם בראש העמוד */}
      <FilterCard>
        <FilterHeader>
          <FilterTitle variant="h6">
            🔍 סינון מתקדם
          </FilterTitle>
          {getActiveFilters().length > 0 && (
            <>
              <FilterDivider>|</FilterDivider>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {getActiveFilters().map((filter) => (
                  <FilterChip
                    key={filter.key}
                    label={filter.label}
                    onDelete={filter.onDelete}
                    size="small"
                  />
                ))}
              </Stack>
            </>
          )}
        </FilterHeader>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              size="small"
              fullWidth
              placeholder="חיפוש חופשי"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: !searchTerm ? <FilterIcon as={SearchIcon} /> : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>פרויקט</InputLabel>
              <Select 
                value={filterProject} 
                label="פרויקט" 
                onChange={(e) => setFilterProject(e.target.value)}
                startAdornment={!filterProject ? <FilterIcon as={FolderIcon} /> : null}
              >
                {PROJECT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>חשב שכר</InputLabel>
              <Select 
                value={filterAccountant} 
                label="חשב שכר" 
                onChange={(e) => setFilterAccountant(e.target.value)}
                startAdornment={!filterAccountant ? <FilterIcon as={PersonIcon} /> : null}
              >
                {accountantUserOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              size="small"
              options={institutionOptions}
              getOptionLabel={(option) => option.label}
              value={institutionOptions.find(opt => opt.value === filterInstitutionCode) || null}
              onChange={(_, newValue) => setFilterInstitutionCode(newValue?.value || '')}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="קוד מוסד" 
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {!filterInstitutionCode && <FilterIcon as={BusinessIcon} />}
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.value === value.value}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              size="small"
              options={classCodeOptions}
              getOptionLabel={(option) => option.label}
              value={classCodeOptions.find(opt => opt.value === filterClassCode) || null}
              onChange={(_, newValue) => setFilterClassCode(newValue?.value || '')}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="סמל כיתה" 
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {!filterClassCode && <FilterIcon as={WorkIcon} />}
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.value === value.value}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>סטטוס</InputLabel>
              <Select 
                value={filterStatus} 
                label="סטטוס" 
                onChange={(e) => setFilterStatus(e.target.value as DocumentStatus)}
                startAdornment={!filterStatus ? <FilterIcon as={FilterListIcon} /> : null}
              >
                <MenuItem value="">הכל</MenuItem>
                <MenuItem value={DocumentStatus.APPROVED}>מאושר</MenuItem>
                <MenuItem value={DocumentStatus.PENDING}>ממתין</MenuItem>
                <MenuItem value={DocumentStatus.REJECTED}>נדחה</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>תפקיד</InputLabel>
              <Select 
                value={filterRole} 
                label="תפקיד" 
                onChange={(e) => setFilterRole(e.target.value)}
                startAdornment={!filterRole ? <FilterIcon as={WorkIcon} /> : null}
              >
                {roleOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

                  </Grid>
        </FilterCard>

      {/* הטבלה והסטטיסטיקות */}
      <Grid container spacing={2}>
        <Grid item xs={16} md={11}>
          <Card component={Paper} elevation={3}>
        <CardContent>
          <TableContainerBox>
            <StyledTable 
              size="small" 
              stickyHeader
            >
              <TableHead>
                <StyledTableRow>
                  <TableCell>שם עובד</TableCell>
                  <TableCell>ת"ז</TableCell>
                  <TableCell>תפקיד</TableCell>
                  <TableCell>101</TableCell>
                  <TableCell>אישור משטרה</TableCell>
                  <TableCell>תעודת השכלה</TableCell>
                  <TableCell>חוזה</TableCell>
                  <TableCell>תעודת זהות</TableCell>
                  <TableCell>אישור וותק</TableCell>
                </StyledTableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <EmptyTableCell colSpan={9} align="center">
                      <Typography color="text.secondary">לא נמצאו עובדים התואמים את הסינון</Typography>
                    </EmptyTableCell>
                  </TableRow>
                ) : (
                  paginatedData.map(({ worker, docs }) => (
                    <TableRow key={worker._id} hover>
                      <TableCell>
                        <ClickableText 
                          variant="body2" 
                          onClick={() => handleWorkerClick(worker._id)}
                        >
                          {`${worker.lastName} ${worker.firstName}`}
                        </ClickableText>
                      </TableCell>
                                                <TableCell>
                            <ClickableText 
                              variant="body2" 
                              onClick={() => handleWorkerClick(worker._id)}
                            >
                              {worker.id}
                            </ClickableText>
                          </TableCell>
                      <TableCell>{worker.roleName}</TableCell>
                      <TableCell>
                        {worker.is101 ? (
                          <SmallTypography variant="body2">התקבל</SmallTypography>
                        ) : (
                          <SmallTypography variant="body2">חסר</SmallTypography>
                        )}
                      </TableCell>
                      {/* אישור משטרה */}
                      <TableCell>
                        {(() => {
                          const doc = docs['אישור משטרה'];
                          return doc ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Tooltip title="צפה במסמך">
                                <IconButton size="small" onClick={() => window.open(doc.url, '_blank')} disabled={!doc.url}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {doc.status !== DocumentStatus.PENDING && getStatusChip(doc.status)}
                              {doc.status === DocumentStatus.PENDING && (
                                <>
                                  <Tooltip title="אשר">
                                    <IconButton size="small" onClick={() => handleApprove(doc._id!)} disabled={isUpdatingStatus}>
                                      <CheckIcon fontSize="small" color="success" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="דחה">
                                    <IconButton size="small" onClick={() => handleReject(doc._id!)} disabled={isUpdatingStatus}>
                                      <CloseIcon fontSize="small" color="error" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          ) : (
                            <Tooltip title="העלה אישור משטרה">
                              <UploadButton size="small" color="primary" onClick={() => handleOpenUploadDialog(worker, 'אישור משטרה')}>
                                <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                העלה
                              </UploadButton>
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
                      
                      {/* תעודת השכלה */}
                      <TableCell>
                        {(() => {
                          const requiredDocs = getRequiredDocumentsForWorker(worker);
                          if (!requiredDocs.includes('תעודת השכלה')) {
                            return (
                              <Tooltip title="לא נדרש">
                                <UploadButton size="small">
                                  -----
                                </UploadButton>
                              </Tooltip>
                            );
                          }
                          
                          const doc = docs['תעודת השכלה'];
                          return doc ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Tooltip title="צפה במסמך">
                                <IconButton size="small" onClick={() => window.open(doc.url, '_blank')} disabled={!doc.url}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {doc.status !== DocumentStatus.PENDING && getStatusChip(doc.status)}
                              {doc.status === DocumentStatus.PENDING && (
                                <>
                                  <Tooltip title="אשר">
                                    <IconButton size="small" onClick={() => handleApprove(doc._id!)} disabled={isUpdatingStatus}>
                                      <CheckIcon fontSize="small" color="success" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="דחה">
                                    <IconButton size="small" onClick={() => handleReject(doc._id!)} disabled={isUpdatingStatus}>
                                      <CloseIcon fontSize="small" color="error" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          ) : (
                            <Tooltip title="העלה תעודת השכלה">
                              <UploadButton size="small" color="primary" onClick={() => handleOpenUploadDialog(worker, 'תעודת השכלה')}>
                                <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                העלה
                              </UploadButton>
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
                      
                      {/* חוזה */}
                      <TableCell>
                        {(() => {
                          const doc = docs['חוזה'];
                          return doc ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Tooltip title="צפה במסמך">
                                <IconButton size="small" onClick={() => window.open(doc.url, '_blank')} disabled={!doc.url}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {doc.status !== DocumentStatus.PENDING && getStatusChip(doc.status)}
                              {doc.status === DocumentStatus.PENDING && (
                                <>
                                  <Tooltip title="אשר">
                                    <IconButton size="small" onClick={() => handleApprove(doc._id!)} disabled={isUpdatingStatus}>
                                      <CheckIcon fontSize="small" color="success" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="דחה">
                                    <IconButton size="small" onClick={() => handleReject(doc._id!)} disabled={isUpdatingStatus}>
                                      <CloseIcon fontSize="small" color="error" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          ) : (
                            <Tooltip title="העלה חוזה">
                              <UploadButton size="small" color="primary" onClick={() => handleOpenUploadDialog(worker, 'חוזה')}>
                                <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                העלה
                              </UploadButton>
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
                      
                      {/* תעודת זהות */}
                      <TableCell>
                        {(() => {
                          const doc = docs['תעודת זהות'];
                          return doc ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Tooltip title="צפה במסמך">
                                <IconButton size="small" onClick={() => window.open(doc.url, '_blank')} disabled={!doc.url}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {doc.status !== DocumentStatus.PENDING && getStatusChip(doc.status)}
                              {doc.status === DocumentStatus.PENDING && (
                                <>
                                  <Tooltip title="אשר">
                                    <IconButton size="small" onClick={() => handleApprove(doc._id!)} disabled={isUpdatingStatus}>
                                      <CheckIcon fontSize="small" color="success" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="דחה">
                                    <IconButton size="small" onClick={() => handleReject(doc._id!)} disabled={isUpdatingStatus}>
                                      <CloseIcon fontSize="small" color="error" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          ) : (
                            <Tooltip title="העלה תעודת זהות">
                              <UploadButton size="small" color="primary" onClick={() => handleOpenUploadDialog(worker, 'תעודת זהות')}>
                                <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                העלה
                              </UploadButton>
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
                      
                      {/* אישור וותק */}
                      <TableCell>
                        {(() => {
                          const requiredDocs = getRequiredDocumentsForWorker(worker);
                          if (!requiredDocs.includes('אישור וותק')) {
                            return (
                              <ItalicTypography variant="body2">
                                -----
                              </ItalicTypography>
                            );
                          }
                          
                          const doc = docs['אישור וותק'];
                          return doc ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Tooltip title="צפה במסמך">
                                <IconButton size="small" onClick={() => window.open(doc.url, '_blank')} disabled={!doc.url}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {doc.status !== DocumentStatus.PENDING && getStatusChip(doc.status)}
                              {doc.status === DocumentStatus.PENDING && (
                                <>
                                  <Tooltip title="אשר">
                                    <IconButton size="small" onClick={() => handleApprove(doc._id!)} disabled={isUpdatingStatus}>
                                      <CheckIcon fontSize="small" color="success" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="דחה">
                                    <IconButton size="small" onClick={() => handleReject(doc._id!)} disabled={isUpdatingStatus}>
                                      <CloseIcon fontSize="small" color="error" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          ) : (
                            <Tooltip title="העלה אישור וותק">
                              <UploadButton size="small" color="primary" onClick={() => handleOpenUploadDialog(worker, 'אישור וותק')}>
                                <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }}/>
                                העלה
                              </UploadButton>
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </StyledTable>
          </TableContainerBox>
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[ROWS_PER_PAGE]}
            labelRowsPerPage="שורות בעמוד:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
          />
        </CardContent>
      </Card>
        </Grid>
        <Grid item xs={8} md={1}>
          {/* סטטיסטיקות לצד הטבלה */}
          <Stack spacing={2}>
            <DownloadCard onClick={() => setIsDownloadDialogOpen(true)}>
              <CenteredCardContent>
                <BoldTypography variant="body2">הורדת דוחות</BoldTypography>
              </CenteredCardContent>
            </DownloadCard>
            <StatCard color="primary">
              <CenteredCardContent>
                <Typography variant="h6" fontWeight="bold">{filteredWorkers.length}</Typography>
                <Typography variant="body2">עובדים במערכת</Typography>
              </CenteredCardContent>
            </StatCard>
            <StatCard color="success">
              <CenteredCardContent>
                <Typography variant="h6" fontWeight="bold">{approvedDocsCount}</Typography>
                <Typography variant="body2">מסמכים מאושרים</Typography>
              </CenteredCardContent>
            </StatCard>
            <StatCard color="warning">
              <CenteredCardContent>
                <Typography variant="h6" fontWeight="bold">{pendingDocsCount}</Typography>
                <Typography variant="body2">מסמכים ממתינים</Typography>
              </CenteredCardContent>
            </StatCard>
            <StatCard color="error">
              <CenteredCardContent>
                <Typography variant="h6" fontWeight="bold">{rejectedDocsCount}</Typography>
                <Typography variant="body2">מסמכים שנדחו</Typography>
              </CenteredCardContent>
            </StatCard>
          </Stack>
        </Grid>
      </Grid>
                          

  <UploadDocumentDialog
    open={isUploadDialogOpen}
    onClose={handleCloseUploadDialog}
    uploadTarget={uploadTarget}
    manualUploadData={manualUploadData}
    setManualUploadData={setManualUploadData}
    workers={workers}
    onUpload={handleUploadDocument}
    isUploading={isUploading}
  />

      <DownloadReportDialog
        open={isDownloadDialogOpen}
        onClose={() => setIsDownloadDialogOpen(false)}
        workers={workers}
        documents={personalDocuments}
        classes={classes}
        getRequiredDocumentsForWorker={getRequiredDocumentsForWorker}
      />


    </MainContainer>
  );
};

export default AllDocumentsTable;
