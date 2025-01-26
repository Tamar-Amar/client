export interface Activity {
  _id?: string; // מזהה הפעילות
  classId:
    | string // אם זה נשמר כ-ID בלבד
    | {
        _id: string;
        name: string;
        uniqueSymbol: string;
      }; // אם זה מפורט לאחר populate
  operatorId:
    | string // אם זה נשמר כ-ID בלבד
    | {
        _id: string;
        firstName: string;
        lastName: string;
      }; // אם זה מפורט לאחר populate
  date: Date; // תאריך הפעילות
  description?: string; // תיאור הפעילות
}
