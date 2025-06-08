// ===================== DOM References =====================
const elements = {
    cardsWrapper: document.querySelector('.cards-wrapper'),
    moveRight: document.querySelector('.move-right'),
    moveLeft: document.querySelector('.move-left'),
    monthlyChart: document.getElementById('MonthlyProgressChart'),
    averageGradesChart: document.getElementById('averageGrades'),
    missedExamsTable: document.querySelector('.missed-students-table tbody')
};


// ===================== Global Variables =====================
let coursesList = []; // This to store courses list to download Courses Cards

// ===================== Auth Helpers =====================

/**
 * Validate the current session by checking the HttpOnly cookie with the backend.
 * Returns true if authenticated, false otherwise.
 */
async function validateSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) return false; // Not authenticated        
        const data = await response.json();
        if( data.user.role !== 'instructor') {
            return false;
        }
        return response.ok;    
    } catch (error) {
        return false;
    }
}

// ===================== Initial Setup =====================
async function initializeDashboard() {
    try {
        // Always get CSRF cookie before any protected request
        await getCsrfCookie();
        
        // Check if user is authenticated first
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return redirectToLogin(); // Ensure CSRF token is set before any requests
        
        setupEventsListeners();
        loadDashboard();
    } catch (error) {
        console.error("App Error:", error);
        alert("Failed to load page data");
        redirectToLogin();
    }
}
// ===================== Core Functions =====================

// Render all course cards and charts
async function loadDashboard() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.user) {
        return redirectToLogin();
    }
const userId = userData.user.id;
    try {
        // 1. Get List of the courses
        const coursesRes = await fetch(`${API_BASE_URL}/instructor/${userId}/courses`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const coursesData = await handleResponse(coursesRes);
        const courses = Array.isArray(coursesData.data) ? coursesData.data : [];
        coursesList = courses;
        renderCourseCards(coursesList);

        const coursesInteractionRes = await fetch(`${API_BASE_URL}/instructor/${userId}/course-interaction`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const coursesInteraction = await handleResponse(coursesInteractionRes);
        createMonthlyProgressChart(coursesInteraction.data, coursesInteraction.number_of_students);;

        const coursesAverageGradesRes = await fetch(`${API_BASE_URL}/instructor/${userId}/courses-average-grades`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const coursesAverageGrades = await handleResponse(coursesAverageGradesRes);
        // create bar chart
        if (coursesAverageGrades && coursesAverageGrades.data) {
            const barData = [];
            Object.entries(coursesAverageGrades.data).forEach(([courseTitle, exams]) => {
                exams.forEach(exam => {
                    barData.push({
                        label: `${exam.exam_name}.${courseTitle}`,
                        achieved: Number(exam.average_grade),
                        remaining: Number(exam.total_score) - Number(exam.average_grade)
                    });
                });
            });
            createAverageGradesChart(barData);
            const studentsMissedAllExamsRes = await fetch(`${API_BASE_URL}/instructor/${userId}/students-missed-all-exams`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            const studentsMissedAllExams = await handleResponse(studentsMissedAllExamsRes);
            fillMissedStudentsTable(studentsMissedAllExams);
        }
    } catch (error) {
        handleError(error);
    }
}


async function handleResponse(response) {
    if (!response.ok) throw new Error('Network response error');
    return response.json().then(data => {
        if (!data.success) throw new Error('API error: ' + (data.message || ''));
        return data;
    });
}

function renderCourseCards(courses) {
        if (!Array.isArray(courses) || courses.length === 0) {
        elements.cardsWrapper.innerHTML = `
            <div class="no-courses-message" style="text-align:center; color:#888; padding:40px; font-size: 2rem; font-weight: bold; justify-content: center;">
                There are no courses available.
            </div>
        `;

        elements.cardsWrapper.style.justifyContent = 'center'; // Center the message

        return;
    }
    // if (!elements.cardsWrapper) return;
    elements.cardsWrapper.innerHTML = ''; 
    courses.forEach(course => {
        const card = createCourseCard(course);
        elements.cardsWrapper.appendChild(card);
        createProgressChart(`chart${course.id}`, Math.floor((course.completed_exams / course.number_of_exams) * 100));
    });
}

// Create a single course card element
function createCourseCard(course) {
    // Main card
    const card = document.createElement('div');
    card.classList.add('course-card');

    // Progress container
    const progressContainer = document.createElement('div');
    progressContainer.classList.add('progress-container');

    const canvas = document.createElement('canvas');
    canvas.classList.add('progress-chart');
    canvas.id = `chart${course.id}`;
    canvas.width = 90;
    canvas.height = 90;

    const progressText = document.createElement('div');
    progressText.classList.add('progress-text');
    progressText.id = `text${course.id}`;

    progressContainer.appendChild(canvas);
    progressContainer.appendChild(progressText);

    // Course title
    const title = document.createElement('div');
    title.classList.add('course-title');
    title.textContent = course.title;

    // Quiz info
    const completedQuizzes = document.createElement('div');
    completedQuizzes.classList.add('quiz-info');
    completedQuizzes.textContent = `Completed Quizzes: ${course.completed_exams}`;

    const remainingQuizzes = document.createElement('div');
    remainingQuizzes.classList.add('quiz-info');
    remainingQuizzes.textContent = `Remaining Quizzes: ${course.number_of_exams - course.completed_exams}`;

    // Quiz button
    const button = document.createElement('button');
    button.classList.add('quiz-button');
    button.textContent = "+ Create New Quiz";

    // Assemble card
    card.appendChild(progressContainer);
    card.appendChild(title);
    card.appendChild(completedQuizzes);
    card.appendChild(remainingQuizzes);
    card.appendChild(button);

    return card;
}

// Render doughnut progress chart for a course
function createProgressChart(canvasId, percentage) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // For high-res screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr || 90 * dpr;
    canvas.height = canvas.clientHeight * dpr || 90 * dpr;
    ctx.scale(dpr, dpr);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: ['#0077b6', '#e8eff5'],
                borderWidth: 0,
                borderRadius: percentage === 100 ? 0 : 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '74%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });

    // Update progress text
    const textDiv = document.getElementById(`text${canvasId.replace('chart', '')}`);
    if (textDiv) {
        textDiv.innerHTML = `${percentage}%<span>Completed</span>`;
    }
}

// ===================== Chart Data & Rendering =====================

function createMonthlyProgressChart(interactionData, numberOfStudents) {
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    // if no interaction data or number of students, set defaults
    if (!numberOfStudents || numberOfStudents === 0 || !interactionData || Object.keys(interactionData).length === 0) {
        numberOfStudents = 1; // Avoid division by zero
        interactionData = {};
        monthOrder.forEach(month => {
            interactionData[month] = Array(30).fill(0); 
        });
    }

    // load interaction data into datasets
    const datasets = {
        interaction: Object.fromEntries(
            Object.entries(interactionData).map(([month, days]) => [
                month,
                Object.values(days).map(value =>
                    Math.round((Number(value) * 100 / numberOfStudents) * 100) / 100
                )
            ])
        )
    };

    const monthSelect = document.getElementById('monthSelect');
    const chartCanvas = document.getElementById('MonthlyProgressChart');
    let chartInstance = null;

    monthSelect.innerHTML = '';

    const sortedMonths = Object.keys(datasets.interaction).sort((a, b) =>
        monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );

    if (sortedMonths.length === 0) {
        sortedMonths.push('January');
        datasets.interaction['January'] = Array(30).fill(0);
    }

    sortedMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    function createChart(month) {
        return new Chart(chartCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array.from({ length: datasets.interaction[month].length }, (_, i) => i + 1),
                datasets: [{
                    data: datasets.interaction[month],
                    label: 'Average Daily Interaction (%)',
                    borderColor: '#2c6da4',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderWidth: 1,
                    pointRadius: 3,
                    pointBackgroundColor: '#2c6da4',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => `${value}%`,
                            stepSize: 10
                        },
                        title: {
                            display: true,
                            text: 'Percentage of Students'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Average Daily Interaction - ${month}`,
                        align: 'start',
                        font: { size: 24, weight: '700' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return ` ${value}% of students interacted`;
                            }
                        }
                    }
                }
            }
        });
    }

    chartInstance = createChart(monthSelect.value || sortedMonths[0]);

    monthSelect.addEventListener('change', () => {
        chartInstance.destroy();
        chartInstance = createChart(monthSelect.value);
    });
}


function createAverageGradesChart(data) {
    if (!elements.averageGradesChart) return;
    const ctxBar = elements.averageGradesChart.getContext('2d');
    const labelsBar = data.map(item => item.label);
    const achievedData = data.map(item => item.achieved);
    const remainingData = data.map(item => item.remaining);

    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: labelsBar,
            datasets: [
                {
                    label: "Achieved",
                    data: achievedData,
                    backgroundColor: "#2c6da4",
                    borderRadius: { topLeft: 4, topRight: 4 },
                    stack: "Stack 0",
                    barThickness: 25
                },
                {
                    label: "Remaining",
                    data: remainingData,
                    backgroundColor: "#e8eff5",
                    borderRadius: 4,
                    stack: "Stack 0",
                    barThickness: 25
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, grid: { display: false }, beginAtZero: true, max: 10 }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Average Students Grades',
                    align: 'start',
                    font: { size: 24, weight: '700' },
                    color: '#333'
                },
                legend: { display: false }
            }
        }
    });
}



// ===================== Full Missed Exam Table =====================


function fillMissedStudentsTable(response) {
    elements.missedExamsTable.innerHTML = ''; 

    let hasData = false;

    // Check if response.data exists and is not empty
    if (!response.data || Object.keys(response.data).length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" style="text-align:center; font-size:1.3rem; color:#888; font-weight:bold;">
                No students missed any exams.
            </td>
        `;
        elements.missedExamsTable.appendChild(row);
        return;
    }

    // Loop through each course
    for (const [courseName, exams] of Object.entries(response.data)) {
        exams.forEach(exam => {
            if (!exam || !Array.isArray(exam.missed_students)) {
                console.warn('exam.missed_students is missing or invalid:', exam);
                return;
            }

                    exam.missed_students.forEach(student => {
                        hasData = true;
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${student.id}</td>
                            <td>${student.name}</td>
                            <td>${courseName}</td>
                            <td class="actions">
                                ${actionIcons()}
                            </td>
                        `;
                        elements.missedExamsTable.appendChild(row);
                    });
            
        });
}

    // لو مفيش أي بيانات بعد اللف
    if (!hasData) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" style="text-align:center; font-size:1.3rem; color:#888; font-weight:bold;">
                No students missed any exams. 👌
            </td>
        `;
        elements.missedExamsTable.appendChild(row);
    }
}

function actionIcons() {
    return `
        <svg class="edit-action" width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1.1001" y="0.5" width="31" height="31" rx="3.5" stroke="#28A745" />
                            <path
                                d="M21.0868 8.86167L22.7743 7.17417C23.5065 6.44194 24.6937 6.44194 25.4259 7.17417C26.1582 7.90641 26.1582 9.09359 25.4259 9.82583L14.8073 20.4445C14.2786 20.9731 13.6265 21.3618 12.91 21.5752L10.2251 22.375L11.0249 19.6901C11.2383 18.9736 11.6269 18.3215 12.1556 17.7928L21.0868 8.86167ZM21.0868 8.86167L23.7251 11.5M22.2251 18.375V23.125C22.2251 24.3676 21.2177 25.375 19.9751 25.375H9.4751C8.23246 25.375 7.2251 24.3676 7.2251 23.125V12.625C7.2251 11.3824 8.23246 10.375 9.4751 10.375H14.2251"
                                stroke="#28A745" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <svg class="delete-action" width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1.1001" y="0.5" width="31" height="31" rx="3.5" stroke="#D32F2F" />
                                <path
                                    d="M19.3405 13L18.9943 22M14.2059 22L13.8597 13M23.8277 9.79057C24.1697 9.84221 24.5105 9.89747 24.8501 9.95629M23.8277 9.79057L22.7599 23.6726C22.6697 24.8448 21.6922 25.75 20.5165 25.75H12.6837C11.508 25.75 10.5305 24.8448 10.4403 23.6726L9.37245 9.79057M23.8277 9.79057C22.6813 9.61744 21.5216 9.48485 20.3501 9.39432M8.3501 9.95629C8.68967 9.89747 9.03047 9.84221 9.37245 9.79057M9.37245 9.79057C10.5189 9.61744 11.6786 9.48485 12.8501 9.39432M20.3501 9.39432V8.47819C20.3501 7.29882 19.4394 6.31423 18.2607 6.27652C17.7093 6.25889 17.1557 6.25 16.6001 6.25C16.0444 6.25 15.4909 6.25889 14.9395 6.27652C13.7608 6.31423 12.8501 7.29882 12.8501 8.47819V9.39432M20.3501 9.39432C19.1127 9.2987 17.8621 9.25 16.6001 9.25C15.3381 9.25 14.0875 9.2987 12.8501 9.39432"
                                    stroke="#D32F2F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
    `;
}



// ===================== Event Listeners =====================
function setupEventsListeners() {
        elements.moveRight.addEventListener('click', () => {
            elements.cardsWrapper.scrollBy(300, 0);
        });
        elements.moveLeft.addEventListener('click', () => {
            elements.cardsWrapper.scrollBy(-300, 0);
        });
}


// ===================== Error Handling =====================
function handleError(error) {
    console.error('Dashboard Error:', error);
    // Optionally, display a user-friendly error message
}

// ===================== Initialize Dashboard =====================
document.addEventListener('DOMContentLoaded', initializeDashboard);
