// Activity.ts - מודל מעודכן ללקוח
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
  }
  
  // Class.ts - מודל מעודכן ללקוח
  export interface Class {
    _id?: string;
    name: string;
    isSpecialEducation: boolean;
    gender: 'בנים' | 'בנות';
    address?: string;
    uniqueSymbol: string;
    chosenStore: string;
    institutionId: string;
    type: 'כיתה' | 'גן';
    hasAfternoonCare: boolean;
    monthlyBudget?: number;
    childresAmount?: number;
    regularOperatorId?: string;
    isActive: boolean;
    contactsId?: string[];
    description?: string;
  }
  
  // Institution.ts - מודל מעודכן ללקוח
  export interface Institution {
    _id?: string;
    institutionCode: string;
    institutionSymbol?: string;
    name: string;
    contacts: string[];
    isActive: boolean;
  }
  
  // Invoice.ts - מודל מעודכן ללקוח
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
  
  // Operator.ts 
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
    businessDetails?: {
      businessId: string;
      businessName: string;
    };
    bankDetailsId: string;
    regularClasses?: string[];
    gender: Gender;
    educationType: EducationType;
    isActive: boolean;
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
  
  // BankDetails.ts 
  export interface BankDetails {
    _id?: string;
    operator_id: string;
    bankName: string;
    accountNumber: string;
    branchNumber: string;
  }
  
  // Contact.ts - מודל מעודכן ללקוח
  export interface Contact {
    _id?: string;
    name: string;
    phone: string;
    email: string;
    description: string;
    entityType: "Institution" | "Store" | "Class"; 
    entityId: string; 
  }
  
  