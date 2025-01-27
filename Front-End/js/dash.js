
window.addEventListener('load', function () {
  const token = localStorage.getItem('authToken');  // Get the token from localStorage

    if (!token) {
    // If there's no token, redirect the user to the login page
    window.location.href = 'login.html';
    } else {
    // Optionally, you can verify the token by sending a request to your API
    // to check if it's still valid (this can be done on the server side).
    // For example, you could make a request to a protected endpoint.
    
    // Example of a token validation check:
    fetch('http://localhost:8005/api/validate-token', {
        method: 'GET',
        headers: {
        'Authorization': `Bearer ${token}`,
        },
    })
        .then(response => response.json())
        .then(data => {
        if (!data.valid) {
          // If the token is invalid, redirect to login
            window.location.href = 'login.html';
        }
        })
        .catch(error => {
        console.error('Error verifying token:', error);
        // Redirect in case of an error (e.g., network issues)
        window.location.href = 'login.html';
        });
    }
});


async function updateRoleCounts() {
    const numAdmins = document.getElementById('numAdmins');
    const numInstructors = document.getElementById('numInstructors');
    const numStudents = document.getElementById('numStudents');

    const adminCount = users.filter(user => user.role.toLowerCase() === 'admin').length;
    const instructorCount = users.filter(user => user.role.toLowerCase() === 'instructor').length;
    const studentCount = users.filter(user => user.role.toLowerCase() === 'student').length;

    numAdmins.textContent = adminCount;
    numInstructors.textContent = instructorCount;
    numStudents.textContent = studentCount;
}
async function fetchUsersFromDatabase() {
    try {
        const response = await fetch('http://localhost:8005/api/'); 
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        users = await response.json(); 
        loadUsers(); 
        updateRoleCounts(); 
    } catch (error) {
        console.error("Error fetching data from database:", error);
    }
}
