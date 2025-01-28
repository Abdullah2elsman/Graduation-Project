const token = localStorage.getItem('authToken'); // Get token from local storage

const checkUserLogin = async () => {
    if (!token) {
    // No token, redirect to login
    window.location.href = '/login.html';
    return;
    }

    try {
    // Send a request to validate the token
    const response = await fetch('http://localhost:8005/api/validateToken', {
        method: 'GET',
        headers: {
        'Authorization': `Bearer ${token}`,
        },
    });

    if (response.ok) {
      // Token is valid, fetch user data
        const userData = await response.json();
        document.querySelector('.name').innerHTML = userData.user.name;
        document.querySelector('.email').innerHTML = userData.user.email;
        console.log(userData.user);
    } else {
      // Token is invalid, redirect to login
        console.error('Invalid token, redirecting to login...');
        window.location.href = '/login.html';
    }
    } catch (error) {
    console.error('Error validating token:', error);
    window.location.href = '/login.html'; // Redirect on error
    }
};

// Call the function on page load
checkUserLogin();


async function getUsersFromDatabase() {
    try {
        const response = await fetch('http://localhost:8005/api/getNumOfUsers', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${token}`,
        },
    });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const numOfUsers = await response.json(); 
        document.querySelector('#numAdmins').innerHTML = numOfUsers.numberOfAdmins;
        document.querySelector('#numInstructors').innerHTML = numOfUsers.numberOfInstructors;
        document.querySelector('#numStudents').innerHTML = numOfUsers.numberOfStudents;
    } catch (error) {
        console.error("Error fetching data from database:", error);
    }
}

getUsersFromDatabase();
