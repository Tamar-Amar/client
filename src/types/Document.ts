export enum DocumentType {
  ID = 'תעודת זהות',
  POLICE_APPROVAL = 'אישור משטרה',
  TEACHING_CERTIFICATE = 'תעודת השכלה',
  CONTRACT = 'חוזה',
  VETTING_CERTIFICATE = 'אישור וותק',
  CAMP_ATTENDANCE_COORDINATOR = 'נוכחות קייטנה רכז',
  MEDICAL_APPROVAL = 'אישור רפואי',
}

export const REQUIRED_DOCUMENTS: DocumentType[] = [
  DocumentType.ID,
  DocumentType.POLICE_APPROVAL,
  DocumentType.TEACHING_CERTIFICATE,
  DocumentType.CONTRACT,
  DocumentType.VETTING_CERTIFICATE
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

