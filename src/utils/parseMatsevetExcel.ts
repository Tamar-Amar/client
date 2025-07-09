import * as XLSX from 'xlsx';

// דוגמה למודל ברירת מחדל לפי server/src/models/Class.ts
// פונקציות נרמול לערכים תקניים
const normalizeGender = (val: string) => {
  const v = (val || '').trim();
  if (v === 'בנים' || v === 'בן') return 'בנים';
  if (v === 'בנות' || v === 'בת') return 'בנות';
  // ברירת מחדל
  return 'בנים';
};

const normalizeType = (val: string) => {
  const v = (val || '').trim();
  if (v === 'גן' || v === 'גן ילדים') return 'גן';
  if (v === 'כיתה' || v === 'כיתת') return 'כיתה';
  // ברירת מחדל
  return 'גן';
};

const normalizeEducation = (val: string) => {
  const v = (val || '').trim();
  if (v === 'רגיל' || v === 'רגילה') return 'רגיל';
  if (v === 'מיוחד' || v === 'מיוחדת') return 'מיוחד';
  // ברירת מחדל
  return 'רגיל';
};
const getDefaultClass = (row: any, projectCode: number) => {
  const shouldAssignProject = row['אישור פתיחה'] === 'כן';
  
  // ולידציה לשדות חובה
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

  // הוספת כתובת רק אם יש רחוב
  if (row['רחוב']) {
    classData.address = `${row['רחוב']} ${row['מס רחוב'] || ''}`;
  }

  // הוספת שדות נוספים רק אם הם לא ריקים
  if (row['רחוב']) {
    classData.street = row['רחוב'];
  }
  if (row['מס רחוב']) {
    classData.streetNumber = row['מס רחוב'];
  }

  // הוספת projectCodes רק אם צריך
  if (shouldAssignProject) {
    classData.projectCodes = [projectCode];
    console.log('הוספת projectCodes:', [projectCode], 'למסגרת:', name);
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
      console.log('שורות מהאקסל:', rows);

      const newClasses: any[] = [];
      const existingClasses: any[] = [];

      for (const row of rows) {
        const symbol = row['סמל מאוחד']?.toString().trim();
        if (!symbol) continue;
        if (!existingSymbols.includes(symbol)) {
          // מסגרת חדשה
          const newClass = getDefaultClass(row, projectCode);
          console.log('אובייקט מסגרת חדשה:', newClass);
          console.log('סמל מאוחד:', symbol);
          console.log('שם מוסד:', row['שם מוסד']);
          console.log('קוד מוסד:', row['קוד מוסד']);
          console.log('סוג:', row['סוג'], '->', normalizeType(row['סוג']));
          console.log('מין:', row['מין'], '->', normalizeGender(row['מין']));
          console.log('חינוך:', row['חינוך'], '->', normalizeEducation(row['חינוך']));
          console.log('כל השדות שנשלחים:', newClass);
          console.log('projectCodes במסגרת חדשה:', newClass.projectCodes);
          console.log('פירוט השדות:', {
            name: newClass.name,
            education: newClass.education,
            gender: newClass.gender,
            uniqueSymbol: newClass.uniqueSymbol,
            institutionName: newClass.institutionName,
            institutionCode: newClass.institutionCode,
            type: newClass.type,
            hasAfternoonCare: newClass.hasAfternoonCare,
            monthlyBudget: newClass.monthlyBudget,
            childresAmount: newClass.childresAmount,
            projectCodes: newClass.projectCodes,
            isActive: newClass.isActive,
            description: newClass.description,
            workers: newClass.workers
          });
          newClasses.push(newClass);
        } else {
          // מסגרת קיימת – נשמור את כל השדות מהאקסל להשוואה
          existingClasses.push({ symbol, excelData: row });
        }
      }
      resolve({ newClasses, existingClasses });
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
} 