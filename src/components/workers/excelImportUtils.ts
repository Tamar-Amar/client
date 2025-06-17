// פונקציות עזר לעיבוד ונרמול טלפונים

export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  let cleanPhone = phone.replace(/[^\d]/g, '');
  if ((cleanPhone.length === 8 || cleanPhone.length === 9) && !cleanPhone.startsWith('0')) {
    cleanPhone = `0${cleanPhone}`;
  }
  return cleanPhone;
};

export const isValidPhone = (phone: string): boolean => {
  const cleanPhone = normalizePhone(phone);
  const phoneRegex = /^0\d{8,9}$/;
  return phoneRegex.test(cleanPhone);
}; 

export const formatDate = (dateInput?: string | Date): string => {
    if (!dateInput) return '';
    let date: Date;
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('he-IL');
  };

  export   const validateIsraeliID = (id: string): boolean => {
    id = id.trim();
    if (id.length > 9) return false;
    id = id.padStart(9, '0');
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = Number(id.charAt(i));
      if (i % 2 === 0) {
        digit *= 1;
      } else {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + Math.floor(digit / 10);
        }
      }
      sum += digit;
    }
    return sum % 10 === 0;
  };

  export   const parseDate = (dateStr: string): string => {
    if (!dateStr || typeof dateStr !== 'string') return '';

    const cleanDateStr = dateStr.trim().replace(/[^0-9./-]/g, '');
    if (!cleanDateStr) return '';
    if (!isNaN(Number(cleanDateStr)) && cleanDateStr.length <= 5) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      excelEpoch.setDate(excelEpoch.getDate() + Number(cleanDateStr));
      return excelEpoch.toISOString();
    }

    const parts = cleanDateStr.split(/[./-]/).map(num => num.trim());
    if (parts.length === 3) {
      let [day, month, year] = parts;
      if (year.length === 2) year = `20${year}`;
      if (year.length === 4 && day.length === 4) {
        [year, month, day] = parts;
      }
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    const date = new Date(cleanDateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    return '';
  };