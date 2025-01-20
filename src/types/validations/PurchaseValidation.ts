import * as Yup from "yup";

export const PurchaseSchema = Yup.object().shape({
  purchaseDate: Yup.string().required("תאריך הוא שדה חובה"),
  classId: Yup.string().required("יש לבחור קבוצה"),
  storeId: Yup.string().required("יש לבחור חנות"),
  description: Yup.string().required("יש להזין תיאור"),
  invoiceId: Yup.string(),
  purchaseType: Yup.string().required("יש לבחור סוג רכישה"),
  amount: Yup.number()
    .required("יש להזין סכום")
    .when("purchaseType", (purchaseType, schema) => {
      if (purchaseType.toString() === "רכש צהרונים") {
        return schema.oneOf([200, 250], "הסכום חייב להיות 200 או 250 לפי סוג הקבוצה");
      }
      return schema.min(1, "הסכום חייב להיות לפחות 1");
    }),
  actualUsage: Yup.string().required("שדה actualUsage הוא חובה"),
});
