let users = []; 
const rowCountSelect = document.getElementById('rowCount');

async function fetchUsersFromDatabase() {
    try {
        const response = await fetch('https://example.com/api/users'); 
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        users = await response.json(); 
        loadUsers(); 
    } catch (error) {
        console.error("Error fetching data from database:", error);
    }
}

function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = ''; 

    const searchId = document.getElementById('searchId').value.toLowerCase();
    const searchRole = document.getElementById('searchRole').value.toLowerCase();
    const globalSearch = document.getElementById('globalSearch').value.toLowerCase(); 

    const filteredUsers = users.filter(user => {
        const matchesGlobalSearch = 
            user.id.toString().toLowerCase().includes(globalSearch) ||
            user.name.toLowerCase().includes(globalSearch) ||
            user.email.toLowerCase().includes(globalSearch) ||
            user.role.toLowerCase().includes(globalSearch);

        return (
            (user.id.toString().toLowerCase().includes(searchId)) &&
            (user.role.toLowerCase().includes(searchRole)) &&
            matchesGlobalSearch 
        );
    });

    const rowCount = parseInt(rowCountSelect.value, 10);
    const usersToDisplay = filteredUsers.slice(0, rowCount); 

    usersToDisplay.forEach((user, index) => {
        const row = document.createElement('tr');
        const roleClass = `role-${user.role.toLowerCase()}`;

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="${roleClass}">${user.role}</span></td>
            <td class="action-icons">
                <i class="fa-regular fa-pen-to-square edit-icon" data-index="${index}"></i>
                <i class="fa-regular fa-trash-can delete-icon" data-index="${index}"></i>
            </td>
        `;

        tableBody.appendChild(row);
    });

    const deleteIcons = document.querySelectorAll('.delete-icon');
    deleteIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const rowIndex = e.target.getAttribute('data-index');
            deleteRow(rowIndex);
        });
    });

    const editIcons = document.querySelectorAll('.edit-icon');
    editIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const rowIndex = e.target.getAttribute('data-index');
            editRow(rowIndex);
        });
    });
}

function deleteRow(index) {
    users.splice(index, 1);
    loadUsers();
}

function editRow(index) {
    const user = users[index];
    const newName = prompt("Enter the name:", user.name);
    const newEmail = prompt("Enter the email:", user.email);
    const newRole = prompt("Enter the role (Admin, Instructor, Student):", user.role);

    if (newName !== null) user.name = newName;
    if (newEmail !== null) user.email = newEmail;

    if (newRole !== null && ["Admin", "Instructor", "Student"].includes(newRole)) {
        user.role = newRole;
    } else if (newRole !== null) {
        alert("Invalid role! Please enter 'Admin', 'Instructor', or 'Student'.");
    }

    loadUsers();
}

document.querySelectorAll('.search-filter input').forEach(input => {
    input.addEventListener('input', (e) => {
        const icon = e.target.previousElementSibling;
        if (icon && icon.classList.contains('sic')) {
            icon.style.display = e.target.value ? 'none' : '';
        }
    });
});

document.addEventListener('DOMContentLoaded', fetchUsersFromDatabase);
document.querySelectorAll('.search-filter input').forEach(input => {
    input.addEventListener('input', loadUsers);
});
rowCountSelect.addEventListener('change', loadUsers);

document.querySelector('.add-user-btn').addEventListener('click', async () => {
    
    const userId = `#${Math.floor(10000 + Math.random() * 90000)}`; 
    const userName = prompt("Enter the user's name:").trim();
    const userEmail = prompt("Enter the user's email:").trim();
    const userRole = prompt("Enter the role (Admin, Instructor, Student):").trim();

    if (!userName || !userEmail || !userRole) {
        alert("All fields are required!");
        return;
    }


    const validRoles = ["Admin", "Instructor", "Student"];
    if (!validRoles.includes(userRole)) {
        alert("Invalid role! Please enter 'Admin', 'Instructor', or 'Student'.");
        return;
    }


    const newUser = {
        id: userId,
        name: userName,
        email: userEmail,
        role: userRole
    };

    try {

        const response = await fetch('https://example.com/api/add-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });

        if (!response.ok) {
            throw new Error('Failed to add user');
        }

        alert('User added successfully!');
        fetchUsersFromDatabase(); 
    } catch (error) {
        console.error("Error adding user:", error);
        alert("Error while adding user!");
    }
});


document.getElementById('searchId').addEventListener('input', loadUsers);
document.getElementById('searchRole').addEventListener('input', loadUsers);


document.getElementById('globalSearch').addEventListener('input', loadUsers);
