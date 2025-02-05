const token = localStorage.getItem('authToken');
const url = "http://localhost:8005";


// This function to check if the user login or not
const checkUserLogin = async () => {
    if (!token) {
        // No token, redirect to login
        window.location.href = 'Auth/login.html';
        return;
    }
    
    try {
        // Send a request to validate the token
        const response = await fetch(`${url}/api/validateToken`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (response.ok) {
            // Token is valid, fetch user data
            const userData = await response.json();

            document.querySelector('.footer-info .name').innerHTML = userData.user.name;
            document.querySelector('.footer-info .email').innerHTML = userData.user.email;
        } else {
      // Token is invalid, redirect to login
        console.error('Invalid token, redirecting to login...');
        window.location.href = 'Auth/login.html';
    }
    } catch (error) {
    console.error('Error validating token:', error);
    window.location.href = 'Auth/login.html'; // Redirect on error
    }
};


// Logout button
document.querySelector(".logout-button").addEventListener(
    "click",
    async () => {
        try {
            const response = await fetch(`${url}/api/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
                throw new Error('Failed to fetch data');
        }
        } catch (error) {
            console.error("Error fetching data from database:", error);
        }

        // Remove token from local storage
        localStorage.removeItem("authToken");

        // Redirect to login page
        window.location.href = "Auth/login.html";
    }
);


// Sidebar script
document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar");
    const rightArrow = document.querySelector(".arrow-right");
    const leftArrow = document.querySelector('.arrow-left');
    const menuItems = document.querySelectorAll(".menu-item");
    const logo = document.getElementById('Logo');
    const content = document.querySelector('.content');
    console.log(logo.src);
    leftArrow.addEventListener("click", function () {
        sidebar.classList.add("collapsed");
        logo.src += "/../logo-collapsed.svg";
        rightArrow.style.display = 'flex';
        leftArrow.style.display = 'none';
        content.style.marginLeft = 70 + 'px';
    });
        
    rightArrow.addEventListener('click', function() {
        sidebar.classList.remove("collapsed");
        logo.src = "imgs/logo.svg";
        rightArrow.style.display = 'none';
        leftArrow.style.display = 'block';
        content.style.marginLeft = 240 + 'px';

    });
    menuItems.forEach(item => {
        item.addEventListener("click", function () {
        menuItems.forEach(i => i.classList.remove("selected"));
        this.classList.add("selected");
        });
    });
    
});

// To manage function execution in pages
document.addEventListener("DOMContentLoaded", function (){
    const pageScripts = {
        "dashboard": getNumOfUsers,
        "user-management": getAllUsersData,
        "content-management": getAllCourses,
        "reports": getReports
    }

    const page = document.body.getAttribute("data-page");
    if (pageScripts[page]) {
        pageScripts[page](); // Call the respective function
    }
    checkUserLogin();
});

// This in Dashboard function to get the number of users from database
async function getNumOfUsers() {
    try {
        const response = await fetch(`${url}/api/getNumOfUsers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const numOfUsers = await response.json(); 
        document.querySelector('.admin p').innerHTML = numOfUsers.numberOfAdmins;
        document.querySelector('.instructor p').innerHTML = numOfUsers.numberOfInstructors;
        document.querySelector('.student p').innerHTML = numOfUsers.numberOfStudents;
    } catch (error) {
        console.error("Error fetching data from database:", error);
    }
}

// This function to the content management page
async function getAllCourses() {
        try {
            const response = await fetch(`${url}/api/getAllCourses`, {  // Replace with actual API URL
                method: 'POST', // Ensure the endpoint supports POST
                headers: {
                'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({}) // Modify body as needed (e.g., send request parameters)
            });

            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.message}`);
            }
            const data = await response.json();
            const tableBody = document.querySelector(".table-container tbody");
            tableBody.innerHTML = ""; // Clear existing table data

            data.forEach((item) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.title}</td>
                    <td>${item.admin_id}</td>
                    <td>${item.instructor_id}</td>
                    <td style="padding: 10px">
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
                    </td>
                `;
                tableBody.appendChild(row);
            });
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

// This function to the user management page
async function getAllUsersData() {
    try {
        const response = await fetch(`${url}/api/getAllUsersData`, {  // Replace with actual API URL
        method: 'POST', // Ensure the endpoint supports POST
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}) // Modify body as needed (e.g., send request parameters)
        });

        if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.message}`);
        }

        const data = await response.json();
        const tableBody = document.querySelector(".table-container tbody");
      tableBody.innerHTML = ""; // Clear existing table data

      // Helper function to add a row
        function addRow(user, role) {
            const row = document.createElement("tr");
            row.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td class="role-user"><span class="${role.toLowerCase()}">${role}</span></td>
                        <td class="action-icons">
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
                        </td>
                    `;
            tableBody.appendChild(row);
        }

        // Iterate through each category and add rows
        data.admins.forEach(admin => addRow(admin, "Admin"));
        data.instructors.forEach(instructor => addRow(instructor, "Instructor"));
        data.students.forEach(student => addRow(student, "Student"));

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

// This function to the reports page in Admin 
async function getReports(){
    try {
        const response = await fetch(`${url}/api/getReports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`HTTP Error Status: ${response.status} - ${response.statusText}`);
        }

        const responseData = await response.json(); // Now we get an object
        console.log("API Response:", responseData); // Debugging

        const data = responseData.data;

        if (!Array.isArray(data)) {
            console.error("Error: Expected an array but received:", data);
            return;
        }

        const tableBody = document.querySelector('.table-container tbody');
        tableBody.innerHTML = ""; // Clear the table

        data.forEach((item) => {
            const courseTitle = item.exam.course ? item.exam.course.title : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.student?.id || 'N/A'}</td>
                <td>${item.student?.name || 'N/A'}</td>
                <td>${courseTitle}</td>
                <td>${item.exam?.exam || 'N/A'}</td>
                <td style="display: flex; align-items: center;">
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${item.grade}%"></div>
                    </div>
                    <span class="progress-text">${item.grade}%</span>
                </td>
                <td class="actions">
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
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}


    // Function to delete a row (modify this to actually delete from the server)
// function deleteRow(id) {
// console.log("Delete item with ID:", id);
// }