export const FILE_SIZE_LIMITS = {
  DOCUMENTS: 2 * 1024 * 1024, 
  EXCEL: 5 * 1024 * 1024, 
  IMAGES: 5 * 1024 * 1024, 
} as const;

export const validateFileSize = (file: File, maxSize: number): { isValid: boolean; error?: string } => {
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `גודל הקובץ חורג מהמותר (${maxSizeMB}MB)`
    };
  }
  return { isValid: true };
};

export const validateDocumentFile = (file: File) => {
  return validateFileSize(file, FILE_SIZE_LIMITS.DOCUMENTS);
};

export const validateExcelFile = (file: File) => {
  return validateFileSize(file, FILE_SIZE_LIMITS.EXCEL);
};

export const validateImageFile = (file: File) => {
  return validateFileSize(file, FILE_SIZE_LIMITS.IMAGES);
};

export const getFileSizeInMB = (bytes: number): string => {
  return (bytes / (1024 * 1024)).toFixed(2);
}; 