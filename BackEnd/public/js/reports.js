const users = [
    { id: "#20462", name: "Rana", book: "Math", exam: "Baise of Math", grade: 8 },
    { id: "#20463", name: "Lana", book: "Math", exam: "Baise of Math", grade: 7 },
    { id: "#20464", name: "Sara", book: "Math", exam: "Baise of Math", grade: 9 }
];

function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '';
    users.forEach((user, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.book}</td>
            <td>${user.exam}</td>
            <td>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${user.grade * 10}%"></div>
                </div>
                <span class="grade-text">${user.grade}/10</span>
            </td>
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
    const newName = prompt("Enter the Name:", user.name);
    const newBook = prompt("Enter the Book Name:", user.book);
    const newExam = prompt("Enter the Exam Title:", user.exam);
    const newGrade = prompt("Enter the Grade (0-10):", user.grade);

    if (newId !== null) user.id = newId;
    if (newName !== null) user.name = newName;
    if (newBook !== null) user.book = newBook;
    if (newExam !== null) user.exam = newExam;
    if (newGrade !== null && !isNaN(newGrade) && newGrade >= 0 && newGrade <= 10) {
        user.grade = parseFloat(newGrade); 
    }

    loadUsers();
}

document.addEventListener('DOMContentLoaded', loadUsers);
