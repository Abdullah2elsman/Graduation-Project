// ===================== URL Parameters =====================
const urlParams = new URLSearchParams(window.location.search);
const encodedCourseId = urlParams.get('course_id');
const courseId = atob(encodedCourseId); // decode courseId

// ===================== DOM References =====================
const statCards = document.querySelectorAll('.stat-card span');

const elements = {
    // Buttons
    backBtn: document.querySelector('.back'),

    // Title of course
    courseTitle: document.querySelector('.header h1'),

    // State Cards
    numberOfStudent: statCards[0],
    academicYear: statCards[1],
    averageGrades: statCards[2],
    numberOfChapter: statCards[3],
    totalScore: statCards[4],

    // Chart Diagram
    studentExamAttend: document.querySelector('.progress-container .progress-text'),
    studentExamAttend2: document.querySelectorAll('span .bold-text')[0],
    studentMissezzdExam: document.querySelectorAll('span .bold-text')[1],

    // Tables Row
    topStudentRow: document.querySelector('#top-students-body'),
    missedStudentRow: document.querySelector('#missed-students-body'),

}

// ===================== Initial Setup =====================
function initializeApp() {
    setupEventListeners();
    fetchReports();
}

// ===================== Core Functions =====================
async function fetchReports() {
    const endpoints = [
        `${API_BASE_URL}/reports/course?course_id=${courseId}`,
        `${API_BASE_URL}/reports/topStudents?course_id=${courseId}`,
        `${API_BASE_URL}/reports/topStudentsMissedAllExams?course_id=${courseId}`,
        `${API_BASE_URL}/reports/averageGrades?course_id=${courseId}`,
        `${API_BASE_URL}/reports/studentsInteraction?course_id=${courseId}`
    ];

    Promise.all(endpoints.map(url => 
        fetch(url)
            .then(handleResponse)
            .catch(handleError)
    ))
    .then(([courseData, topStudents, missedStudents, examsGrades, interactionData]) => {
        reportOfCourse(courseData);
        populateTable(elements.topStudentRow, topStudents);
        populateTable(elements.missedStudentRow, missedStudents, true);
        initializeBarChart(examsGrades); 
        initializeLineChart(interactionData, courseData.number_of_students);
    });
}

async function handleResponse(response) {
    if (!response.ok) throw new Error('Network response error');
    return response.json().then(data => {
        if (!data.success) throw new Error('API error: ' + (data.message || ''));
        return data.data;
    });
}

function reportOfCourse(course) {
    // Set the course title
    elements.courseTitle.innerText = course.name;

    // Set the statistics cards
    elements.numberOfStudent.innerText = course.number_of_students;
    elements.academicYear.innerText = course.academic_year;
    elements.averageGrades.innerText = course.average_percentage_grades;
    elements.numberOfChapter.innerText = course.number_of_chapters;
    elements.totalScore.innerText = course.number_of_exams;

    // Set the chart diagram
    const numberOfStudents = course.number_of_students
    elements.studentExamAttend.innerText = `${(course.students_attended_exams * 100 / numberOfStudents).toFixed(2)}%`;
    elements.studentExamAttend2.innerHTML = elements.studentExamAttend.textContent;
    elements.studentMissedExam.innerText = `${(course.students_missed_all_exams* 100 / numberOfStudents).toFixed(2)}%`;

    // Create attendance chart with dynamic data
    const attended = course.students_attended_exams;
    const missed = course.students_missed_all_exams;
    createAttendanceChart(attended, missed);
}

// ===================== Table Population =====================
function populateTable(tableElement, students, isMissedTable = false) {
    
    const rows = students.map((student, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${student.name}</td>
            <td>${student.id}</td>
            ${!isMissedTable ? `
                <td> 
                    <span style="color: #218838;">${student.scored_grades}</span>/${student.total_grades}
                </td>` : ''
            }
            <td class="actions">
                <svg class="edit-action" width="33" height="32" viewBox="0 0 33 32" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <rect x="1.1001" y="0.5" width="31" height="31" rx="3.5" stroke="#28A745" />
                    <path
                        d="M21.0868 8.86167L22.7743 7.17417C23.5065 6.44194 24.6937 6.44194 25.4259 7.17417C26.1582 7.90641 26.1582 9.09359 25.4259 9.82583L14.8073 20.4445C14.2786 20.9731 13.6265 21.3618 12.91 21.5752L10.2251 22.375L11.0249 19.6901C11.2383 18.9736 11.6269 18.3215 12.1556 17.7928L21.0868 8.86167ZM21.0868 8.86167L23.7251 11.5M22.2251 18.375V23.125C22.2251 24.3676 21.2177 25.375 19.9751 25.375H9.4751C8.23246 25.375 7.2251 24.3676 7.2251 23.125V12.625C7.2251 11.3824 8.23246 10.375 9.4751 10.375H14.2251"
                        stroke="#28A745" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <svg class="delete-action" width="33" height="32" viewBox="0 0 33 32" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <rect x="1.1001" y="0.5" width="31" height="31" rx="3.5" stroke="#D32F2F" />
                    <path
                        d="M19.3405 13L18.9943 22M14.2059 22L13.8597 13M23.8277 9.79057C24.1697 9.84221 24.5105 9.89747 24.8501 9.95629M23.8277 9.79057L22.7599 23.6726C22.6697 24.8448 21.6922 25.75 20.5165 25.75H12.6837C11.508 25.75 10.5305 24.8448 10.4403 23.6726L9.37245 9.79057M23.8277 9.79057C22.6813 9.61744 21.5216 9.48485 20.3501 9.39432M8.3501 9.95629C8.68967 9.89747 9.03047 9.84221 9.37245 9.79057M9.37245 9.79057C10.5189 9.61744 11.6786 9.48485 12.8501 9.39432M20.3501 9.39432V8.47819C20.3501 7.29882 19.4394 6.31423 18.2607 6.27652C17.7093 6.25889 17.1557 6.25 16.6001 6.25C16.0444 6.25 15.4909 6.25889 14.9395 6.27652C13.7608 6.31423 12.8501 7.29882 12.8501 8.47819V9.39432M20.3501 9.39432C19.1127 9.2987 17.8621 9.25 16.6001 9.25C15.3381 9.25 14.0875 9.2987 12.8501 9.39432"
                        stroke="#D32F2F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </td>
        </tr>
    `).join('');

    tableElement.innerHTML = rows;
}

// ===================== Event Handlers =====================
function setupEventListeners() {

    // Back button
    elements.backBtn.addEventListener("click", () => {
        elements.courseId = btoa(elements.courseId); // encode courseId
        window.location.href = `coursesManagement.html`;
    });    

}

// ===================== Error Handling =====================
function handleError(error) {
    console.error('Error:', error);
    // Add visual error handling here (e.g., show toast/notification)
}
// ===================== Chart Initialization =====================
function createAttendanceChart(attended, missed) {
    const ctx = document.getElementById("chart0").getContext("2d");
    
    // Destroy existing chart if it exists
    if (window.attendanceChart) {
        window.attendanceChart.destroy();
    }

    window.attendanceChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            datasets: [{
                data: [missed, attended],
                backgroundColor: ['#ff92ae', '#0077b6'],
                borderWidth: 0,
                borderRadius: 8
            }],
        },
        options: {
            responsive: true,
            cutout: "70%",
            plugins: { legend: { display: false } }
        }
    });
}

function initializeLineChart(interactionData, numberOfStudents) {
    // Ensure we have students to avoid division by zero
    if (!numberOfStudents || numberOfStudents === 0) {
        console.error('Invalid number of students');
        return;
    }

    // Process API data with percentage calculation
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

    // Get reference elements
    const monthSelect = document.getElementById('monthSelect');
    const chartCanvas = document.getElementById('MonthlyProgressChart');
    let chartInstance = null;

    // Clear existing options
    monthSelect.innerHTML = '';

    // Sort months chronologically
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const sortedMonths = Object.keys(datasets.interaction).sort((a, b) => 
        monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );

    // Populate month dropdown
    sortedMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    // Initial chart setup
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
    // Initial chart creation
    chartInstance = createChart(monthSelect.value);

    // Add month change listener
    monthSelect.addEventListener('change', () => {
        chartInstance.destroy(); // Destroy previous chart
        chartInstance = createChart(monthSelect.value);
    });
}

function initializeBarChart(data) {
    new Chart(document.getElementById('averageGrades').getContext('2d'), {
        type: 'bar',
        data: {
            labels: data.map(item => item.name),
            datasets: [
                {
                    label: "Achieved",
                    data: data.map(item => item.average_grade),
                    backgroundColor: "#2c6da4",
                    borderRadius: { topLeft: 4, topRight: 4 },
                    stack: "Stack 0",
                    barThickness: 25
                },
                {
                    label: "Remaining",
                    data: data.map(item => item.total_score - item.average_grade),
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
                    font: { size: 24, weight: '700' }
                }
            }
        }
    });
}

// ===================== Initialize Application =====================
document.addEventListener('DOMContentLoaded', initializeApp);