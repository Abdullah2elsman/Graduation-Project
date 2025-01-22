let users = []; 

const rowCountSelect = document.getElementById('rowCount');
const globalSearchInput = document.getElementById('globalSearch');
const searchIdInput = document.getElementById('searchId');
const searchTitleInput = document.getElementById('searchTitle');

function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '';

    const searchId = searchIdInput?.value.toLowerCase() || '';
    const searchTitle = searchTitleInput?.value.toLowerCase() || '';
    const globalSearch = globalSearchInput?.value.toLowerCase() || '';

    fetch('http://localhost:8005/api/test') 
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load courses!');
            }
            return response.json();
        })
        .then(data => {
            users = data;

            const filteredUsers = users.filter(user => {
                const idMatch = user.id.toLowerCase().includes(searchId);
                const titleMatch = user.title.toLowerCase().includes(searchTitle);
                const globalMatch =
                    user.id.toLowerCase().includes(globalSearch) ||
                    user.title.toLowerCase().includes(globalSearch) ||
                    user.addby.toLowerCase().includes(globalSearch) ||
                    user.managedby.toLowerCase().includes(globalSearch);

                return globalSearch ? globalMatch : idMatch && titleMatch;
            });

            const rowCount = parseInt(rowCountSelect?.value, 10) || filteredUsers.length;
            const usersToDisplay = filteredUsers.slice(0, rowCount);

            usersToDisplay.forEach((user, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.title}</td>
                    <td>${user.addby}</td>
                    <td>${user.managedby}</td>
                    <td class="action-icons">
                        <i class="fa-regular fa-pen-to-square edit-icon" data-index="${index}" data-id="${user.id}"></i>
                        <i class="fa-regular fa-trash-can delete-icon" data-index="${index}" data-id="${user.id}"></i>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            attachRowActions();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Failed to load courses!');
        });
}

function attachRowActions() {
    const deleteIcons = document.querySelectorAll('.delete-icon');
    deleteIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const courseId = e.target.getAttribute('data-id');
            deleteRow(courseId); 
        });
    });

    const editIcons = document.querySelectorAll('.edit-icon');
    editIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const courseId = e.target.getAttribute('data-id');
            editRow(courseId); 
        });
    });
}

function deleteRow(courseId) {
    fetch(`/api/delete-course/${courseId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (response.ok) {
            alert('Course deleted successfully!');
            loadUsers(); 
        } else {
            alert('Failed to delete course!');
        }
    })
    .catch(error => {
        console.error('Error deleting course:', error);
        alert('Failed to delete course!');
    });
}

function editRow(courseId) {
    const newTitle = prompt("Enter the new title of the course:");
    const newManagedBy = prompt("Enter the new manager:");

    if (newTitle && newManagedBy) {
        const updatedCourse = {
            title: newTitle,
            managedby: newManagedBy,
        };

        fetch(`/api/edit-course/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedCourse),
        })
        .then(response => {
            if (response.ok) {
                alert('Course updated successfully!');
                loadUsers();  
            } else {
                alert('Failed to update course!');
            }
        })
        .catch(error => {
            console.error('Error updating course:', error);
            alert('Failed to update course!');
        });
    }
}

function addCourseOnEnter(event) {
    if (event.key === 'Enter') {
        const courseTitle = document.getElementById('courseTitle').value.trim();
        const managementBy = document.getElementById('managementBy').value.trim();

        if (!courseTitle || !managementBy) {
            alert('Please fill in all fields!');
            return;
        }

        const newCourse = {
            id: `#${Math.floor(10000 + Math.random() * 90000)}`, 
            title: courseTitle,
            addby: managementBy, 
            managedby: managementBy,
        };

        fetch('/api/add-course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newCourse),
        })
        .then(response => {
            if (response.ok) {
                alert('Course added successfully!');
                loadUsers();  
            } 
        })
        .catch(error => {
            console.error('Error adding course:', error);
            alert('Failed to add course!');
        });

        document.getElementById('courseTitle').value = '';
        document.getElementById('managementBy').value = '';
    }
}
document.getElementById('courseTitle').addEventListener('keydown', addCourseOnEnter);
document.getElementById('managementBy').addEventListener('keydown', addCourseOnEnter);

document.querySelectorAll('.search-filter input').forEach(input => {
    input.addEventListener('input', (e) => {
        const icon = e.target.previousElementSibling;
        if (icon && icon.classList.contains('sic')) {
            icon.style.display = e.target.value ? 'none' : '';
        }
    });
});

document.addEventListener('DOMContentLoaded', loadUsers);

globalSearchInput?.addEventListener('input', loadUsers);
searchIdInput?.addEventListener('input', loadUsers);
searchTitleInput?.addEventListener('input', loadUsers);
rowCountSelect?.addEventListener('change', loadUsers);

