import { Activity } from '../types/Activity';
import { SetStateAction } from 'react';

// הוספת פעילות חדשה
export const handleActivityAdded = async (
  newActivities: Activity[],
  addActivityMutation: any,
  setOpenDialog: React.Dispatch<SetStateAction<boolean>>
) => {
  for (const activity of newActivities) {
    await addActivityMutation.mutateAsync(activity);
  }
  setOpenDialog(false);
};

// Delete selected rows
export const handleDeleteSelected = (
  selectedRows: Set<string>,
  deleteActivity: any,
  setSelectedRows: React.Dispatch<SetStateAction<Set<string>>>
) => {
  if (selectedRows.size === 0) {
    alert('בחר לפחות שורה אחת למחיקה');
    return;
  }
  if (window.confirm('האם אתה בטוח שברצונך למחוק את הפעילויות שנבחרו?')) {
    selectedRows.forEach((id) => deleteActivity(id));
    setSelectedRows(new Set());
  }
};

// ניהול בחירת שורות
export const handleRowSelect = (
  id: string,
  setSelectedRows: React.Dispatch<SetStateAction<Set<string>>>
) => {
  setSelectedRows((prev) => {
    const updated = new Set(prev);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    return updated;
  });
};
