import * as Yup from "yup";

// BankDetails validation schema
export const BankDetailsSchema = Yup.object({
  bankName: Yup.string().required("שם הבנק הוא שדה חובה"),
  accountNumber: Yup.string()
    .matches(/^\d+$/, "מספר החשבון חייב לכלול רק ספרות")
    .required("מספר החשבון הוא שדה חובה"),
  branchNumber: Yup.string()
    .matches(/^\d+$/, "מספר הסניף חייב לכלול רק ספרות")
    .required("מספר הסניף הוא שדה חובה"),
});

export const BusinessDetailsSchema = Yup.object({
  businessId: Yup.string().when("paymentMethod", {
    is: "חשבונית", // Applies only if paymentMethod is "חשבונית"
    then: (schema) => schema.required("ח.פ הוא שדה חובה עבור חשבונית"),
    otherwise: (schema) => schema.optional(),
  }),
  businessName: Yup.string().when("paymentMethod", {
    is: "חשבונית", // Applies only if paymentMethod is "חשבונית"
    then: (schema) => schema.required("שם העסק הוא שדה חובה עבור חשבונית"),
    otherwise: (schema) => schema.optional(),
  }),
});

// Operator validation schema
export const OperatorSchema = Yup.object({
  firstName: Yup.string().required("שם המפעיל הוא שדה חובה"),
  lastName: Yup.string().required("שם המפעיל הוא שדה חובה"),
  phone: Yup.string()
    .matches(/^\d+$/, "מספר הטלפון חייב לכלול רק ספרות")
    .required("מספר הטלפון הוא שדה חובה"),
  id: Yup.string()
    .matches(/^\d+$/, "מספר תעודת הזהות חייב לכלול רק ספרות")
    .required("מספר תעודת הזהות הוא שדה חובה"),
  password: Yup.string()
    .min(6, "סיסמא חייבת להכיל 6 תווים"),
  email: Yup.string()
    .email("כתובת האימייל אינה תקינה")
    .required("כתובת האימייל היא שדה חובה"),
  address: Yup.string().required("כתובת היא שדה חובה"),
  description: Yup.string().required("תיאור הוא שדה חובה"),
  paymentMethod: Yup.string()
    .oneOf(["חשבונית", "תלוש", "לא נבחר"], "שיטת התשלום אינה תקינה")
    .required("שיטת התשלום היא שדה חובה"),
  businessDetails: BusinessDetailsSchema,
  bankDetails: BankDetailsSchema, 
  gender: Yup.string()
    .oneOf(["בנים", "בנות", "גם וגם"], "הזן ערך תקין עבור מגדר")
    .required("מגדר הוא שדה חובה"),
  educationType: Yup.string()
    .oneOf(["רגיל", "מיוחד", "גם וגם"], "הזן ערך תקין עבור סוג חינוך")
    .required("סוג החינוך הוא שדה חובה"),
  isActive: Yup.boolean().default(true),
});
