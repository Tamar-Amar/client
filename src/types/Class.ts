export interface Class {
  _id?: string; // class ID
    name: string;
    isSpecialEducation: boolean;
    gender: 'בנים' | 'בנות';
    address: string;
    uniqueSymbol: string;
    chosenStore: string; // store ID
    institutionId: string; // institution ID
    type: 'כיתה' | 'גן'; // class type
    hasAfternoonCare: boolean; // whether afternoon care is available
    monthlyBudget: number; // budget for afternoon care
    childresAmount?: number; // number of children
  }
  