

export interface Document {
  _id?: string;
  operatorId: string;
  tag: string;
  fileName: string;
  fileType: string;
  size: number;
  url: string;
  uploadedAt: string;
  status: DocumentStatus;
}

export enum DocumentStatus {
  PENDING = 'ממתין',
  APPROVED = 'מאושר',
  REJECTED = 'נדחה',
  EXPIRED = 'פג תוקף'
}

export enum DocumentType {
  ID = 'תעודת זהות',
  RESUME = 'קורות חיים',
  EDUCATION = 'תעודות השכלה',
  CRIMINAL_RECORD = 'תעודת יושר',
  BANK_DETAILS = 'פרטי בנק',
  OTHER = 'אחר'
}