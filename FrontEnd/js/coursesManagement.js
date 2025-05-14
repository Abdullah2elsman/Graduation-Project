// ===================== DOM References =====================
const booksParent = document.querySelector('.books-parent');
console.log("Okay, here are 5 easy, direct, and factual quiz questions covering pages 2 through 5 of the provided document. There's a mix of true/false and multiple-choice questions:\n\n**Quiz Questions:**\n\n1.  **True or False:** A network switch connects nodes with each other and with other racks.\n2.  **Multiple Choice:** Physical Infrastructure consists mainly of which of the following?\n    a) Servers, Storage, and Network\n    b) Monitors, Keyboards, and Mice\n    c) Printers, Scanners, and Routers\n    d) Cables, Connectors, and Power supplies\n3.  **True or False:** 1 Rack Unit (1U) is equal to 2.75 inches.\n4. **Multiple Choice:** Which of the following is a type of server configuration?\n    a) Tower\n    b) Rack-mountable\n    c) Blade\n    d) All of the above\n5.  **True or False:** Cables can affect cooling in a server rack.\n\n**Answer Key:**\n\n1.  True\n2.  a) Servers, Storage, and Network\n3.  False\n4.  d) All of the above\n5.  True")
// ===================== Initial Setup =====================
function initializeApp() {
    fetchCourses();
}

// ===================== Core Functions =====================
function fetchCourses() {
    fetch(`${url}/instructor/${201}/courses`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) throw new Error('Failed to fetch courses');
            renderCourses(data.data);
        })
        .catch(handleError);
}

function renderCourses(courses) {
    booksParent.innerHTML = '';
    courses.forEach(course => {
        booksParent.appendChild(createCourseElement(course));
    });
}

function createCourseElement(course) {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'book';
    bookDiv.id = `course-${course.id}`;
    
    const imagePath = course.image_path 
        ? `${url}/../storage/${course.image_path}`
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
            <button class="report-student">
                Report of student <i class="far fa-chart-bar"></i>
            </button>
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

    // Report button handler
    bookDiv.querySelector('.report-student').addEventListener('click', () => {
        handleReportStudent(courseId);
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

function handleReportStudent(courseId) {
    const encodedCourseId = btoa(courseId);
    window.location.href = `reportsOfStudents.html?course_id=${encodedCourseId}`;
}

// ===================== Utility Functions =====================
function handleError(error) {
    console.error('Error:', error);
    booksParent.innerHTML = `
        <p class="error-message">
            Error loading courses: ${error.message}
        </p>
    `;
}

// ===================== Initialize Application =====================
document.addEventListener('DOMContentLoaded', initializeApp);