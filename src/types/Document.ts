export enum DocumentType {
  ID = 'תעודת זהות',
  BANK_DETAILS = 'פרטי בנק',
  POLICE_APPROVAL = 'אישור משטרה',
  TEACHING_CERTIFICATE = 'תעודת השכלה',
  CONTRACT = 'חוזה',
  OTHER = 'אחר'
}

export const REQUIRED_DOCUMENTS: DocumentType[] = [
  DocumentType.POLICE_APPROVAL,
  DocumentType.TEACHING_CERTIFICATE,
  DocumentType.CONTRACT
];

export enum DocumentStatus {
  PENDING = 'ממתין',
  APPROVED = 'מאושר',
  REJECTED = 'נדחה',
  EXPIRED = 'פג תוקף'
}

export interface Document {
  _id: string;
  operatorId: string;
  fileName: string;
  fileType: string;
  size: number;
  tag: DocumentType;
  s3Key: string;
  url: string;
  expiryDate: Date;
  uploadedBy: string;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

