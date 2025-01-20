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
  