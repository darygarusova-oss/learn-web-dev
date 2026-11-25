import { useEffect, useRef, useState } from 'react';
import SiteHeader from './components/SiteHeader.jsx';
import BookingProgress from './components/BookingProgress.jsx';
import Calendar from './components/Calendar.jsx';
import TimeSlots from './components/TimeSlots.jsx';
import BookingBottomBar from './components/BookingBottomBar.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import BookingDialog from './components/BookingDialog.jsx';
import { compareDates, formatDate, fromApiDate, isDateSelectable, toApiDate } from './data/date.js';
import { fetchSlots, fetchToday } from './api.js';

export default function App() {
  const [today, setToday] = useState(null);
  const [todayError, setTodayError] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slotResult, setSlotResult] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    let active = true;

    fetchToday().then(data => {
      if (!active) return;
      const date = fromApiDate(data);
      setToday(date);
      setVisibleMonth(date);
      setSelectedDay(date);
    }).catch(() => {
      if (active) setTodayError(true);
    });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedDay) return;
    let active = true;
    const requestedDate = toApiDate(selectedDay);

    fetchSlots(requestedDate).then(({ date, slots }) => {
      if (!active) return;
      if (date.day !== requestedDate.day || date.month !== requestedDate.month ||
          date.year !== requestedDate.year) {
        throw new Error('Сервер вернул слоты на другую дату');
      }
      setSlotResult({ day: selectedDay, slots, error: false });
    }).catch(() => {
      if (active) setSlotResult({ day: selectedDay, slots: [], error: true });
    });

    return () => { active = false; };
  }, [selectedDay]);

  const currentSlots = slotResult?.day === selectedDay ? slotResult : null;
  const slotsLoading = Boolean(selectedDay && !currentSlots);
  const canContinue = Boolean(selectedTime && currentSlots?.slots.some(
    slot => slot.available && slot.time === selectedTime
  ));

  const message = selectedDay
    ? formatDate(selectedDay, true) + (selectedTime ? ` • ${selectedTime}` : '')
    : 'Выберите дату';

  function selectDay(day) {
    setSelectedDay(day);
    setSelectedTime(null);
  }

  function handleDayClick(day) {
    if (!isDateSelectable(day, today)) return;
    if (selectedDay && compareDates(day, selectedDay) === 0) return;
    selectDay(day);
  }

  function handleMonthChange(direction) {
    setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() + direction, 1));
    selectDay(null);
  }

  function handleContinue() {
    if (canContinue) dialogRef.current.showModal();
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
        {today ? (
          <>
            <div className="scheduler">
              <Calendar
                year={visibleMonth.getFullYear()}
                month={visibleMonth.getMonth()}
                today={today}
                selectedDay={selectedDay}
                onSelectDay={handleDayClick}
                onChangeMonth={handleMonthChange}
              />
              <TimeSlots
                day={selectedDay}
                slots={currentSlots?.slots ?? []}
                loading={slotsLoading}
                error={Boolean(currentSlots?.error)}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />
            </div>
            <BookingBottomBar message={message} canContinue={canContinue} onContinue={handleContinue} />
          </>
        ) : (
          <div className="booking-card api-status">
            {todayError
              ? <p className="api-error" role="alert">Не удалось загрузить календарь. Обновите страницу, чтобы попробовать снова.</p>
              : <p role="status">Загрузка…</p>}
          </div>
        )}
      </main>
      <SiteFooter />
      <BookingDialog dialogRef={dialogRef} message={message} />
    </>
  );
}
