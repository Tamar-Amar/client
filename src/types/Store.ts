export interface ContactPerson {
    name: string;
    email: string;
    phone: string;
  }
  
  export interface Store {
    name: string;
    address: string;
    businessId: string;
    contactPersons: ContactPerson[];
  }
  