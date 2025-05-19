// ===================== DOM References =====================
const calendarElements = {
    // content container
    content: document.querySelector('.content'),

    // Calendar Elements
    monthText: document.getElementById("month"),
    yearText: document.getElementById("year"),
    daysContainer: document.querySelector(".calendar-days"),
    calendarSidebar: document.querySelector('.calender-sidebar'),
    closeCalendarButton: document.querySelector(".close-calendar button"),
    openCalendarButton: document.querySelector(".open-calendar"),
};

// ===================== Global Variables =====================
let date = new Date();
let currentMonth = date.getMonth();
let currentYear = date.getFullYear();
let selectedDay = null;
let today = date.getDate();
let calendarSidebarFlag = true;

// ===================== Core Functions =====================
function renderCalendar(month, year) {
    calendarElements.daysContainer.innerHTML = "";
    calendarElements.monthText.innerHTML = new Date(year, month).toLocaleString('en-US', { month: 'long' });
    calendarElements.yearText.innerHTML = year;

    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Render previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const prevDayDiv = document.createElement("div");
        prevDayDiv.textContent = prevMonthDays - i;
        prevDayDiv.classList.add("prev-month");
        calendarElements.daysContainer.appendChild(prevDayDiv);
    }

    // Render current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = day;

        if (day === today && month === date.getMonth() && year === date.getFullYear()) {
            dayDiv.classList.add("selected");
            selectedDay = dayDiv;
        }

        dayDiv.addEventListener("click", () => {
            if (selectedDay) selectedDay.classList.remove("selected");
            dayDiv.classList.add("selected");
            selectedDay = dayDiv;
        });

        calendarElements.daysContainer.appendChild(dayDiv);
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

// ===================== Calendar Sidebar Toggle =====================
function toggleCalendarSidebar() {
    if (calendarSidebarFlag) {
        calendarElements.calendarSidebar.style.width = "0px";
        document.documentElement.style.setProperty('--content-width', 'calc(100% - 5vw)');
        setTimeout(function() {
            calendarElements.calendarSidebar.style.display = "none";
        }, 250);
        calendarElements.openCalendarButton.style.display = "block";

    } else {
        // Opening sidebar
        calendarElements.openCalendarButton.style.display = "none";
        calendarElements.calendarSidebar.style.display = "block";
        setTimeout(() => {
            
            calendarElements.calendarSidebar.style.width = "27vw";
        }, 1);
        
        document.documentElement.style.setProperty('--content-width', 'calc(100% - 27vw)');
    }
    calendarSidebarFlag = !calendarSidebarFlag;
}

// ===================== Event Listeners =====================
function setupEventListeners() {
        calendarElements.closeCalendarButton.addEventListener("click", toggleCalendarSidebar);
        calendarElements.openCalendarButton.addEventListener("click", toggleCalendarSidebar);
}

// ===================== Initialize =====================
document.addEventListener("DOMContentLoaded", () => {
    renderCalendar(currentMonth, currentYear);
    setupEventListeners();
});