import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import './CustomCalendar.css';
import { Activity } from '../../types';

interface DayDetailsProps {
  selectedDate: Date | null;
  activities: Activity[];
}

const DayDetails: React.FC<DayDetailsProps> = ({ selectedDate, activities }) => {
  return (
    <div className="details-panel">
      {selectedDate ? (
        <div>
          <h3>פעילויות בתאריך {format(selectedDate, 'dd/MM/yyyy', { locale: he })}</h3>
          {activities.length > 0 ? (
            <ul className="activity-list">
              {activities.map((activity: Activity) => (
                <li key={activity._id} className="activity-item">
                  <strong>מפעיל:</strong> {typeof activity.operatorId === 'string' ? 'לא ידוע' : `${activity.operatorId.firstName} ${activity.operatorId.lastName}`}<br />
                  <strong>קבוצה:</strong> {typeof activity.classId === 'string' ? 'לא ידוע' : activity.classId.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>אין פעילויות בתאריך זה.</p>
          )}
        </div>
      ) : (
        <h3>בחר יום להצגת פעילויות</h3>
      )}
    </div>
  );
};

export default DayDetails;
