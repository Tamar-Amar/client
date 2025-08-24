
export const projectNames: { [key: number]: string } = {
  1: "צהרון 2025",
  2: "קייטנת חנוכה 2025", 
  3: "קייטנת פסח 2025",
  4: "קייטנת קיץ 2025",
  5: "צהרון 2026",
  6: "קייטנת חנוכה 2026",
  7: "קייטנת פסח 2026",
  8: "קייטנת קיץ 2026"
};

export const projectOptions = [
  //{ value: 1, label: "צהרון 2025" },
  //{ value: 2, label: "קייטנת חנוכה 2025" },
  //{ value: 3, label: "קייטנת פסח 2025" },
  { value: 4, label: "קייטנת קיץ 2025" },
  { value: 5, label: "צהרון 2026" },
  //{ value: 6, label: "קייטנת חנוכה 2026" },
  //{ value: 7, label: "קייטנת פסח 2026" },
  //{ value: 8, label: "קייטנת קיץ 2026" }
];

export const convertBooleanFieldsToProjectCodes = (worker: any): number[] => {
  const projectCodes: number[] = [];
  
  if (worker.isAfterNoon) projectCodes.push(1);
  if (worker.isHanukaCamp) projectCodes.push(2);
  if (worker.isPassoverCamp) projectCodes.push(3);
  if (worker.isSummerCamp) projectCodes.push(4);
  
  return projectCodes;
};

export const isWorkerInProject = (worker: any, projectCode: number): boolean => {
  if (!worker.projectCodes || !Array.isArray(worker.projectCodes)) {
    return false;
  }
  return worker.projectCodes.includes(projectCode);
};

export const getWorkerProjectNames = (worker: any): string[] => {
  if (!worker.projectCodes || !Array.isArray(worker.projectCodes)) {
    return [];
  }
  
  return worker.projectCodes
    .map((code: number) => projectNames[code])
    .filter(Boolean);
};

export const hasActiveProjects = (worker: any): boolean => {
  return worker.projectCodes && Array.isArray(worker.projectCodes) && worker.projectCodes.length > 0;
};

export const getWorkerProjectCount = (worker: any): number => {
  if (!worker.projectCodes || !Array.isArray(worker.projectCodes)) {
    return 0;
  }
  return worker.projectCodes.length;
}; 