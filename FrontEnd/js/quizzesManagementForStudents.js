// ===================== URL Parameters =====================
const userId = JSON.parse(localStorage.getItem('userData')).user.id; // Assuming userId is stored in localStorage
const urlParams = new URLSearchParams(window.location.search);
const encodedCourseId  = urlParams.get('course_id');

const courseId = atob(encodedCourseId); // decode courseId

console.log("Decoded courseId:", courseId);

// ===================== DOM References =====================
const elements = {
    backBtn: document.querySelector(".back-btn"),
    quizList: document.querySelector('.quiz-list'),
};

// ===================== Global endpoints =====================
const endpoints = {
    examsApiUrl: `${API_BASE_URL}/student/course/${courseId}/get-exams`,
    finishedExamsApiUrl: `${API_BASE_URL}/student/course/${courseId}/student/${userId}/get-finished-exams`
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
        });
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
        });
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
        <div class="quiz-card" style="display: flex; align-items:center">
            <div class="quiz-info" >
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
                <button class="join-quiz-btn ${(quiz.available) ? "available" : "not-available"}" id="${quiz.id}">Join Quiz</button>
            </div>
        </div>
    `;

}
function createFinishedQuizCard(quiz) {
    return `
        <div class="quiz-card" style="display: flex; align-items:center">
            <div class="quiz-info">
                <h3>${quiz.name}</h3>
                <p>
                Number of questions : ${quiz.number_of_questions} |
                Score :  ${(quiz.available_review) ? quiz.grade : "Not Available"} 
                </p>
            </div>
            <div class="actions">
                <button class="review-quiz-btn ${(quiz.available_review) ? "available" : "not-available"}" id="${quiz.exam_id}">Review Quiz</button>
            </div>
        </div>
    `;
}

// ===================== Event Handlers =====================
function setupEventListeners() {
    elements.backBtn.addEventListener("click", () => {
        window.location.href = `dashboard.html`;
    });

    elements.quizList.addEventListener('click', (e) => {
        if (e.target.classList.contains('join-quiz-btn') &&!e.target.classList.contains('not-available')) {
            const quizId = e.target.id;
            handleJoinQuiz(quizId);
        }
    });


    elements.quizList.addEventListener('click', (e) => {
        if (e.target.classList.contains('join-quiz-btn') &&!e.target.classList.contains('not-available')) {
                const quizId = e.target.id;
                handleRegradeQuiz(quizId);
        }
    });    
}

// ===================== Action Handlers =====================
function handleJoinQuiz(quizId) {
    window.location.href = `joinQuiz.html?course_id=${encodedCourseId}&exam_id=${btoa(quizId)}`;
}

function handleRegradeQuiz(quizId) {
    if (!quizId) return;
    if (!confirm("Are you sure you want to regrade this exam for all students?")) return;

    fetch(`${API_BASE_URL}/exam/regradeExam?exam_id=${quizId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
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