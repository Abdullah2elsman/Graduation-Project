// ======================= DOM Elements ========================
const elements = {
    questionsWrapper: document.querySelector('.questions-wrapper'),
    finishBtn: document.querySelector('.finish-btnn'),
    popupFinishBtn: document.getElementById('popup-finish-btn'),
    popupCancelBtn: document.getElementById('popup-cancel-btn'),
    backBtn: document.querySelector('.back-btn')
}
console.log(elements.finishBtn);
const timerEl = document.getElementById('timer');
const popup = document.getElementById('popup');
const message = document.getElementById('popup-message');
const courseId = 43;
const examId = 44;

// ======================= Global Variables =======================
let totalTime = 300; // 5 minutes
let blink = false;
let intervalId;
let studentAnswers = [];
const studentId = JSON.parse(localStorage.getItem('userData')).user.id;
// ======================= Initialize App =======================
function initializeApp() {

    studentAnswers = loadAnswersFromLocalStorage();
    fetchQuiz();
    intervalId = setInterval(updateTimer, 500);
    updateTimer();
    setupEventListeners();
}

// ======================= Fetch Quiz =======================
async function fetchQuiz(){
    fetch(`${API_BASE_URL}/student/course/${courseId}/exams/get-exam-questions?exam_id=${examId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(quiz => {
        if (!quiz.success) throw new Error('Failed to fetch quiz');
            if (quiz.data.length === 0) {
                showPopup('finish');
                return;
        }

        renderQuizQuestions(quiz.data.questions);
        renderQuizNav(quiz.number_of_questions);
        // return console.log(quiz.data.questions);

    })
    .catch(handleError);
}



// ======================= Error Handling =======================
function handleError(error) {
    console.error('Error:', error);
    alert('An error occurred while fetching the quiz. Please try again later.');
}

// ======================= Render Questions =======================
function renderQuizQuestions(questions) {
    elements.questionsWrapper.innerHTML = '';
    questions.forEach((question, idx) => {
        let optionsHtml = '';
        question.options.forEach((opt, optIdx) => {
            // شوف هل option ده متعلم عليه ولا لأ
            const isSelected = studentAnswers.some(ans => ans.question_id == question.id && ans.option_id == opt.id);
            optionsHtml += `<input type="text" class="option${isSelected ? ' selected' : ''}" id="${opt.id}" value="${opt.option}" placeholder="Add Option ${optIdx + 1}" onclick="selectOption(this)" readonly >`;
        });
        const score = Number(question.score).toFixed(2);

        const questionHtml = `
            <div class="question-card" id="${question.id}">
                <div class="question-info">
                    <h2>Question ${idx + 1}</h2>
                    <div class="mark">Mark ${score} out  ${score}</div>
                </div>
                <div class="question-body">
                    <input type="text" class="question" value="${question.question}" style="margin-bottom: 25px;" placeholder="Add Question..................................................?" readonly>
                    ${optionsHtml}
                </div>
            </div>
        `;
        elements.questionsWrapper.innerHTML += questionHtml;
    });
}


// ======================= Helper Functions =======================

// Format seconds to mm:ss
function formatTime(sec) {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update the countdown timer
function updateTimer() {
    timerEl.textContent = formatTime(totalTime);

    if (totalTime <= 10) {
        timerEl.classList.add('red');
        timerEl.style.visibility = blink ? 'visible' : 'hidden';
        blink = !blink;
    } else if (totalTime <= 180) {
        timerEl.classList.add('red');
        timerEl.style.visibility = 'visible';
    } else {
        timerEl.classList.remove('red');
        timerEl.style.visibility = 'visible';
    }

    if (totalTime > 0) {
        totalTime--;
    } else {
        clearInterval(intervalId);
        timerEl.style.visibility = 'visible';
    }
}

// Show confirmation popup
function showPopup(type) {
    if (type === 'finish') {
        message.textContent = "Are you sure you want to finish this quiz?";
        elements.popupFinishBtn.textContent = "Finish Quiz";
        elements.popupCancelBtn.textContent = "Cancel";
    } 

    popup.style.display = 'flex';
}

// Select an option
function selectOption(input) {
    const parent = input.closest('.question-body');
    parent.querySelectorAll('input[type="text"][onclick]').forEach(opt => opt.classList.remove('selected'));
    input.classList.add('selected');

    // save answers to local storage
    studentAnswers = collectAnswers();
    saveAnswersToLocalStorage();
}

function collectAnswers() {
    const answers = [];
    document.querySelectorAll('.question-card').forEach(card => {
        const questionId = card.id;
        const selectedOption = card.querySelector('.option.selected');
        if (selectedOption) {
            answers.push({
                question_id: Number(questionId),
                option_id: Number(selectedOption.id)
            });
        }
    });
    return answers;
}

function renderQuizNav(numberOfQuestions) {
    const navButtons = document.getElementById('navButtons');
    navButtons.innerHTML = '';
    for(let i = 1; i <= numberOfQuestions; i++) {
        navButtons.innerHTML += `<button>${i}</button>`;
    }
}

function saveAnswersToLocalStorage() {
    localStorage.setItem(`studentAnswers_exam_${examId}`, JSON.stringify(studentAnswers));
}

function loadAnswersFromLocalStorage() {
    const savedAnswers = localStorage.getItem(`studentAnswers_exam_${examId}`);
    return savedAnswers ? JSON.parse(savedAnswers) : [];
}




// ======================= Event Listeners =======================
function setupEventListeners() {
    elements.popupCancelBtn.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    elements.finishBtn.addEventListener('click', () => {
        studentAnswers = collectAnswers();
        console.log(studentAnswers);
    });

    elements.popupFinishBtn.addEventListener('click', () => {
        popup.style.display = 'none';
        submitQuiz();
    });

    elements.backBtn.addEventListener('click', () => {
        window.location.href = `QuizzesManagement.html?course_id=${btoa(courseId)}`;
    });
}

async function submitQuiz(){
    await getCsrfCookie();

    const xsrfToken = decodeURIComponent(getCookie('XSRF-TOKEN'));

        fetch(`${API_BASE_URL}/student/course/exams/finish-exam`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrfToken
            },
            body: JSON.stringify(
                {
                    student_id: studentId,
                    exam_id: examId,
                    answers: studentAnswers
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Quiz submitted successfully!');
                    localStorage.removeItem(`studentAnswers_exam_${examId}`);
                    window.location.href = `QuizzesManagement.html?course_id=${btoa(courseId)}`; // Redirect to dashboard or another page
                } else {
                    alert('Failed to submit quiz. Please try again later.');
                }
            })
            .catch(handleError);
}





// ======================= Start App =======================
document.addEventListener("DOMContentLoaded",initializeApp);

window.addEventListener('beforeunload', (event) => {
    saveAnswersToLocalStorage();
});

