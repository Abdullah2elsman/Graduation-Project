// ===================== DOM References =====================
const booksParent = document.querySelector('.books-parent');

// ===================== Global Variables =====================
let userId = null;

// ===================== Initialize Application =====================
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    // Load user id safely
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            userId = userData?.user?.id ?? null;
        } catch (err) {
            console.error('Invalid user data in localStorage:', err);
        }
    }

    if (!userId) {
        console.error('User not logged in or invalid user data');
        redirectToLogin();
        return;
    }

    fetchCourses();
}

// ===================== Core Functions =====================
function fetchCourses() {
    
    fetch(`${API_BASE_URL}/instructor/${userId}/courses`, {
        method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) throw new Error('Failed to fetch courses');
        renderCourses(data.data);
    })
    .catch(handleError);
}


function renderCourses(courses) {
    booksParent.innerHTML = '';
    if (!Array.isArray(courses) || courses.length === 0) {
        booksParent.innerHTML = `
            <div style="text-align:center; color:#888; font-size:1.5rem; font-weight:bold; padding:40px;">
                No courses available at the moment. 📚
            </div>
        `;
        return;
    }
    courses.forEach(course => {
        booksParent.appendChild(createCourseElement(course));
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
    // Click on the course card but not on buttons
    bookDiv.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            handleCourseClick(courseId);
        }
    });

    // Open course content button
    bookDiv.querySelector('.open').addEventListener('click', () => {
        handleOpenCourse(courseId);
    });

    // Navigate to quizzes page
    bookDiv.querySelector('.quiz').addEventListener('click', () => {
        handleQuizNavigation(courseId);
    });

    // Navigate to report of students page
    bookDiv.querySelector('.report-student').addEventListener('click', () => {
        handleReportStudent(courseId);
    });
}

function handleCourseClick(courseId) {
    const encodedCourseId = btoa(courseId);
    window.location.href = `book.html?course_id=${encodedCourseId}`;
}

function handleOpenCourse(courseId) {
    const encodedCourseId = btoa(courseId);
    window.location.href = `book.html?course_id=${encodedCourseId}`;
}

function handleQuizNavigation(courseId) {
    const encodedCourseId = btoa(courseId); // base64 encode the course ID
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
    redirectToLogin();
}