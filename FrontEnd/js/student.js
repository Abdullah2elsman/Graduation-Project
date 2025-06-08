// ===================== DOM References =====================
const elements = {
    userName: document.querySelector('.user-name'),
    quizzesToday: document.querySelector('.quiz-alert .quiz-number'),
    booksParent: document.querySelector('.books-parent'),
}

const API_BASE_URL = 'http://localhost:8005/api';
// ===================== Initial Setup =====================
function initializeApp() {
    setupEventListeners();
    fetchCourses();
}

// ===================== Core Functions =====================
function fetchCourses() {
    let userId = 301;
    fetch(`${API_BASE_URL}/student/${userId}/courses`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) throw new Error('Failed to fetch courses');
            renderCourses(data.data);
        })
        .catch(handleError);
}

function renderCourses(courses) {
    elements.booksParent.innerHTML = '';
    if (!Array.isArray(courses) || courses.length === 0) {
        elements.booksParent.innerHTML = `
            <div style="text-align:center; color:#888; font-size:1.5rem; font-weight:bold; padding:40px; margin: auto;">
                No courses available at the moment. 📚
            </div>
        `;
        return;
    }
    courses.forEach(course => {
        elements.booksParent.appendChild(createCourseElement(course));
    });
}

function createCourseElement(course) {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'book';
    bookDiv.id = `course-${course.id}`;
    
    const imagePath = course.image_path 
        ? `${API_BASE_URL}/../storage/${course.image_path}`
        : '../imgs/default-course.png';

    bookDiv.style.backgroundImage = `url(${imagePath})`;
    
    bookDiv.innerHTML = `
        <div class="up-frame">
            <button class="open">
                open<i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="down-frame">
            <p>${course.title}</p>
            <div class="course-info"></div>
            <button class="quiz">Quizzes</button>
        </div>
    `;

    addCourseEventListeners(bookDiv, course.id);
    return bookDiv;
}


// ===================== Event Handlers =====================

function addCourseEventListeners(bookDiv, courseId) {
    // Book click handler
    bookDiv.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            handleCourseClick(courseId);
        }
    });

    // Open button handler
    bookDiv.querySelector('.open').addEventListener('click', () => {
        handleOpenCourse(courseId);
    });

    // Quiz button handler
    bookDiv.querySelector('.quiz').addEventListener('click', () => {
        handleQuizNavigation(courseId);
    });
}

function handleCourseClick(courseId) {
    console.log(`Course ${courseId} clicked`);
    // window.location.href = `/course.html?id=${courseId}`;
}

function handleOpenCourse(courseId) {
    console.log(`Opening course ${courseId}`);
    // window.location.href = `course-content.html?id=${courseId}`;
}

function handleQuizNavigation(courseId) {
    const encodedCourseId = btoa(courseId); // encode courseId
    window.location.href = `QuizzesManagement.html?course_id=${encodedCourseId}`;
}

// ===================== Event Listeners Setup =====================
function setupEventListeners() {

}

// ===================== Handle Error Functions =====================
function handleError(error) {
    console.error('Error:', error);
    alert('An error occurred while processing your request. Please try again later.');
}

// ===================== Initialize Application =====================
document.addEventListener('DOMContentLoaded', initializeApp);