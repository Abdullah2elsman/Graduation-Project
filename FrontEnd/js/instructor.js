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

// ===================== Initial Setup =====================
function initializeDashboard() {
    setupEventsListeners();
    loadCourses();
}

// ===================== Core Functions =====================

// Render all course cards and charts
async function loadCourses() {
    const userId = 201;
    const endpoints = [
        `${API_BASE_URL}/instructor/${userId}/courses`,
        `${API_BASE_URL}/instructor/${userId}/coursesInteraction`,
        `${API_BASE_URL}/instructor/${userId}/coursesAverageGrades`,
        `${API_BASE_URL}/instructor/${userId}/studentsMissedAllExams`,
    ];

    Promise.all(endpoints.map(url => 
    fetch(url)
        .then(handleResponse)
        .catch(handleError)
    ))
    .then(([courses, coursesInteraction, coursesAverageGrades, studentsMissedAllExams]) => { 
        // Create Courses Card
        coursesList = Array.isArray(courses) ? courses : (courses.data || courses.courses || []);
        renderCourseCards(coursesList);

        // Create Line Chart
        createMonthlyProgressChart(coursesInteraction.data, coursesInteraction.number_of_students);

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
        }
        fillMissedStudentsTable(studentsMissedAllExams);
    });

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
            exam.missed_students.forEach(student => {
                hasData = true;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td>${courseName}</td>
                    <td class="actions">
                        <!-- actions here -->
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
