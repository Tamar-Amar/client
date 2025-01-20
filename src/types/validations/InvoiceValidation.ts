import * as Yup from "yup";

// Enum-like validation for Invoice Status
const InvoiceStatusEnum = ["לא התקבלה", "התקבלה", "הוכנסה לדאטה", "שולמה"];

// Enum-like validation for Invoice Type
const InvoiceTypeEnum = ["חיוב", "זיכוי"];

// Enum-like validation for VAT Type
const TypeVatEnum = [17, 18];

// Invoice validation schema
export const InvoiceSchema = Yup.object({
  storeId: Yup.string()
    .required("חובה לבחור חנות"),
  invoiceNumber: Yup.string()
    .matches(/^\d+$/, "מספר חשבונית חייב להיות מספר")
    .required("מספר חשבונית הוא שדה חובה"),
  invoiceDate: Yup.date()
    .required("תאריך קבלה הוא שדה חובה"),
  totalAmount: Yup.number()
    .min(0.01, "סכום חייב להיות לפחות 0.01")
    .required("סכום החשבונית הוא שדה חובה"),
  typeVat: Yup.number()
    .oneOf(TypeVatEnum, "מע״מ חייב להיות 17% או 18%")
    .required("סוג מע״מ הוא שדה חובה"),
  status: Yup.string()
    .oneOf(InvoiceStatusEnum, "סטטוס אינו תקין")
    .required("סטטוס הוא שדה חובה"),
  type: Yup.string()
    .oneOf(InvoiceTypeEnum, "סוג חשבונית אינו תקין")
    .required("סוג חשבונית הוא שדה חובה"),
});

