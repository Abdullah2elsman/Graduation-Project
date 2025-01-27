const users = [
    { id: "#20462", title: "UX-UI Design (Technical interview's questions)", addby: "#20462", managedby: "#20462" },
    { id: "#18933", title: "UX-UI Design (Technical interview's questions)", addby: "#20462", managedby: "#18933" },
    { id: "#20462", title: "UX-UI Design (Technical interview's questions)", addby: "#20462", managedby: "#20462" },
    { id: "#18933", title: "UX-UI Design (Technical interview's questions)", addby: "#20462", managedby: "#20462" },
    { id: "#20462", title: "UX-UI Design (Technical interview's questions)", addby: "#20462", managedby: "#20462" },
];

function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '';
    users.forEach((user, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.title}</td>
            <td>${user.addby}</td>
            <td>${user.managedby}</td>
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
    const newId = prompt("Enter the id", user.id);
    const newTitle = prompt("Enter your Title of course", user.title);
    const newAddBy = prompt("Add By:", user.addby);
    const newManagedBy = prompt("Managed By:", user.managedby);

    if (newTitle !== null) user.title = newTitle;
    if (newAddBy !== null) user.addby = newAddBy;
    if (newManagedBy !== null) user.managedby = newManagedBy;

    loadUsers(); 
}
document.addEventListener('DOMContentLoaded', loadUsers);

















