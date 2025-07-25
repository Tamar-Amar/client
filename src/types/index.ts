export interface Activity {
    _id?: string; 
    classId:
      | string 
      | {
          _id: string;
          name: string;
          uniqueSymbol: string;
        }; 
    operatorId:
      | string 
      | {
          _id: string;
          firstName: string;
          lastName: string;
        }; 
    date: Date; 
    description?: string; 
    monthPayment: string;
  }
  
  export interface Class {
    _id?: string;
    name: string;
    education: string;
    gender: 'בנים' | 'בנות';
    address?: string;
    uniqueSymbol: string;
    chosenStore?: string;
    institutionName: string;
    institutionCode: string;
    type: 'כיתה' | 'גן';
    hasAfternoonCare: boolean;
    AfternoonOpenDate?: Date;
    monthlyBudget?: number;
    childresAmount?: number;
    projectCodes?: number[];
    regularOperatorId?: string;
    isActive: boolean;
    description?: string;
    workers?: Array<{
      workerId: string;
      roleName: string;
      project: number;
    }>;
    coordinatorId: string;
  }


  export enum InvoiceType {
    CHARGE = 'חיוב',
    CREDIT = 'זיכוי',
  }
  
  export enum InvoiceStatus {
    NOT_RECEIVED = 'לא התקבלה',
    RECEIVED = 'התקבלה',
    ENTERED_TO_DATA = 'הוכנסה לדאטה',
    PAID = 'שולמה',
  }
  
  export enum VatType {
    Y2024 = 17,
    Y2025 = 18,
  }
  
  export interface Invoice {
    _id?: string;
    storeId: string;
    invoiceNumber: string;
    invoiceDate: Date;
    totalAmount: number;
    typeVat: VatType;
    status: InvoiceStatus;
    type: InvoiceType;
  }

  export enum PaymentMethodChoicesEnum {
    CHEABONIT = 'חשבונית',
    TLUSH = 'תלוש',
    NONE = 'לא נבחר'
  }

  export enum Gender{
    MALE = 'בנים',
    FEMALE = 'בנות',
    ALL = 'גם וגם'
  }

  export enum EducationType{
    BASIC = 'רגיל',
    SPECIAL = 'מיוחד',
    ALL = 'גם וגם'
  }
  
  export interface WeeklySchedule {
    day: 'ראשון' | 'שני' | 'שלישי' | 'רביעי' | 'חמישי';
    classes: string[];
  }
  export interface Operator {
    _id?: string;
    firstName: string;
    lastName: string;
    phone: string;
    id: string;
    email: string;
    password: string;
    status: string;
    signDate?: Date;
    address: string;
    description: string;
    paymentMethod: PaymentMethodChoicesEnum;
    regularClasses?: string[];
    gender: Gender;
    educationType: EducationType;
    isActive: boolean;
    weeklySchedule?: WeeklySchedule[];
  }
  
  // Purchases.ts 
  export interface Purchase {
    _id?: string;
    classId: string;
    storeId: string;
    invoiceId?: string;
    purchaseDate: Date;
    amount: number;
    actualUsage?: number;
    description?: string;
  }
  
  // Store.ts 
  export interface Store {
    _id?: string;
    name: string;
    address: string;
    businessId: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    regularClasses?: string[];
  }


  export interface WorkerAfterNoon {
    _id: string;
    id: string;
    firstName: string;
    lastName: string;
    modelCode: number;
    projectCodes?: number[]; 
    createDate: Date; 
    updateDate: Date;
    updateBy: string;
    startDate: Date;
    endDate: Date;
    status: string;
    phone: string;
    email?: string;
    isActive: boolean;
    notes?: string;
    roleName: string;
    is101: boolean;
    accountantCode?: string;
  }

  export interface WorkerWithClassInfo extends WorkerAfterNoon {
    classSymbol?: string;
    className?: string;
    project?: number;
    institutionCode?: string;
    documentsCount?: number;
  }
  

  export interface Coordinator {
    _id?: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
  }

  export interface User {
    _id?: string;
    username: string;
    role: 'admin' | 'manager_project' | 'accountant' | 'coordinator';
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    isActive: boolean;
    lastLogin?: string;
    createDate: string;
    updateDate: string;
    updateBy: string;
    projectCodes?: Array<{
      projectCode: number;
      institutionCode: string;
      institutionName: string;
    }>;
  }

  export const REQUIRED_DOC_TAGS = ['אישור משטרה', 'חוזה', 'תעודת זהות'];