import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, addDays, getDay, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import './CustomCalendar.css';
import { useFetchActivities } from '../queries/activitiesQueries';
import { Activity } from '../types/Activity';
import { useFetchClasses } from '../queries/classQueries';
import { Class } from '../types/Class';
import { Operator } from '../types/Operator';
import { useFetchOperators } from '../queries/operatorQueries';

const CustomCalendar: React.FC = () => {
  const { data: activities = [], isLoading, error } = useFetchActivities();
  const { data: classes = [], isLoading:isLoadingC , error: errorC } = useFetchClasses();
  const { data: operators = [], isLoading:isLoadingP , error: errorP } = useFetchOperators();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  if (isLoading) return <p>טוען כיתות...</p>;
  if (error) return <p>שגיאה בטעינת כיתות.</p>;

  if (isLoadingP) return <p>טוען מפעילים...</p>;
  if (errorP) return <p>שגיאה בטעינת מפעילים.</p>;

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

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDayClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleOperatorSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const operatorId = event.target.value;
    setSelectedOperatorId(operatorId || null);
    setSelectedClassId(null); // Reset class selection
    setSelectedDate(null);
  };

  const handleClassSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = event.target.value;
    setSelectedClassId(classId || null);
    setSelectedOperatorId(null); // Reset operator selection
    setSelectedDate(null);
  };

  const filteredActivities = activities.filter((activity: Activity) => {
    const matchesOperator = selectedOperatorId
      ? typeof activity.operatorId !== 'string' && activity.operatorId._id === selectedOperatorId
      : true;

    const matchesClass = selectedClassId
      ? typeof activity.classId !== 'string' && activity.classId._id === selectedClassId
      : true;

    return matchesOperator && matchesClass;
  });

  const activitiesForSelectedDate = selectedDate
    ? filteredActivities.filter((activity: Activity) =>
        isSameDay(new Date(activity.date), selectedDate)
      )
    : [];

  if (isLoading) return <p className="loading-text">טוען פעילויות...</p>;
  if (error) return <p className="error-text">שגיאה בטעינת פעילויות.</p>;

  return (
    <div className="calendar-container">
      <div className="filters">
      <div className="operator-select">
  <label htmlFor="operator">בחר מפעיל:</label>
  <select id="operator" onChange={handleOperatorSelect} value={selectedOperatorId || ''}>
    <option value="">-- כל המפעילים --</option>
    {operators
      .sort((a: Operator, b: Operator) =>
        (a.lastName || '').localeCompare(b.lastName || '')
      ) // ממיין לפי lastName, מטפל במקרה שבו הוא חסר
      .map((operator:Operator) => (
        <option key={operator._id} value={operator._id}>
          {operator.firstName} {operator.lastName}
        </option>
      ))}
  </select>
</div>


        <div className="class-select">
          <label htmlFor="class">בחר קבוצה:</label>
          <select id="class" onChange={handleClassSelect} value={selectedClassId || ''}>
        <option value="">-- כל הקבוצות --</option>
        {classes
          .sort((a: Class, b: Class) => a.uniqueSymbol.localeCompare(b.uniqueSymbol)) // ממיין לפי uniqueSymbol
          .map((cls: Class) => (
            <option key={cls._id} value={cls._id}>
              {cls.name} ({cls.uniqueSymbol})
            </option>
          ))}
      </select>
        </div>
      </div>
      <div className="calendar-header">
        <button className="nav-button" onClick={handlePrevMonth}>
          חודש קודם
        </button>
        <h2 className="current-month">{format(currentDate, 'MMMM yyyy', { locale: he })}</h2>
        <button className="nav-button" onClick={handleNextMonth}>
          חודש הבא
        </button>
      </div>
      <div className="calendar-grid">
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, index) => (
          <div key={index} className="calendar-day-header">
            {day}
          </div>
        ))}
{days.map((day, index) => {
  const activitiesForDay = filteredActivities.filter((activity: Activity) =>
    isSameDay(new Date(activity.date), day!)
  );

  return (
    <div
      key={index}
      className={`calendar-day ${day ? 'active' : 'empty'} ${
        selectedDate && isSameDay(day!, selectedDate) ? 'selected' : ''
      }`}
      onClick={() => handleDayClick(day)}
    >
      <div className="activity-symbols">
        {selectedOperatorId
          ? activitiesForDay.map((activity: Activity) => (
              <div key={activity._id} className="activity-symbol-box">
                {typeof activity.classId === 'string'
                  ? 'לא ידוע'
                  : activity.classId.uniqueSymbol}
              </div>
            ))
          : selectedClassId
          ? activitiesForDay.map((activity: Activity) => (
              <div key={activity._id} className="activity-symbol-box">
                {typeof activity.operatorId === 'string'
                  ? 'לא ידוע'
                  : `${activity.operatorId.firstName} ${activity.operatorId.lastName}`}
              </div>
            ))
          : activitiesForDay.map((activity: Activity) => (
              <div key={activity._id} className="activity-symbol-box">
                {typeof activity.classId === 'string'
                  ? 'לא ידוע'
                  : activity.classId.uniqueSymbol}
              </div>
            ))}
      </div>
      <div className="calendar-day-number">{day ? format(day, 'd') : ''}</div>
    </div>
  );
})}

      </div>
      {selectedDate && (
        <div className="activity-details">
          <h3>פעילויות בתאריך {format(selectedDate, 'dd/MM/yyyy', { locale: he })}</h3>
          {activitiesForSelectedDate.length > 0 ? (
            <ul className="activity-list">
              {activitiesForSelectedDate.map((activity: Activity) => {
                const operatorName =
                  typeof activity.operatorId === 'string'
                    ? 'לא ידוע'
                    : `${activity.operatorId.firstName} ${activity.operatorId.lastName}`;

                const className =
                  typeof activity.classId === 'string'
                    ? 'לא ידוע'
                    : activity.classId.name;

                return (
                  <li key={activity._id} className="activity-item">
                    <strong>מפעיל:</strong> {operatorName} <br />
                    <strong>קבוצה:</strong> {className}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="no-activities">אין פעילויות בתאריך זה.</p>
          )}
        </div>
      )}

    </div>
  );
};

export default CustomCalendar;
