import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const ZOOM_LINK = 'https://lehigh.zoom.us/j/98398084113';

const events = [
  {
    id: 1,
    title: 'Class Meeting',
    date: new Date(2026, 3, 7),
    startHour: 17,
    startMinute: 30,
    endHour: 18,
    endMinute: 0,
    color: '#1a73e8',
    zoomLink: ZOOM_LINK,
  }
];

function Calendar() { 
  const location = useLocation();
  const passedDate = location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date();

  const [selectedDate, setSelectedDate] = useState(passedDate);
  const [panelDate, setPanelDate] = useState(passedDate);
  const [viewMode, setViewMode] = useState('day');

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollTo = (now.getHours() * 60 + now.getMinutes()) - 60;
      scrollRef.current.scrollTop = scrollTo > 0 ? scrollTo : 0;
    }
  }, []);

  const daysInMonth = new Date(panelDate.getFullYear(), panelDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(panelDate.getFullYear(), panelDate.getMonth(), 1).getDay();

  const handleYearClick = (year) => {
    setPanelDate(new Date(year, panelDate.getMonth(), 1));
    setViewMode('month');
  };

  const handleMonthClick = (monthIndex) => {
    setPanelDate(new Date(panelDate.getFullYear(), monthIndex, 1));
    setViewMode('day');
  };

  const handleDayClick = (day) => {
    const newDate = new Date(panelDate.getFullYear(), panelDate.getMonth(), day);
    setSelectedDate(newDate);
    setPanelDate(newDate); 
  };

  const renderYearView = () => {
    const currentYear = panelDate.getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => currentYear - 5 + i);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
        {years.map(y => (
          <div
            key={y}
            onClick={() => handleYearClick(y)}
            className="calendar-day-hover"
            style={{ 
              padding: '15px 0', 
              textAlign: 'center', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              backgroundColor: y === selectedDate.getFullYear() ? '#333' : 'transparent', 
              color: y === selectedDate.getFullYear() ? '#fff' : '#333',
              fontWeight: y === selectedDate.getFullYear() ? 'bold' : 'normal' 
            }}
          >
            {y}
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
        {months.map((m, index) => (
          <div
            key={m}
            onClick={() => handleMonthClick(index)}
            className="calendar-day-hover"
            style={{ 
              padding: '15px 0', 
              textAlign: 'center', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              backgroundColor: index === selectedDate.getMonth() && panelDate.getFullYear() === selectedDate.getFullYear() ? '#333' : 'transparent', 
              color: index === selectedDate.getMonth() && panelDate.getFullYear() === selectedDate.getFullYear() ? '#fff' : '#333',
              fontWeight: index === selectedDate.getMonth() && panelDate.getFullYear() === selectedDate.getFullYear() ? 'bold' : 'normal' 
            }}
          >
            {m}
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', marginTop: '10px' }}>
        {weekDays.map((d, i) => (
          <div key={'header-' + i} style={{ fontWeight: 'bold', fontSize: '12px', paddingBottom: '10px', color: '#333' }}>{d}</div>
        ))}
        {blanks.map(b => <div key={'blank-' + b} />)}
        {days.map(d => {
          const isSelected = d === selectedDate.getDate() && panelDate.getMonth() === selectedDate.getMonth() && panelDate.getFullYear() === selectedDate.getFullYear();
          return (
            <div
              key={d}
              onClick={() => handleDayClick(d)}
              className="calendar-day-hover"
              style={{
                width: '30px', 
                height: '30px', 
                lineHeight: '30px', 
                margin: '0 auto', 
                borderRadius: '50%', 
                cursor: 'pointer', 
                fontSize: '14px',
                backgroundColor: isSelected ? '#333' : 'transparent',
                color: isSelected ? '#fff' : '#333',
                fontWeight: isSelected ? 'bold' : 'normal'
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    );
  };

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 24 }, (_, i) => {
    if (i === 0) return '12 AM';
    if (i < 12) return i + ' AM';
    if (i === 12) return '12 PM';
    return (i - 12) + ' PM';
  });

  const getEventBlocks = () => {
    return events.map(event => {
      const dayIndex = weekDates.findIndex(d =>
        d.getFullYear() === event.date.getFullYear() &&
        d.getMonth() === event.date.getMonth() &&
        d.getDate() === event.date.getDate()
      );
      if (dayIndex === -1) return null;
      const topPx = event.startHour * 60 + event.startMinute;
      const heightPx = (event.endHour * 60 + event.endMinute) - topPx;
      return { ...event, dayIndex, topPx, heightPx };
    }).filter(Boolean);
  };

  const eventBlocks = getEventBlocks();
  const isEventDay = selectedDate.getFullYear() === 2026 && selectedDate.getMonth() === 3 && selectedDate.getDate() === 7;

  const monthName = panelDate.toLocaleString('en-US', { month: 'long' });

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: '#f0f2f5', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '16px',
      color: '#111'
    }}>
      <Sidebar />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '20px', gap: '20px' }}>
          
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '15px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '10px 0' }}>
              <div style={{ width: '60px' }}></div>
              {weekDates.map((date, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>{date.getDate()}</div>
                </div>
              ))}
            </div>

            <div ref={scrollRef} className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
              {hours.map((time, i) => (
                <div key={i} style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', height: '60px' }}>
                  <div style={{ width: '60px', textAlign: 'center', fontSize: '11px', color: '#999', paddingTop: '5px', borderRight: '1px solid #eee' }}>
                    {time}
                  </div>
                  {weekDates.map((_, dayIndex) => (
                    <div key={dayIndex} style={{ flex: 1, borderRight: '1px solid #f0f0f0' }}></div>
                  ))}
                </div>
              ))}

              {eventBlocks.map(event => (
                <a 
                  key={event.id}
                  href={event.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    position: 'absolute',
                    top: event.topPx + 'px',
                    left: `calc(60px + ${event.dayIndex} * ((100% - 60px) / 7) + 2px)`,
                    width: 'calc((100% - 60px) / 7 - 6px)',
                    height: event.heightPx + 'px',
                    backgroundColor: event.color,
                    borderRadius: '6px',
                    padding: '4px 6px',
                    color: 'white',
                    fontSize: '12px',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    zIndex: 10,
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    boxShadow: '0 2px 6px rgba(26,115,232,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.9 }}>5:30 - 6:00 PM · Zoom</div>
                </a>
              ))}
            </div>
          </div>

          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', backgroundColor: '#e0e0e0', borderRadius: '20px', padding: '4px' }}>
              {['Year', 'Month', 'Day'].map(mode => (
                <div
                  key={mode}
                  onClick={() => setViewMode(mode.toLowerCase())}
                  style={{
                    flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: '16px', fontSize: '14px', cursor: 'pointer', fontWeight: '600',
                    backgroundColor: viewMode === mode.toLowerCase() ? '#6b6b6b' : 'transparent',
                    color: viewMode === mode.toLowerCase() ? 'white' : '#666',
                    transition: 'all 0.2s'
                  }}
                >
                  {mode}
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '15px', textAlign: 'center', color: '#333' }}>
                {viewMode === 'day' && monthName + ' ' + panelDate.getFullYear()}
                {viewMode === 'month' && panelDate.getFullYear()}
                {viewMode === 'year' && 'Select Year'}
              </div>
              
              {viewMode === 'year' && renderYearView()}
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'day' && renderDayView()}
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', flex: 1 }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '800', color: '#333' }}>My Schedule</h3>

              {viewMode !== 'day' && (
                <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', marginTop: '30px' }}>
                  Please select a day to view your schedule.
                </div>
              )}

              {viewMode === 'day' && isEventDay && (
                <a href={ZOOM_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: '#e8f0fe', border: '1px solid #1a73e8', padding: '12px 15px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 'bold', color: '#1a73e8' }}>Class Meeting</div>
                    <div style={{ fontSize: '12px', marginTop: '4px', color: '#555' }}>5:30 PM - 6:00 PM</div>
                    <div style={{ fontSize: '12px', color: '#1a73e8', marginTop: '2px' }}>Click to join Zoom</div>
                  </div>
                </a>
              )}

              {viewMode === 'day' && !isEventDay && (
                <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '10px', fontSize: '14px', color: '#555' }}>
                  {'No events for day "' + selectedDate.getDate() + '"'}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;