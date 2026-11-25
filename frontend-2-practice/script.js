'use strict';

// Данные и форматирование.
const demoDate = new Date(2026, 11, 4);
const times = ['12:00', '14:30', '17:00'];
const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long' });
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long', day: 'numeric', month: 'long'
});

const state = {
  currentYear: null,
  currentMonth: null,
  selectedDay: null,
  selectedTime: null,
  slots: []
};

const calendar = document.querySelector('#calendar-days');
const calendarTitle = document.querySelector('#calendar-title');
const timesTitle = document.querySelector('#times-title');
const slotCaption = document.querySelector('#slot-caption');
const timeSlots = document.querySelector('#time-slots');
const bottomMessage = document.querySelector('#selection-message');
const nextButton = document.querySelector('.next-control');
const bookingDialog = document.querySelector('#booking-dialog');

// Чистые функции для дат и слотов.
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function compareDates(first, second) {
  return Math.sign(startOfDay(first) - startOfDay(second));
}

function isDateSelectable(date, today) {
  return compareDates(date, today) >= 0;
}

function buildCalendarGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: offset + days }, (_, index) =>
    index < offset ? null : new Date(year, month, index - offset + 1)
  );
  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

function getSlots(day) {
  if (!day || day.getDay() === 6) return [];

  const available = compareDates(day, demoDate) === 0
    ? ['14:30']
    : day.getDate() % 2 === 0
      ? ['12:00', '17:00']
      : ['14:30', '17:00'];

  return times.map(time => ({ time, available: available.includes(time) }));
}

function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}

function formatDate(day, showYear = false) {
  const label = capitalize(dateFormatter.format(day));
  return showYear ? `${label} ${day.getFullYear()}` : label;
}

// Отрисовка календаря, свободных окон и нижней панели.
function renderCalendar() {
  const { currentYear, currentMonth, selectedDay } = state;
  const today = new Date();
  const month = new Date(currentYear, currentMonth, 1);
  calendarTitle.textContent = `${capitalize(monthFormatter.format(month))} ${currentYear}`;

  const days = buildCalendarGrid(currentYear, currentMonth).flat();
  const cells = days.map(date => {
    if (!date) return '<li class="day-cell" aria-hidden="true"></li>';

    const day = date.getDate();
    const selected = selectedDay && compareDates(date, selectedDay) === 0;
    const buttonState = isDateSelectable(date, today) ? '' : ' disabled';
    return `<li class="day-cell">
      <button class="control day-control${selected ? ' day-selected' : ''}" type="button"
        data-day="${day}" aria-label="${formatDate(date, true)}"
        aria-pressed="${Boolean(selected)}"${buttonState}>${day}</button>
    </li>`;
  });

  calendar.querySelectorAll('.day-cell').forEach(cell => cell.remove());
  calendar.insertAdjacentHTML('beforeend', cells.join(''));
  calendar.querySelectorAll('.day-control:enabled').forEach(button => {
    button.addEventListener('click', onDayClick);
  });
}

function renderTimeSlots() {
  const { selectedDay, selectedTime, slots } = state;
  timesTitle.textContent = selectedDay ? formatDate(selectedDay) : 'Дата и время';
  slotCaption.textContent = selectedDay
    ? slots.length ? 'Доступное время' : 'На этот день нет свободного времени'
    : 'Выберите день в календаре';

  timeSlots.innerHTML = slots.map(({ time, available }) => {
    const selected = time === selectedTime;
    return `<li class="slot">
      <button class="control slot-control${selected ? ' slot-selected' : ''}" type="button"
        data-time="${time}" aria-pressed="${selected}"
        ${available ? '' : `disabled aria-label="${time}, занято"`}>${time}</button>
      ${available ? '' : '<span class="slot-status" aria-hidden="true">Занято</span>'}
    </li>`;
  }).join('');

  timeSlots.querySelectorAll('.slot-control:enabled').forEach(button => {
    button.addEventListener('click', onTimeSlotClick);
  });
}

function updateBottomBar() {
  const { selectedDay, selectedTime } = state;
  bottomMessage.textContent = selectedDay
    ? formatDate(selectedDay, true) + (selectedTime ? ` • ${selectedTime}` : '')
    : 'Выберите дату';
  nextButton.disabled = !selectedTime;
}

function selectDay(day) {
  state.selectedDay = day;
  state.selectedTime = null;
  state.slots = getSlots(day);
  renderCalendar();
  renderTimeSlots();
  updateBottomBar();
}

// Обработчики выбора и переключения месяцев.
function onDayClick(event) {
  const day = Number(event.currentTarget.dataset.day);
  const date = new Date(state.currentYear, state.currentMonth, day);
  if (!isDateSelectable(date, new Date())) return;
  if (state.selectedDay && compareDates(date, state.selectedDay) === 0) return;

  selectDay(date);
  calendar.querySelector('[aria-pressed="true"]').focus();
}

function onTimeSlotClick(event) {
  state.selectedTime = event.currentTarget.dataset.time;
  renderTimeSlots();
  updateBottomBar();
  timeSlots.querySelector('[aria-pressed="true"]').focus();
}

function changeMonth(direction) {
  const month = new Date(state.currentYear, state.currentMonth + direction, 1);
  state.currentMonth = month.getMonth();
  state.currentYear = month.getFullYear();
  selectDay(null);
}

function setupMonthNavigation() {
  document.querySelector('#previous-month').addEventListener('click', () => changeMonth(-1));
  document.querySelector('#next-month').addEventListener('click', () => changeMonth(1));
}

function init() {
  const today = startOfDay(new Date());
  const nextBookableDay = today.getDay() === 6
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    : today;
  const initialDay = isDateSelectable(demoDate, today) ? demoDate : nextBookableDay;
  state.currentYear = initialDay.getFullYear();
  state.currentMonth = initialDay.getMonth();
  selectDay(initialDay);
  setupMonthNavigation();

  nextButton.addEventListener('click', () => {
    if (!state.selectedTime || !isDateSelectable(state.selectedDay, new Date())) return;
    document.querySelector('#dialog-date').textContent = bottomMessage.textContent;
    bookingDialog.showModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
