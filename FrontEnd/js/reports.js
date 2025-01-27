let users = [];
const rowCountSelect = document.getElementById('rowCount');
const addUserButton = document.querySelector('.add-user-btn');

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
    const searchBook = document.getElementById('searchBook').value.toLowerCase();
    const searchExam = document.getElementById('searchExam').value.toLowerCase();
    const searchGlobal = document.getElementById('globalSearch').value.toLowerCase();

    const filteredUsers = users.filter(user => {
        const idMatch = user.id.toString().toLowerCase().includes(searchId);
        const bookMatch = user.book.toLowerCase().includes(searchBook);
        const examMatch = user.exam.toLowerCase().includes(searchExam);
        const globalMatch =
            user.id.toString().toLowerCase().includes(searchGlobal) ||
            user.name.toLowerCase().includes(searchGlobal) ||
            user.book.toLowerCase().includes(searchGlobal) ||
            user.exam.toLowerCase().includes(searchGlobal) ||
            user.grade.toString().includes(searchGlobal);

        return (searchGlobal ? globalMatch : true) && idMatch && bookMatch && examMatch;
    });

    // تحديد عدد الصفوف بناءً على اختيار المستخدم
    const rowCount = parseInt(rowCountSelect.value, 10) || 10;
    const usersToDisplay = filteredUsers.slice(0, rowCount);

    usersToDisplay.forEach((user, index) => {
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

    attachEventListeners();
}

// إضافة الأحداث لأيقونات الحذف والتعديل
function attachEventListeners() {
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const rowIndex = e.target.getAttribute('data-index');
            deleteRow(rowIndex);
        });
    });

    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const rowIndex = e.target.getAttribute('data-index');
            editRow(rowIndex);
        });
    });
}

// دالة لحذف الصف وتحديث الداتا بيز
async function deleteRow(index) {
    const userId = users[index].id;

    try {
        const response = await fetch(`https://example.com/api/users/${userId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete user from database');
        }

        console.log('User deleted successfully from database');
        users.splice(index, 1); // تحديث البيانات محليًا
        loadUsers(); // إعادة تحميل البيانات
    } catch (error) {
        console.error("Error deleting user from database:", error);
    }
}

// دالة لتعديل البيانات وتحديث الداتا بيز
async function editRow(index) {
    const user = users[index];
    const newName = prompt("Enter the Name:", user.name);
    const newBook = prompt("Enter the Book Name:", user.book);
    const newExam = prompt("Enter the Exam Title:", user.exam);
    const newGrade = prompt("Enter the Grade (0-10):", user.grade);

    if (newName !== null) user.name = newName;
    if (newBook !== null) user.book = newBook;
    if (newExam !== null) user.exam = newExam;
    if (newGrade !== null && !isNaN(newGrade) && newGrade >= 0 && newGrade <= 10) {
        user.grade = parseFloat(newGrade);
    }

    try {
        const response = await fetch(`https://example.com/api/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            throw new Error('Failed to update user in the database');
        }

        console.log('User updated successfully in database');
        loadUsers();
    } catch (error) {
        console.error("Error updating user in database:", error);
    }
}

// دالة لإضافة صف جديد وتحديث الداتا بيز
async function addNewUser() {
    const newName = prompt("Enter the Name:");
    const newBook = prompt("Enter the Book Name:");
    const newExam = prompt("Enter the Exam Title:");
    const newGrade = prompt("Enter the Grade (0-10):");

    if (newName && newBook && newExam && newGrade !== null && !isNaN(newGrade) && newGrade >= 0 && newGrade <= 10) {
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 21010,
            name: newName,
            book: newBook,
            exam: newExam,
            grade: parseFloat(newGrade)
        };

        try {
            const response = await fetch('https://example.com/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (!response.ok) {
                throw new Error('Failed to add new user to the database');
            }

            console.log('User added successfully to database');
            users.push(newUser);
            loadUsers();
        } catch (error) {
            console.error("Error saving new user to the database:", error);
        }
    } else {
        alert("Please enter valid details for the new user.");
    }
}
document.querySelectorAll('.search-filter input').forEach(input => {
    input.addEventListener('input', (e) => {
        const icon = e.target.previousElementSibling; // الأيقونة السابقة لحقل الإدخال
        if (icon && icon.classList.contains('sic')) { 
            icon.style.display = e.target.value ? 'none' : ''; // إخفاء الأيقونة إذا كان هناك نص
        }
    });
});

// تفعيل خاصية البحث
document.querySelectorAll('.search-filter input').forEach(input => {
    input.addEventListener('input', loadUsers);
});
document.getElementById('globalSearch').addEventListener('input', loadUsers);
document.addEventListener('DOMContentLoaded', fetchUsersFromDatabase);
rowCountSelect.addEventListener('change', loadUsers);
addUserButton.addEventListener('click', addNewUser);
