// ===================== URL Parameters =====================

const urlParams = new URLSearchParams(window.location.search);
const encodedCourseId  = urlParams.get('course_id');

const courseId = atob(encodedCourseId); // decode courseId

console.log("Decoded courseId:", courseId);

console.log("Okay, here are 5 easy, direct, and factual quiz questions covering pages 2 through 5 of the provided document. There's a mix of true/false and multiple-choice questions:\n\n**Quiz Questions:**\n\n1.  **True or False:** A network switch connects nodes with each other and with other racks.\n2.  **Multiple Choice:** Physical Infrastructure consists mainly of which of the following?\n    a) Servers, Storage, and Network\n    b) Monitors, Keyboards, and Mice\n    c) Printers, Scanners, and Routers\n    d) Cables, Connectors, and Power supplies\n3.  **True or False:** 1 Rack Unit (1U) is equal to 2.75 inches.\n4. **Multiple Choice:** Which of the following is a type of server configuration?\n    a) Tower\n    b) Rack-mountable\n    c) Blade\n    d) All of the above\n5.  **True or False:** Cables can affect cooling in a server rack.\n\n**Answer Key:**\n\n1.  True\n2.  a) Servers, Storage, and Network\n3.  False\n4.  d) All of the above\n5.  True")
// ===================== DOM References =====================
const elements = {
    backBtn: document.querySelector(".back-btn"),
    createQuizBtn: document.querySelector(".create-quiz-btn"),
    quizList: document.querySelector('.quiz-list'),
};

// ===================== Global EndPoints =====================
const endpoints = {
    examsApiUrl: `${API_BASE_URL}/instructor/course/${courseId}/get-exams`,
    finishedExamsApiUrl: `${API_BASE_URL}/instructor/course/${courseId}/get-finished-exams`
};

// ===================== Initial Setup =====================
async function initializeApp() {
    if (!courseId) {
        showError('Missing course ID');
        return;
    }
    
    setupEventListeners();
    
    try {
        // Fetch both active and finished quizzes
        const [activeQuizzes, finishedQuizzes] = await Promise.all([
            fetchQuizzes(),
            fetchFinishedQuizzes()
        ]);
        
        // Render active quizzes first, then finished ones
        renderCombinedQuizzes(activeQuizzes, finishedQuizzes);
    } catch (error) {
        showError(error.message);
    }
}

function renderCombinedQuizzes(active, finished) {
    // Clear the quiz list before rendering
    elements.quizList.innerHTML = '';
    
    // Render active quizzes
    if (active.length > 0) {
        elements.quizList.innerHTML += active.map(quiz => createQuizCard(quiz)).join('');
    } else {
        elements.quizList.innerHTML += '<p class="no-quizzes">No active quizzes</p>';
    }
    
    // Render finished quizzes
    if (finished.length > 0) {
        elements.quizList.innerHTML += finished.map(quiz => createFinishedQuizCard(quiz)).join('');
    } else {
        elements.quizList.innerHTML += '<p class="no-quizzes">No finished quizzes</p>';
    }
}

// ===================== Core Functions =====================
async function fetchQuizzes() {
    try {
        const response = await fetch(endpoints.examsApiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
        const data = await response.json();
        if (!data.success) throw new Error('Failed to fetch active quizzes');
        return data.data; // Return active quizzes data
    } catch (error) {
        showError(error.message);
        return []; // Return empty array on error
    }
}

async function fetchFinishedQuizzes() {
    try {
        const response = await fetch(endpoints.finishedExamsApiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
        const data = await response.json();
        if (!data.success) throw new Error('Failed to fetch finished quizzes');
        return data.data; // Return finished quizzes data
    } catch (error) {
        showError(error.message);
        return []; // Return empty array on error
    }
}

function renderQuizzes(quizzes) {
    elements.quizList.innerHTML = quizzes.length > 0 
        ? quizzes.map(quiz => createQuizCard(quiz)).join('')
        : '<p class="no-quizzes">No quizzes available for this course</p>';
}


function renderFinishedQuizzes(quizzes) {
    elements.quizList.innerHTML = quizzes.length > 0 
        ? quizzes.map(quiz => createFinishedQuizCard(quiz)).join('')
        : '<p class="no-quizzes">There is not finished quizzes for this course</p>';
}

function createQuizCard(quiz) {
    return `
        <div class="quiz-card">
            <div class="quiz-info">
                <h3>${quiz.name}</h3>
                <p>
                ${quiz.date ? `Date: ${formatDate(quiz.date)}` : ''}
                ${quiz.time ? ` | Time: ${formatTime(quiz.time)}` : ''}
                </p>
                <p>
                ${quiz.total_score > 0 ? `Total Score: ${quiz.total_score} | ` : ''}
                ${quiz.duration > 0 ? `Duration: ${quiz.duration}min` : ''}
                </p>
                ${quiz.instructions ? `<p class="desc">Instructions: ${quiz.instructions}</p>` : ''}
            </div>
            <div class="actions">
                <button class="view-quiz-btn" id="${quiz.id}">View Quiz</button>
            </div>
        </div>
    `;

}
function createFinishedQuizCard(quiz) {
    return `
        <div class="quiz-card">
            <div class="quiz-info">
                <h3>${quiz.name}</h3>
                <p>
                Number of questions : ${quiz.number_of_questions} |
                Number of Attempt: ${quiz.number_of_attempts} |
                Average Score :  ${quiz.average_grade_percentage} 
                </p>
            </div>
            <div class="actions">
                <button class="regrade-quiz-btn" id="${quiz.exam_id}">Regrade Quiz</button>
                <button class="view-quiz-btn" id="${quiz.exam_id}">View Quiz</button>
            </div>
        </div>
    `;
}

// ===================== Event Handlers =====================
function setupEventListeners() {
    elements.backBtn.addEventListener("click", () => {
        window.location.href = `coursesManagement.html`;
    });

    elements.createQuizBtn.addEventListener("click", () => {
        const encodedCourseId = btoa(courseId);
        window.location.href = `CreateNewQuiz.html?course_id=${encodedCourseId}`;
    });

    elements.quizList.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-quiz-btn')) {
            const quizId = e.target.id;
            handleViewQuiz(quizId);
        }
    });

    elements.quizList.addEventListener('click', (e) => {
        if (e.target.classList.contains('regrade-quiz-btn')) {
            const quizId = e.target.id;
            handleRegradeQuiz(quizId);
        }
    });    
}

// ===================== Action Handlers =====================
function handleViewQuiz(quizId) {
    window.location.href = `viewQuiz.html?course_id=${encodedCourseId}&exam_id=${btoa(quizId)}`;
}

function handleRegradeQuiz(quizId) {
    if (!quizId) return;
    if (!confirm("Are you sure you want to regrade this exam for all students?")) return;

    fetch(`${API_BASE_URL}/instructor/exam/regrade-exam?exam_id=${quizId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Exam regraded successfully!');
            window.location.reload();
        } else {
            alert('Regrading failed: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        alert('Error regrading exam: ' + error.message);
    });
}

// ===================== Utility Functions =====================
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    return timeString.substring(0, 5); // Converts "14:30:00" to "14:30"
}

function showError(message) {
    elements.quizList.innerHTML = `
        <div class="error-message">
            <p>Error: ${message}</p>
        </div>
    `;
}

// ===================== Initialize Application =====================
document.addEventListener('DOMContentLoaded', initializeApp);