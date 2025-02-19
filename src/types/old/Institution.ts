export interface Coordinator {
    name: string;
    phone: string;
    email: string;
  }
  
  export interface Institution {
    institutionCode: string;
    name: string;
    coordinator: Coordinator;
    institutionSymbol?: string;
  }
  