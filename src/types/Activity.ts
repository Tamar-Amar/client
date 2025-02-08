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
