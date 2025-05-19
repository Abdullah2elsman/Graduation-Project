// ===================== Configuration =====================
const API_BASE_URL = 'http://localhost:8005/api';
const PAGES = ['dashboard', 'user-management', 'content-management', 'reports'];

// ===================== DOM Elements =====================
const elements = {
    // Dashboard
    numberOfAdmins: document.querySelector('.admin p'),
    numberOfInstructors: document.querySelector('.instructor p'),
    numberOfStudents: document.querySelector('.student p'),

    // User Management
    userManagementTable: document.querySelector(".user-management tbody"),

    // Content Management
    contentManagementTable: document.querySelector(".content-management tbody"),

    // Reports
    reportsTable: document.querySelector('.table-container tbody'),
}
// ===================== Main Functions =====================
async function initializeApp() {

    try {
        const page = document.body.getAttribute("data-page");
        if (PAGES.includes(page)) {
        switch(page) {
            case 'dashboard': await handleDashboard(); break;
            case 'user-management': await handleUsers(); break;
            case 'content-management': await handleCourses(); break;
            case 'reports': await handleReports(); break;
        }
    }
    
        // setupBackButton();
        // checkLogin();
    
    } catch (error) {
        console.error("App Error:", error);
        alert("Failed to load page data");
    }
}

// ===================== Page Handlers =====================
async function handleDashboard() {
    const data = await fetchData('/admin/getNumOfUsers');
    elements.numberOfAdmins.innerHTML = data.number_of_admins;
    elements.numberOfInstructors.innerHTML = data.number_of_instructors;
    elements.numberOfStudents.innerHTML = data.number_of_students;
}

async function handleUsers() {
    const data = await fetchData('/admin/getAllUsersData');
    elements.userManagementTable.innerHTML = [
        ...data.admins.map(user => userRow(user, 'Admin')),
        ...data.instructors.map(user => userRow(user, 'Instructor')),
        ...data.students.map(user => userRow(user, 'Student'))
    ].join('');
}

async function handleCourses() {
    const data = await fetchData('/admin/getAllCourses');
    elements.contentManagementTable.innerHTML = 
    data.map(course => `
        <tr>
            <td>${course.id}</td>
            <td>${course.title}</td>
            <td>${course.admin_id}</td>
            <td>${course.instructor_id}</td>
            <td>${actionIcons()}</td>
        </tr>
    `).join('');
}

async function handleReports() {
    const data = await fetchData('/admin/getReports');
    elements.reportsTable.innerHTML = 
    data.map(item => `
        <tr>
            <td>${item.student?.id || 'N/A'}</td>
            <td>${item.student?.name || 'N/A'}</td>
            <td>${item.exam.course?.title || 'N/A'}</td>
            <td>${item.exam?.exam || 'N/A'}</td>
            <td style="display: flex; align-items: center; justify-content: center; padding: 23px 20px;">
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${item.grade}%"></div>
                </div>
                <span class="progress-text">${item.grade}%</span>
            </td>
            <td>${actionIcons()}</td>
        </tr>
    `).join('');
}

// ===================== Helpers =====================
async function fetchData(endpoint) {
    const response = await fetch(API_BASE_URL + endpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) throw new Error('API request failed');
    const result = await response.json();
    return result;
}

function userRow(user, role) {
    return `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td class="role-user"><span class="${role.toLowerCase()}">${role}</span></td>
            <td>${actionIcons()}</td>
        </tr>
    `;
}


function actionIcons() {
    return `
        <svg class="edit-action" width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.1001" y="0.5" width="31" height="31" rx="3.5" stroke="#28A745" />
            <path
                d="M21.0868 8.86167L22.7743 7.17417C23.5065 6.44194 24.6937 6.44194 25.4259 7.17417C26.1582 7.90641 26.1582 9.09359 25.4259 9.82583L14.8073 20.4445C14.2786 20.9731 13.6265 21.3618 12.91 21.5752L10.2251 22.375L11.0249 19.6901C11.2383 18.9736 11.6269 18.3215 12.1556 17.7928L21.0868 8.86167ZM21.0868 8.86167L23.7251 11.5M22.2251 18.375V23.125C22.2251 24.3676 21.2177 25.375 19.9751 25.375H9.4751C8.23246 25.375 7.2251 24.3676 7.2251 23.125V12.625C7.2251 11.3824 8.23246 10.375 9.4751 10.375H14.2251"
                stroke="#28A745" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg class="delete-action" width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1.1001" y="0.5" width="31" height="31" rx="3.5" stroke="#D32F2F" />
                <path
                    d="M19.3405 13L18.9943 22M14.2059 22L13.8597 13M23.8277 9.79057C24.1697 9.84221 24.5105 9.89747 24.8501 9.95629M23.8277 9.79057L22.7599 23.6726C22.6697 24.8448 21.6922 25.75 20.5165 25.75H12.6837C11.508 25.75 10.5305 24.8448 10.4403 23.6726L9.37245 9.79057M23.8277 9.79057C22.6813 9.61744 21.5216 9.48485 20.3501 9.39432M8.3501 9.95629C8.68967 9.89747 9.03047 9.84221 9.37245 9.79057M9.37245 9.79057C10.5189 9.61744 11.6786 9.48485 12.8501 9.39432M20.3501 9.39432V8.47819C20.3501 7.29882 19.4394 6.31423 18.2607 6.27652C17.7093 6.25889 17.1557 6.25 16.6001 6.25C16.0444 6.25 15.4909 6.25889 14.9395 6.27652C13.7608 6.31423 12.8501 7.29882 12.8501 8.47819V9.39432M20.3501 9.39432C19.1127 9.2987 17.8621 9.25 16.6001 9.25C15.3381 9.25 14.0875 9.2987 12.8501 9.39432"
                    stroke="#D32F2F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    `;
}

function setupBackButton() {
    console.log("Setting up back button...");
    // document.querySelector('.back').addEventListener('click', () => {
    //     window.history.back();
    // });
}

function checkLogin() {
    if (!localStorage.getItem('token')) {
        window.location.href = '/login';
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', initializeApp);