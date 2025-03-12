import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, addDays, getDay, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { useFetchActivities } from '../../queries/activitiesQueries';
import './CustomCalendar.css';
import { Activity } from '../../types';

interface CalendarViewProps {
  setSelectedDate: (date: Date | null) => void;
  setActivitiesForSelectedDate: (activities: Activity[]) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ setSelectedDate, setActivitiesForSelectedDate }) => {
  const { data: activities = [], isLoading, error } = useFetchActivities();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  if (isLoading) return <p>טוען פעילויות...</p>;
  if (error) return <p>שגיאה בטעינת הפעילויות.</p>;

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const generateCalendarDays = (): (Date | null)[] => {
    const days: (Date | null)[] = [];
    let date = startDate;

    while (getDay(date) !== 0) {
      days.unshift(null);
      date = addDays(date, -1);
    }

    date = startDate;
    while (date <= endDate) {
      days.push(date);
      date = addDays(date, 1);
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  };

  const days = generateCalendarDays();

  const handleDayClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setActivitiesForSelectedDate(
        activities.filter((activity: Activity) => isSameDay(new Date(activity.date), date))
      );
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="nav-button" onClick={() => setCurrentDate(addDays(currentDate, -30))}>חודש קודם</button>
        <h2 className="current-month">{format(currentDate, 'MMMM yyyy', { locale: he })}</h2>
        <button className="nav-button" onClick={() => setCurrentDate(addDays(currentDate, 30))}>חודש הבא</button>
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${day ? 'active' : 'empty'}`}
            onClick={() => handleDayClick(day)}
          >
            <div className="calendar-day-number">{day ? format(day, 'd') : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
