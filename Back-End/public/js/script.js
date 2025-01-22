const users = [
    { id: "#20462", name: "Maryam Hosam", email: "Marmar@gmail.com", role: "Admin" },
    { id: "#18933", name: "Maryam Hosam", email: "Marmar@gmail.com", role: "Admin" },
    { id: "#45169", name: "Maryam Hosam", email: "Marmar@gmail.com", role: "Instructor" },
    { id: "#20462", name: "Maryam Hosam", email: "Marmar@gmail.com", role: "Student" },
];

function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = ''; 

    users.forEach((user, index) => {
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

    const newId = prompt("Enter the ID:", user.id);
    const newName = prompt("Enter the name:", user.name);
    const newEmail = prompt("Enter the email:", user.email);
    const newRole = prompt("Enter the role (Admin, Instructor, Student):", user.role);

    if (newId !== null) user.id = newId;
    if (newName !== null) user.name = newName;
    if (newEmail !== null) user.email = newEmail;

    if (newRole !== null && ["Admin", "Instructor", "Student"].includes(newRole)) {
        user.role = newRole;
    } else if (newRole !== null) {
        alert("Invalid role! Please enter 'Admin', 'Instructor', or 'Student'.");
    }

    loadUsers();
}

document.addEventListener('DOMContentLoaded', loadUsers);


