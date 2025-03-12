import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, addDays, getDay, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import './CustomCalendar.css';
import { useFetchActivities } from '../../queries/activitiesQueries';
import { Activity, Operator } from '../../types/index';
import { useFetchClasses } from '../../queries/classQueries';
import { Class } from '../../types/index';
import { useFetchOperators } from '../../queries/operatorQueries';

const CustomCalendar: React.FC = () => {
  const { data: activities = [], isLoading, error } = useFetchActivities();
  const { data: classes = [], isLoading: isLoadingC, error: errorC } = useFetchClasses();
  const { data: operators = [], isLoading: isLoadingP, error: errorP } = useFetchOperators();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailedViewDate, setDetailedViewDate] = useState<Date | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  if (isLoading || isLoadingP || isLoadingC) return <p>טוען נתונים...</p>;
  if (error || errorP || errorC) return <p>שגיאה בטעינת הנתונים.</p>;

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
    setDetailedViewDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
    setDetailedViewDate(null);
  };

  const handleDayClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setDetailedViewDate(null);
    }
  };

  const handleOperatorSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOperatorId(event.target.value || null);
    setSelectedClassId(null);
    setSelectedDate(null);
    setDetailedViewDate(null);
  };

  const handleClassSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassId(event.target.value || null);
    setSelectedOperatorId(null);
    setSelectedDate(null);
    setDetailedViewDate(null);
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

  return (
    <div className="calendar-layout">
      {/* עמודת פירוט - מוצגת בצד שמאל */}
      <div className="details-panel">
        {detailedViewDate ? (
          <div>
            <h3>פעילויות ב-{format(detailedViewDate, 'dd/MM/yyyy', { locale: he })}</h3>
            {filteredActivities
              .filter((activity: Activity) => isSameDay(new Date(activity.date), detailedViewDate))
              .map((activity: Activity) => (
                <div key={activity._id} className="activity-detail-item">
                  <strong>מפעיל:</strong> {typeof activity.operatorId === 'string' ? 'לא ידוע' : `${activity.operatorId.firstName} ${activity.operatorId.lastName}`}
                  <br />
                  <strong>קבוצה:</strong> {typeof activity.classId === 'string' ? 'לא ידוע' : activity.classId.name}
                </div>
              ))}
          </div>
        ) : (
          <h3>בחר יום להצגת פעילויות</h3>
        )}
      </div>

      {/* עמודת היומן - מוצגת בצד ימין */}
      <div className="calendar-container">
        <div className="filters">
          <div className="operator-select">
            <label htmlFor="operator">בחר מפעיל:</label>
            <select id="operator" onChange={handleOperatorSelect} value={selectedOperatorId || ''}>
              <option value="">-- כל המפעילים --</option>
              {operators.map((operator: Operator) => (
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
              {classes.map((cls: Class) => (
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
                  {activitiesForDay.length > 4 ? (
                    <>
                      {activitiesForDay.slice(0, 4).map((activity: Activity) => (
                        <div key={activity._id} className="activity-symbol-box">
                          {typeof activity.classId === 'string'
                            ? 'לא ידוע'
                            : activity.classId.uniqueSymbol}
                        </div>
                      ))}
                      <button
                        className="more-activities-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailedViewDate(day);
                        }}
                      >
                        +
                      </button>
                    </>
                  ) : (
                    activitiesForDay.map((activity: Activity) => (
                      <div key={activity._id} className="activity-symbol-box">
                        {typeof activity.classId === 'string'
                          ? 'לא ידוע'
                          : activity.classId.uniqueSymbol}
                      </div>
                    ))
                  )}
                </div>
                <div className="calendar-day-number">{day ? format(day, 'd') : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomCalendar;
