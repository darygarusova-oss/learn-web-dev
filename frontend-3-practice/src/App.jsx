import { useRef, useState } from 'react';
import SiteHeader from './components/SiteHeader.jsx';
import BookingProgress from './components/BookingProgress.jsx';
import Calendar from './components/Calendar.jsx';
import TimeSlots from './components/TimeSlots.jsx';
import BookingBottomBar from './components/BookingBottomBar.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import BookingDialog from './components/BookingDialog.jsx';
import { compareDates, formatDate, getInitialDay, getSlots, isDateSelectable } from './data/date.js';

export default function App() {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(() => getInitialDay(today));
  const [currentMonth, setCurrentMonth] = useState(() => selectedDay.getMonth());
  const [currentYear, setCurrentYear] = useState(() => selectedDay.getFullYear());
  const [selectedTime, setSelectedTime] = useState(null);
  const [slots, setSlots] = useState(() => getSlots(selectedDay));
  const dialogRef = useRef(null);

  const canContinue = Boolean(selectedDay && selectedTime && isDateSelectable(selectedDay, today));
  const message = selectedDay
    ? formatDate(selectedDay, true) + (selectedTime ? ` • ${selectedTime}` : '')
    : 'Выберите дату';

  function selectDay(day) {
    setSelectedDay(day);
    setSelectedTime(null);
    setSlots(getSlots(day));
  }

  function handleDayClick(day) {
    if (!isDateSelectable(day, new Date())) return;
    if (selectedDay && compareDates(day, selectedDay) === 0) return;
    selectDay(day);
  }

  function handleMonthChange(direction) {
    const nextMonth = new Date(currentYear, currentMonth + direction, 1);
    setCurrentMonth(nextMonth.getMonth());
    setCurrentYear(nextMonth.getFullYear());
    selectDay(null);
  }

  function handleContinue() {
    if (canContinue && isDateSelectable(selectedDay, new Date())) {
      dialogRef.current.showModal();
    }
  }

  return (
    <>
      <SiteHeader />
      <BookingProgress />
      <main className="wrap booking-content">
        <div className="title-row">
          <button className="control back-control" type="button">← Назад</button>
          <h1 className="page-title">Выберите дату и время</h1>
        </div>
        <div className="scheduler">
          <Calendar
            year={currentYear}
            month={currentMonth}
            today={today}
            selectedDay={selectedDay}
            onSelectDay={handleDayClick}
            onChangeMonth={handleMonthChange}
          />
          <TimeSlots day={selectedDay} slots={slots} selectedTime={selectedTime} onSelectTime={setSelectedTime} />
        </div>
        <BookingBottomBar message={message} canContinue={canContinue} onContinue={handleContinue} />
      </main>
      <SiteFooter />
      <BookingDialog dialogRef={dialogRef} message={message} />
    </>
  );
}
