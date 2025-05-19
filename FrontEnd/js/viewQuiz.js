// ===================== URL Parameters =====================
const urlParams = new URLSearchParams(window.location.search);
const encodedExamId = urlParams.get('exam_id'); 
const encodedCourseId = urlParams.get('course_id'); 
const examId = atob(encodedExamId); 
const courseId = atob(encodedCourseId); 
const instructorId = 201

const API_BASE_URL = 'http://localhost:8005/api';

// ===================== DOM References =====================
const elements = {
    backBtn: document.querySelector(".back-btn"),
    quizName: document.querySelector(".quiz-header h1"),
    questionsSection: document.querySelector('.questions-section'),
    chartSection: document.getElementById('gradesChart')
};


function initializeApp() {
    fetchReports();
    setupEventListeners();
    setupChart();
}

// ===================== Core Functions =====================
async function fetchReports() {
  const endpoint = `${API_BASE_URL}/instructor/course/${courseId}/exams/getExamQuestions?exam_id=${examId}`;
    
  try {
        const response = await fetch(endpoint);
        const data = await handleResponse(response);
        updateQuizName(data.data.name);
        renderQuestions(data.data.questions);
    } catch (error) {
        handleError(error);
    }
}

function updateQuizName(quizName) {
    elements.quizName.textContent = quizName;
}
function renderQuestions(questions) {
    elements.questionsSection.innerHTML = '';
  
    questions.forEach((question, index) => {
        const questionHTML = `
        <div class="question-wrapper">
            <div class="question-card">
                <div class="question-content">
                    <div class="question-number">Question ${index + 1}</div>
                    <input type="text" value="${question.question}" readonly>
                    <div class="options">
                        ${question.options.map(opt => `
                            <input type="text" value="${opt.option}" class="${(opt.is_correct ? "correct-option" : "incorrect-option")}" readonly>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        <div class="correct-answer">
            The Correct Answer is: <strong>Option ${index + 1}</strong> 
        </div>
        `;
        
        elements.questionsSection.insertAdjacentHTML('beforeend', questionHTML);
    });
}


async function handleResponse(response) {
    if (!response.ok) {
        throw new Error('Failed to get data from server');
    }
    return await response.json();
}


// ===================== Event Listeners =====================
function setupEventListeners() {
    elements.backBtn.addEventListener('click', () => {
        window.location.href = `QuizzesManagement.html?course_id=${btoa(courseId)}`;
    });
}

// ===================== Error Handling =====================
function handleError(error) {
    console.error('Application Error:', error);
    // Implement user-friendly error display
}

// ===================== Initialize App =====================
// ===================== Chart Setup =====================
function setupChart() {
    new Chart(elements.chartSection.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            datasets: [{
                label: 'grades',
                data: [1, 1, 1, 2, 3, 6, 6, 5, 9, 7],
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: { color: '#000' }
                }
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', initializeApp);

