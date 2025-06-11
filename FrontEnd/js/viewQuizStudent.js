// ======================= DOM Elements ========================
const timerEl = document.getElementById('timer');
const popup = document.getElementById('popup');
const message = document.getElementById('popup-message');
const btn = document.getElementById('popup-btn');
const courseId = 43;
const examId = 46;

// ======================= Global Variables =======================
let totalTime = 300; // 5 minutes
let blink = false;
let intervalId;

// ======================= Initialize App =======================
function initializeApp() {

    fetchQuiz();
    intervalId = setInterval(updateTimer, 500);
    updateTimer();
    setupEventListeners();
}

// ======================= Fetch Quiz =======================
async function fetchQuiz(){
    fetch(`${API_BASE_URL}/student/course/${courseId}/get-exams-questions?exam_id=${examId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // if (!data.success) throw new Error('Failed to fetch quiz');
        // if (data.data.length === 0) {
        //     showPopup('finish');
        //     return;
        // }
        
        // const quiz = data.data[0];
        // totalTime = quiz.time; // Set total time from quiz data
        // document.getElementById('quiz-title').textContent = quiz.title;
        // document.getElementById('quiz-description').textContent = quiz.description;

        console.log(data);
    })
    .catch(handleError);
}

// ======================= Error Handling =======================
function handleError(error) {
    console.error('Error:', error);
    alert('An error occurred while fetching the quiz. Please try again later.');
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
        btn.textContent = "Finish Quiz";
    }

    popup.style.display = 'flex';
}

// ======================= Event Listeners =======================
function setupEventListeners() {
    btn.addEventListener('click', () => {
        popup.style.display = 'none';
    });
}


// ======================= Start App =======================
document.addEventListener("DOMContentLoaded",initializeApp);
