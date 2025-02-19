export interface Purchase {
    _id?: string;
    classId: string;
    storeId: string;
    invoiceId?: string; 
    purchaseDate: string; 
    amount: number;
    actualUsage: number;
    description?: string;
  }
  