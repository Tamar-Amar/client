// activitiesUtils.ts
import { Activity } from '../../types';
import * as XLSX from 'xlsx';

export interface AggregatedRow {
  month: string;
  operator: string;
  groupName: string;
  groupSymbol: string;
  compositeKey: string;
  count: number;
  activities: Activity[];
}

export const exportAnnualReportExcel = (
  activities: Activity[],
  detailInfo: any,
  detailYear: string
) => {
  if (!detailYear || !detailInfo) return;

  const year = parseInt(detailYear, 10);
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  let filteredActivities: Activity[] = [];
  if (detailInfo.type === 'group') {
    filteredActivities = activities.filter(a => {
      if (typeof a.classId === 'string') return false;
      if (
        a.classId.name !== detailInfo.groupName ||
        a.classId.uniqueSymbol !== detailInfo.groupSymbol
      ) {
        return false;
      }
      const date = new Date(a.date);
      return date >= startDate && date <= endDate;
    });
  } else if (detailInfo.type === 'operator') {
    filteredActivities = activities.filter(a => {
      if (typeof a.operatorId === 'string') return false;
      const opName = `${a.operatorId.firstName} ${a.operatorId.lastName}`;
      if (opName !== detailInfo.operator) return false;
      const date = new Date(a.date);
      return date >= startDate && date <= endDate;
    });
  }

  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];

  // יצירת מבנה מתאים עם עמודות לפי חודשים
  const reportData: any[] = [];

  // כותרת ראשית
  reportData.push(["סמל", detailInfo.groupSymbol, "", "", "", "", "", "", "", "", "", "", ""]);
  reportData.push(["שם", detailInfo.groupName, "", "", "", "", "", "", "", "", "", "", ""]);
  reportData.push(["", "", "", "", "", "", "", "", "", "", "", "", ""]);
  
  // שורת כותרת חודשי פעילות
  const headerRow = ["חודש"];
  months.forEach(month => {
    headerRow.push("תאריך");
    headerRow.push("מפעיל");
  });
  headerRow.push("סה\"כ בחודש זה");
  reportData.push(headerRow);

  // יצירת מבנה החודשים עם הנתונים
  months.forEach((month, monthIndex) => {
    const monthActivities = filteredActivities.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === monthIndex;
    });
  
    // יוצרים שורה אחת לכל חודש
    const row: any[] = [month];
  
    // מוסיפים עד 5 הפעלות מקסימום
    for (let j = 0; j < 5; j++) {
      if (monthActivities[j]) {
        const activity = monthActivities[j];

        // בודקים האם `operatorId` הוא מחרוזת או אובייקט
        const operatorName = typeof activity.operatorId === 'string'
          ? 'לא ידוע'
          : `${activity.operatorId?.firstName ?? 'לא ידוע'} ${activity.operatorId?.lastName ?? ''}`.trim();
    
        row.push(new Date(activity.date).toLocaleDateString('he-IL'));
        row.push(operatorName);
      } else {
        row.push(""); // אם אין נתונים, מוסיפים תאים ריקים
        row.push("");
      }
    }
  
    row.push(monthActivities.length); // עמודת סכום כולל
    reportData.push(row);
  });
  

  // יצירת גיליון עבודה (worksheet)
  const worksheet = XLSX.utils.aoa_to_sheet(reportData);

  // קביעת רוחב עמודות
  worksheet['!cols'] = [
    { wch: 10 }, // חודש
    { wch: 12 }, { wch: 20 }, // תאריך + מפעיל חודשי
    { wch: 12 }, { wch: 20 },
    { wch: 12 }, { wch: 20 },
    { wch: 12 }, { wch: 20 },
    { wch: 12 }, { wch: 20 },
    { wch: 12 }, { wch: 20 },
    { wch: 15 }, // סה"כ בחודש
  ];

  // יצירת ספר עבודה
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "דוח שנתי");

  // שמירת הקובץ
  XLSX.writeFile(workbook, `דוח_שנתי_${detailInfo.groupSymbol}.xlsx`);
};

export interface DetailInfo {
  type: 'operator' | 'group';
  operator?: string;
  totalActivities: number;
  groups?: { name: string; symbol: string }[];
  groupName?: string;
  groupSymbol?: string;
  operators?: string[];
}

export const exportMonthlyReportExcel = (activities: Activity[], detailInfo: any, detailMonth: string) => {
    console.log('exportMonthlyReportExcel', detailInfo);
    if (!detailMonth || !detailInfo) return;
    const [yearStr, monthStr] = detailMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
  
    // תאריך סיום: 25 של החודש הנבחר (כולל)
    const endDate = new Date(year, month - 1, 25, 23, 59, 59, 999);
    // תאריך התחלה: 26 של החודש הקודם (כולל)
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const startDate = new Date(prevYear, prevMonth - 1, 26, 0, 0, 0, 0);
  
    let filteredActivities: Activity[] = [];
    if (detailInfo.type === 'group') {
      filteredActivities = activities.filter(a => {
        if (typeof a.classId === 'string') return false;
        if (a.classId.name !== detailInfo.groupName || a.classId.uniqueSymbol !== detailInfo.groupSymbol) return false;
        const date = new Date(a.date);
        return date >= startDate && date <= endDate;
      });
    } else if (detailInfo.type === 'operator') {
      filteredActivities = activities.filter(a => {
        if (typeof a.operatorId === 'string') return false;
        const opName = `${a.operatorId.firstName} ${a.operatorId.lastName}`;
        if (opName !== detailInfo.operator) return false;
        const date = new Date(a.date);
        return date >= startDate && date <= endDate;
      });
    }
  
    const exportData = filteredActivities.map(a => ({
        'סמל': typeof a.classId === 'string' ? 'לא ידוע' : a.classId.uniqueSymbol,
        'שם': typeof a.classId === 'string' ? 'לא ידוע' : a.classId.name,
        'מפעיל': typeof a.operatorId === 'string' ? 'לא ידוע' : `${a.operatorId.firstName} ${a.operatorId.lastName}`,
        'תאריך': new Date(a.date).toLocaleDateString('he-IL')
      }));

  
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "דוח חודשי");
    XLSX.writeFile(workbook, "דוח_חודשי.xlsx");
  };

  export const getTotalActivities = (activities: Activity[]): number => {
    return activities.length;
  };
  
  export const getTotalMonthlyActivities = (activities: Activity[], selectedMonth: string): number => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return activities.filter((activity) => {
      const activityDate = new Date(activity.date);
      return activityDate.getFullYear() === year && activityDate.getMonth() + 1 === month;
    }).length;
  };

  
  export const exportGeneralAnnualReport = (activities: Activity[]) => {
    // טווח חודשים: מנובמבר 2024 עד יוני 2025
    const startDate = new Date(2024, 10, 1); // נובמבר 2024 (0-based index)
    const endDate = new Date(2025, 5, 30, 23, 59, 59, 999); // יוני 2025
  
    const months = ["נובמבר", "דצמבר", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני"];
    const monthIndices = [10, 11, 0, 1, 2, 3, 4, 5]; // המיקומים של החודשים הללו בתאריך
  
    // חישוב מספר ההפעלות לכל קבוצה לפי חודש
    const reportData: Record<string, number[]> = {};
  
    activities.forEach(activity => {
      if (typeof activity.classId === 'string') return;
  
      const groupKey = `${activity.classId.uniqueSymbol} - ${activity.classId.name}`;
      const date = new Date(activity.date);
      if (date < startDate || date > endDate) return;
  
      const monthIndex = monthIndices.indexOf(date.getMonth());
      if (monthIndex === -1) return;
  
      if (!reportData[groupKey]) {
        reportData[groupKey] = new Array(8).fill(0);
      }
      reportData[groupKey][monthIndex]++;
    });
  
    // הכנת הנתונים לאקסל (המרת מספרים למחרוזות)
    const excelData: string[][] = [["סמל+שם", ...months, "סה\"כ הפעלות"]];
    Object.entries(reportData).forEach(([group, monthData]) => {
      excelData.push([
        group,
        ...monthData.map(num => num.toString()), // המרת מספרים למחרוזות
        monthData.reduce((sum, val) => sum + val, 0).toString() // סכום כולל
      ]);
    });
  
    // יצירת גיליון עבודה
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "דוח שנתי כללי");
  
    // שמירת הקובץ
    XLSX.writeFile(workbook, `דוח_שנתי_כללי.xlsx`);
  };
  

// export const getAggregatedDataO = (activities: Activity[]): AggregatedRow[] => {
//   const groups: Record<string, AggregatedRow> = {};
//   activities.forEach(activity => {
//     const date = new Date(activity.date);
//     const monthStr = date.toLocaleString('he-IL', { month: 'long', year: 'numeric' });
//     const operatorName =
//       typeof activity.operatorId === 'string'
//         ? 'לא ידוע'
//         : `${activity.operatorId.firstName} ${activity.operatorId.lastName}`;
//     const groupName =
//       typeof activity.classId === 'string'
//         ? 'לא ידוע'
//         : activity.classId.name;
//     const groupSymbol =
//       typeof activity.classId === 'string'
//         ? 'לא ידוע'
//         : activity.classId.uniqueSymbol;
//     const compositeKey = `${groupSymbol} ${groupName}`.trim();
//     const key = `${monthStr} ${operatorName} ${groupName} ${groupSymbol}`;
//     if (!groups[key]) {
//       groups[key] = {
//         month: monthStr,
//         operator: operatorName,
//         groupName,
//         groupSymbol,
//         compositeKey,
//         count: 0,
//       };
//     }
//     groups[key].count++;
//   });
//   return Object.values(groups);
// };

export const getAggregatedData = (activities: Activity[]): AggregatedRow[] => {
  const groups: Record<string, AggregatedRow> = {};

  activities.forEach(activity => {
    const date = new Date(activity.date);
    const monthStr = date.toLocaleString('he-IL', { month: 'long', year: 'numeric' });
    const operatorName =
      typeof activity.operatorId === 'string'
        ? 'לא ידוע'
        : `${activity.operatorId.firstName} ${activity.operatorId.lastName}`;
    const groupName =
      typeof activity.classId === 'string'
        ? 'לא ידוע'
        : activity.classId.name;
    const groupSymbol =
      typeof activity.classId === 'string'
        ? 'לא ידוע'
        : activity.classId.uniqueSymbol;
    const compositeKey = `${groupSymbol} ${groupName}`.trim();
    const key = `${monthStr} ${operatorName} ${groupName} ${groupSymbol}`;

    if (!groups[key]) {
      groups[key] = {
        month: monthStr,
        operator: operatorName,
        groupName,
        groupSymbol,
        compositeKey,
        count: 0,
        activities: [] // נוסיף כאן רשימה של הפעילויות
      };
    }

    groups[key].count++;
    groups[key].activities.push(activity); // נוסיף את הפעילות כאן
  });

  return Object.values(groups);
};


export const getMonthOptions = (aggregatedData: AggregatedRow[]): string[] => {
  const set = new Set<string>();
  aggregatedData.forEach(item => set.add(item.month));
  return Array.from(set);
};

export const getOperatorOptions = (aggregatedData: AggregatedRow[]): string[] => {
  const set = new Set<string>();
  aggregatedData.forEach(item => set.add(item.operator));
  return Array.from(set);
};

export const getGroupOptions = (aggregatedData: AggregatedRow[]): string[] => {
  const groupsSet = new Set<string>();
  aggregatedData.forEach(item => groupsSet.add(item.compositeKey));
  return Array.from(groupsSet);
};

export const filterAggregatedData = (
  aggregatedData: AggregatedRow[],
  filterMonth: string,
  filterOperator: string,
  filterGroup: string
): AggregatedRow[] => {
  return aggregatedData.filter(item => {
    let match = true;
    if (filterMonth !== "all") {
      match = match && (item.month === filterMonth);
    }
    if (filterOperator !== "all") {
      match = match && (item.operator === filterOperator);
    }
    if (filterGroup !== "all") {
      match = match && (item.compositeKey === filterGroup);
    }
    return match;
  });
};


export const getDetailInfo = (
  aggregatedData: AggregatedRow[],
  filterOperator: string,
  filterGroup: string
): DetailInfo | null => {
  if (filterOperator !== "all" && filterGroup === "all") {
    const relevantRows = aggregatedData.filter(item => item.operator === filterOperator);
    const groupSet = new Map<string, { name: string; symbol: string }>();
    
    relevantRows.forEach(item => {
      groupSet.set(item.compositeKey, { name: item.groupName, symbol: item.groupSymbol });
    });

    const totalActivities = relevantRows.reduce((sum, item) => sum + item.count, 0);

    return {
      type: 'operator', // **תיקון הבעיה – קביעה מפורשת של "operator"**
      operator: filterOperator,
      totalActivities,
      groups: Array.from(groupSet.values()),
    };
  } 
  else if (filterGroup !== "all" && filterOperator === "all") {
    const relevantRows = aggregatedData.filter(item => item.compositeKey === filterGroup);
    if (relevantRows.length === 0) return null;

    const groupSymbol = relevantRows[0].groupSymbol;
    const groupName = relevantRows[0].groupName;
    const totalActivities = relevantRows.reduce((sum, item) => sum + item.count, 0);
    const operatorSet = new Set<string>();

    relevantRows.forEach(item => {
      operatorSet.add(item.operator);
    });

    return {
      type: 'group', // **תיקון הבעיה – קביעה מפורשת של "group"**
      groupName,
      groupSymbol,
      totalActivities,
      operators: Array.from(operatorSet),
    };
  }

  return null;
};


export const getMonthlyCountForOperator = (
  activities: Activity[],
  detailInfo: any,
  detailMonth: string
): number => {
  if (!detailInfo || detailInfo.type !== 'operator' || !detailMonth) return 0;
  const [yearStr, monthStr] = detailMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const endDate = new Date(year, month - 1, 25, 23, 59, 59, 999);
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const startDate = new Date(prevYear, prevMonth - 1, 26, 0, 0, 0, 0);
  const relevantActivities = activities.filter(a => {
    if (typeof a.operatorId === 'string') return false;
    const opName = `${a.operatorId.firstName} ${a.operatorId.lastName}`;
    if (opName !== detailInfo.operator) return false;
    const date = new Date(a.date);
    return date >= startDate && date <= endDate;
  });
  return relevantActivities.length;
};

export const getMonthlyCountForGroupO = (
  activities: Activity[],
  detailInfo: any,
  detailMonth: string
): number => {
  if (!detailInfo || detailInfo.type !== 'group' || !detailMonth) return 0;
  const [yearStr, monthStr] = detailMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const endDate = new Date(year, month - 1, 25, 23, 59, 59, 999);
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const startDate = new Date(prevYear, prevMonth - 1, 26, 0, 0, 0, 0);
  const relevantActivities = activities.filter(a => {
    if (typeof a.classId === 'string') return false;
    if (a.classId.name !== detailInfo.groupName) return false;
    const date = new Date(a.date);
    return date >= startDate && date <= endDate;
  });
  return relevantActivities.length;
};

export const getMonthlyCountForGroup = (
  activities: Activity[],
  detailInfo: DetailInfo,
  detailMonth: string
): number => {
  if (!detailInfo || detailInfo.type !== 'group' || !detailMonth) return 0;

  const [yearStr, monthStr] = detailMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  
  const endDate = new Date(year, month - 1, 25, 23, 59, 59, 999);
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const startDate = new Date(prevYear, prevMonth - 1, 26, 0, 0, 0, 0);

  const relevantActivities = activities.filter(a => {
    if (!a.classId) return false;

    // בדיקה אם `classId` הוא אובייקט או מחרוזת
    const groupName = typeof a.classId === 'string' ? '' : a.classId.name;
    const groupSymbol = typeof a.classId === 'string' ? '' : a.classId.uniqueSymbol;

    if (groupName !== detailInfo.groupName || groupSymbol !== detailInfo.groupSymbol) return false;
    
    const date = new Date(a.date);
    return date >= startDate && date <= endDate;
  });

  return relevantActivities.length;
};






export const exportDetailedAnnualReport = (activities: Activity[]) => {
  // טווח חודשים מנובמבר 2024 עד יוני 2025
  const months = ["נובמבר", "דצמבר", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני"];
  const monthIndices = [10, 11, 0, 1, 2, 3, 4, 5]; // התאמת החודשים לתאריכים
  const MAX_ACTIVITIES_PER_MONTH = 5; // מקסימום 5 הפעלות בחודש

  // יצירת מבנה נתונים לאקסל
  const reportData: Record<string, { entries: { date: string, operator: string }[], total: number }[]> = {};

  activities.forEach(activity => {
    if (typeof activity.classId === 'string') return;

    const groupKey = `${activity.classId.uniqueSymbol} - ${activity.classId.name}`;
    const date = new Date(activity.date);
    const monthIndex = monthIndices.indexOf(date.getMonth());

    if (monthIndex === -1) return; // אם מחוץ לטווח

    if (!reportData[groupKey]) {
      reportData[groupKey] = Array.from({ length: months.length }, () => ({
        entries: [],
        total: 0
      }));
    }

    // בודקים אם עדיין יש מקום להוסיף הפעלה בחודש זה
    const monthData = reportData[groupKey][monthIndex];

    if (monthData.entries.length < MAX_ACTIVITIES_PER_MONTH) {
      monthData.entries.push({
        date: date.toLocaleDateString('he-IL'),
        operator: typeof activity.operatorId === 'string'
          ? 'לא ידוע'
          : `${activity.operatorId.firstName} ${activity.operatorId.lastName}`
      });
    }

    monthData.total += 1; // עדכון סה"כ הפעלות בחודש
  });

  // הכנת הנתונים לאקסל
  const excelData: any[] = [];

  // יצירת כותרת ראשית
  const headerRow = ["סמל", "שם"];
  months.forEach(month => {
    for (let i = 1; i <= MAX_ACTIVITIES_PER_MONTH; i++) {
      headerRow.push(`תאריך ${i} - ${month}`);
      headerRow.push(`מפעיל ${i} - ${month}`);
    }
    headerRow.push(`סה"כ - ${month}`);
  });
  headerRow.push(`סה"כ שנתי`);
  excelData.push(headerRow);

  // הוספת נתוני הקבוצות
  Object.entries(reportData).forEach(([groupKey, monthDataArray]) => {
    const [symbol, name] = groupKey.split(" - ");
    const row: any[] = [symbol, name];

    let totalYearly = 0;

    monthDataArray.forEach(monthData => {
      for (let i = 0; i < MAX_ACTIVITIES_PER_MONTH; i++) {
        if (monthData.entries[i]) {
          row.push(monthData.entries[i].date);
          row.push(monthData.entries[i].operator);
        } else {
          row.push(""); // אין תאריך
          row.push(""); // אין מפעיל
        }
      }
      row.push(monthData.total); // מוסיף סה"כ לחודש
      totalYearly += monthData.total;
    });

    row.push(totalYearly); // מוסיף סה"כ שנתי
    excelData.push(row);
  });

  // יצירת גיליון עבודה ושמירה לקובץ
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "דוח שנתי מפורט");

  // שמירת הקובץ
  XLSX.writeFile(workbook, "דוח_שנתי_מפורט.xlsx");
};


