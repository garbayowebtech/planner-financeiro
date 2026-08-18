import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function TopCalendarBar() {
  const { calendarBar } = useApp();
  const [timeStr, setTimeStr] = useState('');
  const [dateFullStr, setDateFullStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);

      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      setDateFullStr(`${day}/${month}/${year}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!calendarBar) return null;

  return (
    <div id="top-calendar-bar" className="top-calendar-bar">
      <div className="calendar-content">
        <i className="fa-regular fa-calendar-days"></i>
        <span id="calendar-date" className="calendar-date-full">{dateFullStr}</span>
        <span id="calendar-date-short" className="calendar-date-short">{dateFullStr}</span>
        <span className="separator">•</span>
        <i className="fa-regular fa-clock"></i>
        <span id="calendar-time">{timeStr}</span>
      </div>
    </div>
  );
}
