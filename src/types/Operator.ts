export interface BankDetails {
    bankName: string;
    accountNumber: string;
    branchNumber: string;
  }
  
  export interface BusinessDetails {
    businessId: string;
    businessName: string;
  }
  export enum PaymentMethodChoicesEnum {
    CHEABONIT = 'חשבונית',
    TLUSH = 'תלוש',
    NONE = 'לא נבחר'
  }
  
  
  export interface Operator {
    firstName: string;
    lastName: string;
    phone: string;
    id: string;
    email: string;
    password: string;
    address: string;
    description: string;
    paymentMethod: PaymentMethodChoicesEnum;
    businessDetails?: BusinessDetails;
    bankDetails: BankDetails;
  }


