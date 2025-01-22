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
