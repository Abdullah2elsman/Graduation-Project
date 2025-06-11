// ===================== DOM References =====================
const calendarElements = {
    // content container
    content: document.querySelector('.content'),
    booksContainer: document.querySelector('.books-container'),

    // Calendar Elements
    monthText: document.getElementById("month"),
    yearText: document.getElementById("year"),
    daysContainer: document.querySelector(".calendar-days"),
    calendarSidebar: document.querySelector('.calender-sidebar'),
    closeCalendarButton: document.querySelector(".close-calendar button"),
    openCalendarButton: document.querySelector(".open-calendar"),

    // Schedule
    scheduleContainer: document.querySelector('.schedule'),
    quizzesToday: document.querySelector('.quizzes-today')


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

async function todaySchedule() {
  // تأكد من وجود العنصر
    const scheduleContainer = calendarElements.scheduleContainer;
    if (!scheduleContainer) {
        console.warn('Schedule container (.schedule) not found in DOM.');
        return;
    }

  // حدّد الصفحة الحالية
    const page = document.body.getAttribute('data-page');

  // إذا كنا في لوحة المدرّس
    if (page === 'instructor-dashboard') {
        const instructorId = 201; // هنا يجب أن تحصل على المعرف الحقيقي من الجلسة أو متغير عام

        try {
            const endpoint = `${API_BASE_URL}/instructor/${instructorId}/today-exams`;
            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await handleResponse(response);
            const quizzes = data.data; // نفترض أنّه مصفوفة

            // إذا لم توجد اختبارات اليوم
            if (!Array.isArray(quizzes) || quizzes.length === 0) {
                scheduleContainer.innerHTML = `
                    <div class="schedule-item" style="text-align:center; color:#888; font-size:1.2rem;">
                        No quizzes scheduled for today.
                    </div>
                `;
            // عدّل عدّاد عدد الاختبارات
            if (calendarElements.quizzesToday) {
                calendarElements.quizzesToday.textContent = '0';
            }
            return;
            }

              // إذا وُجدت اختبارات
              // لو كان الـ API يعيد حقل count لعدد الاختبارات، اعرضه. وإلا اعرض طول المصفوفة
            if (data.count !== undefined && calendarElements.quizzesToday) {
                calendarElements.quizzesToday.textContent = data.count;
            } else if (calendarElements.quizzesToday) {
                calendarElements.quizzesToday.textContent = String(quizzes.length);
            }

            // بناء HTML لكل اختبار
            scheduleContainer.innerHTML = quizzes
            .map(quiz => {
            // تأكد من بنية الحقل time و duration
            let start = '';
            let end = '';
            if (quiz.time) {
                const [hours, minutes] = quiz.time.split(':');
                start = `${hours}:${minutes}`;

                // حساب ساعة النهاية بناءً على مدة الاختبار (quiz.duration بالدقائق)
                const endObj = new Date(`1970-01-01T${quiz.time}`);
                if (!isNaN(endObj.getTime()) && typeof quiz.duration === 'number') {
                    endObj.setMinutes(endObj.getMinutes() + quiz.duration);
                    end = `${String(endObj.getHours()).padStart(2, '0')}:${String(endObj.getMinutes()).padStart(2, '0')}`;
                }
            }

            return `
            <div class="schedule-item">
                <h3>${quiz.name || 'Unnamed Quiz'}${quiz.course?.title ? ' – ' + quiz.course.title : ''}</h3>
                <p class="details">${quiz.instructions || 'No details available.'}</p>
                <p>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M10.0441 9.91891C10.437 10.0499 10.8618 9.83753 10.9928 9.44457C11.1237 9.05161 10.9114 8.62687 10.5184 8.49588L10.0441 9.91891ZM7.75 8.36365H7C7 8.68647 7.20657 8.97307 7.51283 9.07516L7.75 8.36365ZM8.5 4.83555C8.5 4.42134 8.16421 4.08555 7.75 4.08555C7.33579 4.08555 7 4.42134 7 4.83555H8.5ZM10.5184 8.49588L7.98717 7.65213L7.51283 9.07516L10.0441 9.91891L10.5184 8.49588ZM8.5 8.36365V4.83555H7V8.36365H8.5ZM13.75 7.5199C13.75 10.8336 11.0637 13.5199 7.75 13.5199V15.0199C11.8921 15.0199 15.25 11.662 15.25 7.5199H13.75ZM7.75 13.5199C4.43629 13.5199 1.75 10.8336 1.75 7.5199H0.25C0.25 11.662 3.60786 15.0199 7.75 15.0199V13.5199ZM1.75 7.5199C1.75 4.20619 4.43629 1.5199 7.75 1.5199V0.0198975C3.60786 0.0198975 0.25 3.37776 0.25 7.5199H1.75ZM7.75 1.5199C11.0637 1.5199 13.75 4.20619 13.75 7.5199H15.25C15.25 3.37776 11.8921 0.0198975 7.75 0.0198975V1.5199Z"
                        fill="#2C6DA4" />
                </svg>
                ${start}${end ? ' – ' + end : ''}
                </p>
            </div>
            `;
        })
        .join('');

        } catch (err) {
            scheduleContainer.innerHTML = `
                <div class="schedule-item" style="text-align:center; color:#D32F2F; font-size:1.2rem;">
                    Error loading today's schedule.
                </div>
            `;
            console.error('Error in todaySchedule (instructor):', err);
        }

    return;
    }

    // إذا كنا في لوحة الطالب
    if (page === 'student-dashboard') {
    const studentId = JSON.parse(localStorage.getItem('userData')).user.id;
    try {
      const endpoint = `${API_BASE_URL}/student/${studentId}/today-exams`;
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await handleResponse(response);
      const quizzes = data.data; // مصفوفة
      // عدد الاختبارات اليوم للطالب
      if (data.count !== undefined && calendarElements.quizzesToday) {
        calendarElements.quizzesToday.textContent = data.count;
      } else if (calendarElements.quizzesToday) {
        calendarElements.quizzesToday.textContent = String(Array.isArray(quizzes) ? quizzes.length : 0);
      }

      if (!Array.isArray(quizzes) || quizzes.length === 0) {
        scheduleContainer.innerHTML = `
          <div class="schedule-item" style="text-align:center; color:#888; font-size:1.2rem;">
            No quizzes scheduled for today.
          </div>
        `;
        return;
      }

      scheduleContainer.innerHTML = quizzes
        .map(quiz => {
          let start = '';
          let end = '';
          if (quiz.time) {
            const [hours, minutes] = quiz.time.split(':');
            start = `${hours}:${minutes}`;
            const endObj = new Date(`1970-01-01T${quiz.time}`);
            if (!isNaN(endObj.getTime()) && typeof quiz.duration === 'number') {
              endObj.setMinutes(endObj.getMinutes() + quiz.duration);
              end = `${String(endObj.getHours()).padStart(2, '0')}:${String(endObj.getMinutes()).padStart(2, '0')}`;
            }
          }

          return `
            <div class="schedule-item">
              <h3>${quiz.name || 'Unnamed Quiz'}${quiz.course?.title ? ' – ' + quiz.course.title : ''}</h3>
              <p class="details">${quiz.instructions || 'No details available.'}</p>
              <p>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10.0441 9.91891C10.437 10.0499 10.8618 9.83753 10.9928 9.44457C11.1237 9.05161 10.9114 8.62687 10.5184 8.49588L10.0441 9.91891ZM7.75 8.36365H7C7 8.68647 7.20657 8.97307 7.51283 9.07516L7.75 8.36365ZM8.5 4.83555C8.5 4.42134 8.16421 4.08555 7.75 4.08555C7.33579 4.08555 7 4.42134 7 4.83555H8.5ZM10.5184 8.49588L7.98717 7.65213L7.51283 9.07516L10.0441 9.91891L10.5184 8.49588ZM8.5 8.36365V4.83555H7V8.36365H8.5ZM13.75 7.5199C13.75 10.8336 11.0637 13.5199 7.75 13.5199V15.0199C11.8921 15.0199 15.25 11.662 15.25 7.5199H13.75ZM7.75 13.5199C4.43629 13.5199 1.75 10.8336 1.75 7.5199H0.25C0.25 11.662 3.60786 15.0199 7.75 15.0199V13.5199ZM1.75 7.5199C1.75 4.20619 4.43629 1.5199 7.75 1.5199V0.0198975C3.60786 0.0198975 0.25 3.37776 0.25 7.5199H1.75ZM7.75 1.5199C11.0637 1.5199 13.75 4.20619 13.75 7.5199H15.25C15.25 3.37776 11.8921 0.0198975 7.75 0.0198975V1.5199Z"
                    fill="#2C6DA4" />
                </svg>
                ${start}${end ? ' – ' + end : ''}
              </p>
            </div>
          `;
        })
        .join('');

    } catch (err) {
      scheduleContainer.innerHTML = `
        <div class="schedule-item" style="text-align:center; color:#D32F2F; font-size:1.2rem;">
          Error loading today's schedule.
        </div>
      `;
            console.error('Error in todaySchedule (student):', err);
       }
    }

  // في حال كانت الصفحة غير معرّفة، نترك الجدول فارغًا أو رسالة افتراضية
    if (page !== 'instructor-dashboard' && page !== 'student-dashboard') {
        scheduleContainer.innerHTML = `
        <div class="schedule-item" style="text-align:center; color:#888; font-size:1.2rem;">
            Schedule is not available on this page.
        </div>
        `;
    }
}



// ===================== Calendar Sidebar Toggle =====================
function toggleCalendarSidebar() {
    if (calendarSidebarFlag) {
        calendarElements.calendarSidebar.style.width = "0px";
        document.documentElement.style.setProperty('--content-width', 'calc(100% - 5vw)');
        if(calendarElements.booksContainer){
            calendarElements.booksContainer.style.width = "calc(100% - 5vw)";
        }

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
        if(calendarElements.booksContainer){
            calendarElements.booksContainer.style.width = "calc(100% - 25vw)";
        }
    }
    calendarSidebarFlag = !calendarSidebarFlag;
}

// ===================== Number of Quizzes today =====================
function numberOfQuizzesToday(numOfQuizzes){
    elements.quizzesToday.innerHTML = numOfQuizzes;
}

// ===================== Event Listeners =====================
function setupEventListeners() {
        calendarElements.closeCalendarButton.addEventListener("click", toggleCalendarSidebar);
        calendarElements.openCalendarButton.addEventListener("click", toggleCalendarSidebar);
}

// ===================== Handle Response =====================
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Something went wrong while fetching data.');
  }
  return response.json();
}


// ===================== Initialize =====================
document.addEventListener("DOMContentLoaded", () => {
    renderCalendar(currentMonth, currentYear);
    setupEventListeners();
    todaySchedule();
});