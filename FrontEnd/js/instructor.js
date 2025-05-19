// ===================== API & URL Parameters =====================
const API_BASE_URL = 'http://localhost:8005/api';

// ===================== DOM References =====================
const elements = {
    cardsWrapper: document.querySelector('.cards-wrapper'),
    moveRight: document.querySelector('.move-right'),
    moveLeft: document.querySelector('.move-left'),
    monthlyChart: document.getElementById('MonthlyProgressChart'),
    averageGradesChart: document.getElementById('averageGrades')
};

console.log('Elements:', elements);

// ===================== Global Variables =====================
let coursesList = [];

// ===================== Initial Setup =====================
function initializeDashboard() {
    loadCourses()
    setupEventListeners
        // .catch(handleError);
}

// ===================== Core Functions =====================

// Render all course cards and charts
async function loadCourses() {
    try {;
        const userId = 201;
        const response = await fetch(`${API_BASE_URL}/instructor/${userId}/courses`);
        const courses = await response.json();

        coursesList = Array.isArray(courses) ? courses : (courses.data || courses.courses || []);
        
        renderCourseCards(coursesList);

    } catch (error) {
        handleError(error);
    }
}

function renderCourseCards(courses) {
    if (!elements.cardsWrapper) return;
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

function createMonthlyProgressChart(labels, dataValues) {
    if (!elements.monthlyChart) return;
    const ctxLine = elements.monthlyChart.getContext('2d');
    new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                borderColor: '#2c6da4',
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                borderWidth: 1,
                pointRadius: 3,
                pointBackgroundColor: '#2c6da4',
                pointBorderWidth: 1,
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
                        stepSize: 20,
                        callback: value => value + '%'
                    },
                    drawBorder: false
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Average Student Interaction',
                    align: 'start',
                    font: { size: 24, weight: '700' },
                    color: '#333'
                },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: tooltipItem => tooltipItem.raw + "%"
                    }
                }
            }
        }
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

// ===================== Event Listeners =====================
function setupEventListeners() {
    console.log('Setting up event listeners...');
        elements.moveRight.addEventListener('click', () => {
            elements.cardsWrapper.scrollBy(300, 0);
        });
        elements.moveLeft.addEventListener('click', () => {
            elements.cardsWrapper.scrollBy(-300, 0);
        });
    
}

const moveRight = document.querySelector('.move-right');
const moveLeft = document.querySelector('.move-left');
const courses = document.querySelector('.cards-wrapper');
moveRight.addEventListener('click', () => {
  courses.scrollBy(300, 0);
});

moveLeft.addEventListener('click', () => {
  courses.scrollBy(-300, 0);
});

// ===================== Error Handling =====================
function handleError(error) {
    console.error('Dashboard Error:', error);
    // Optionally, display a user-friendly error message
}

// ===================== Initialize Dashboard =====================
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();

    // Static Data for Demo Charts (replace with API data if needed)
    const labelsLine = Array.from({ length: 30 }, (_, i) => i + 1);
    const dataValues = [20, 25, 40, 55, 45, 50, 35, 42, 38, 64, 42, 47, 43, 46, 50, 55, 20, 60, 35, 55, 40, 52, 49, 48, 50, 45, 47, 49, 52, 55];
    createMonthlyProgressChart(labelsLine, dataValues);

    const barData = [
        { label: "quiz1.Math0", achieved: 8, remaining: 2 },
        { label: "quiz1.Math1", achieved: 7, remaining: 3 },
        { label: "quiz1.Math2", achieved: 9, remaining: 1 },
        { label: "quiz1.Math2", achieved: 9, remaining: 1 },
        { label: "quiz1.Math3", achieved: 6, remaining: 4 }
    ];
    createAverageGradesChart(barData);
});
