const monthText = document.getElementById("month");
const yearText = document.getElementById("year");
const daysContainer = document.querySelector(".calendar-days");
let date = new Date();
let currentMonth = date.getMonth();
let currentYear = date.getFullYear();
let selectedDay = null;
let today = date.getDate();

function renderCalendar(month, year) {
    daysContainer.innerHTML = "";
    monthText.innerHTML = new Date(year, month).toLocaleString('en-US', { month: 'long' });
    yearText.innerHTML = year;
    let firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    let prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
        let prevDayDiv = document.createElement("div");
        prevDayDiv.textContent = prevMonthDays - i;
        prevDayDiv.classList.add("prev-month");
        daysContainer.appendChild(prevDayDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        let dayDiv = document.createElement("div");
        dayDiv.textContent = day;
        if (day === today && month === date.getMonth() && year === date.getFullYear()) {
        dayDiv.classList.add("selected");
        selectedDay = dayDiv;
        }
        dayDiv.addEventListener("click", function () {
        if (selectedDay) {
            selectedDay.classList.remove("selected");
        }
        dayDiv.classList.add("selected");
        selectedDay = dayDiv;
        });
        daysContainer.appendChild(dayDiv);
    }
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
}

function nextMonth() {
currentMonth++;
if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
}
renderCalendar(currentMonth, currentYear);
}

renderCalendar(currentMonth, currentYear);
