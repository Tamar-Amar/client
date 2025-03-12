import React, { useState } from 'react';

import './CustomCalendar.css';
import DayDetails from './DayDetails';
import CalendarView from './CalendarView';
import { Activity } from '../../types';

const CustomCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activitiesForSelectedDate, setActivitiesForSelectedDate] = useState<Activity[]>([]);

  return (
    <div className="calendar-layout">
      {/* קומפוננטה של פירוט הפעילויות (צד שמאל) */}
      <DayDetails selectedDate={selectedDate} activities={activitiesForSelectedDate} />

      {/* קומפוננטה של היומן (צד ימין) */}
      <CalendarView 
        setSelectedDate={setSelectedDate} 
        setActivitiesForSelectedDate={setActivitiesForSelectedDate} 
      />
    </div>
  );
};

export default CustomCalendar;
