
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

document.addEventListener("DOMContentLoaded", function (){
    const pageScripts = {
        // "dashboard": test,
        "user-management": getAllUsersData,
        "content-management": getAllCourses,
        // "reports": test
    }

    const page = document.body.getAttribute("data-page");
    if (pageScripts[page]) {
        pageScripts[page](); // Call the respective function
    }
});

// This function to the content management page
async function getAllCourses() {
        try {
            const response = await fetch('http://localhost:8005/api/getAllCourses', {  // Replace with actual API URL
                method: 'POST', // Ensure the endpoint supports POST
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({}) // Modify body as needed (e.g., send request parameters)
            });

            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.message}`);
            }
            const data = await response.json();
            const tableBody = document.querySelector(".content-management tbody");
            tableBody.innerHTML = ""; // Clear existing table data

            data.forEach((item) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.title}</td>
                <td>${item.admin_id}</td>
                <td>${item.instructor_id}</td>
                <td><button onclick="deleteRow(${item.id})">Delete</button></td>
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
        const response = await fetch('http://localhost:8005/api/getAllUsersData', {  // Replace with actual API URL
        method: 'POST', // Ensure the endpoint supports POST
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Modify body as needed (e.g., send request parameters)
        });

        if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.message}`);
        }

        const data = await response.json();
        const tableBody = document.querySelector(".user-management tbody");
      tableBody.innerHTML = ""; // Clear existing table data

      // Helper function to add a row
        function addRow(user, role) {
            const row = document.createElement("tr");
            row.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${role}</td>
                        <td class="action-icons">
                            <i class="fa-regular fa-pen-to-square edit-icon" data-index="test" data-id="test"></i>
                            <i class="fa-regular fa-trash-can delete-icon" data-index="test" data-id="test"></i>
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


    // Function to delete a row (modify this to actually delete from the server)
// function deleteRow(id) {
// console.log("Delete item with ID:", id);
// }