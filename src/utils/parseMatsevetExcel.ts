import * as XLSX from 'xlsx';


const normalizeGender = (val: string) => {
  const v = (val || '').trim();
  if (v === 'בנים' || v === 'בן') return 'בנים';
  if (v === 'בנות' || v === 'בת') return 'בנות';

  return 'בנים';
};

const normalizeType = (val: string) => {
  const v = (val || '').trim();
  if (v === 'גן' || v === 'גן ילדים') return 'גן';
  if (v === 'כיתה' || v === 'כיתת') return 'כיתה';

  return 'גן';
};

const normalizeEducation = (val: string) => {
  const v = (val || '').trim();
  if (v === 'רגיל' || v === 'רגילה') return 'רגיל';
  if (v === 'מיוחד' || v === 'מיוחדת') return 'מיוחד';

  return 'רגיל';
};
const getDefaultClass = (row: any, projectCode: number) => {
  const shouldAssignProject = row['אישור פתיחה'] === 'כן';
  

  const name = row['שם מוסד'] || '';
  const institutionCode = row['קוד מוסד'] || '';
  const uniqueSymbol = row['סמל מאוחד'] || '';
  
  if (!name || !institutionCode || !uniqueSymbol) {
    throw new Error(`חסרים שדות חובה: שם מוסד: ${name}, קוד מוסד: ${institutionCode}, סמל מאוחד: ${uniqueSymbol}`);
  }
  
  const classData: any = {
    name: name,
    education: normalizeEducation(row['חינוך']),
    gender: normalizeGender(row['מין']),
    uniqueSymbol: uniqueSymbol,
    institutionName: name,
    institutionCode: institutionCode,
    type: normalizeType(row['סוג']),
    hasAfternoonCare: false,
    monthlyBudget: normalizeType(row['סוג']) === 'כיתה' ? 250 : 200,
    childresAmount: 0,
    isActive: true,
    description: '',
    workers: [],
  };


  if (row['רחוב']) {
    classData.address = `${row['רחוב']} ${row['מס רחוב'] || ''}`;
  }


  if (row['רחוב']) {
    classData.street = row['רחוב'];
  }
  if (row['מס רחוב']) {
    classData.streetNumber = row['מס רחוב'];
  }


  if (shouldAssignProject) {
    classData.projectCodes = [projectCode];
  }

  return classData;
};

export function parseMatsevetExcel(file: File, existingSymbols: string[], projectCode: number) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

      const newClasses: any[] = [];
      const existingClasses: any[] = [];

      for (const row of rows) {
        const symbol = row['סמל מאוחד']?.toString().trim();
        if (!symbol) continue;
        if (!existingSymbols.includes(symbol)) {
          const newClass = getDefaultClass(row, projectCode);
          newClasses.push(newClass);
        } else {
          existingClasses.push({ symbol, excelData: row });
        }
      }
      resolve({ newClasses, existingClasses });
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
} 