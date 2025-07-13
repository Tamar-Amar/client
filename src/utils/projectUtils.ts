// פונקציות עזר לעבודה עם פרויקטים

export const projectNames: { [key: number]: string } = {
  1: "צהרון שוטף 2025",
  2: "קייטנת חנוכה 2025", 
  3: "קייטנת פסח 2025",
  4: "קייטנת קיץ 2025"
};

// המרת שדות בוליאניים ישנים ל-projectCodes
export const convertBooleanFieldsToProjectCodes = (worker: any): number[] => {
  const projectCodes: number[] = [];
  
  if (worker.isAfterNoon) projectCodes.push(1);
  if (worker.isHanukaCamp) projectCodes.push(2);
  if (worker.isPassoverCamp) projectCodes.push(3);
  if (worker.isSummerCamp) projectCodes.push(4);
  
  return projectCodes;
};

// בדיקה אם עובד שייך לפרויקט מסוים
export const isWorkerInProject = (worker: any, projectCode: number): boolean => {
  if (!worker.projectCodes || !Array.isArray(worker.projectCodes)) {
    return false;
  }
  return worker.projectCodes.includes(projectCode);
};

// קבלת שמות הפרויקטים של עובד
export const getWorkerProjectNames = (worker: any): string[] => {
  if (!worker.projectCodes || !Array.isArray(worker.projectCodes)) {
    return [];
  }
  
  return worker.projectCodes
    .map((code: number) => projectNames[code])
    .filter(Boolean);
};

// בדיקה אם עובד פעיל בפרויקטים
export const hasActiveProjects = (worker: any): boolean => {
  return worker.projectCodes && Array.isArray(worker.projectCodes) && worker.projectCodes.length > 0;
};

// קבלת מספר הפרויקטים של עובד
export const getWorkerProjectCount = (worker: any): number => {
  if (!worker.projectCodes || !Array.isArray(worker.projectCodes)) {
    return 0;
  }
  return worker.projectCodes.length;
}; 