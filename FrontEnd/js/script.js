const token = localStorage.getItem('token');
let userData = null;
const url = "http://localhost:8005/api";


const redirectToLogin = () => {
    window.location.href = '../Auth/login.html';
};

// This function to check if the user login or not
const checkUserLogin = async () => {

    // Check if the user is already logged in from localStorage/sessionStorage
    const storedUserData = localStorage.getItem('userData');
    const storedToken = localStorage.getItem('token');
    
    if (storedUserData && storedToken) {
        // If user data and token are found in localStorage, use them directly
        const userData = JSON.parse(storedUserData);
        document.querySelector('.footer-info .name').innerHTML = userData.user.name;
        document.querySelector('.footer-info .email').innerHTML = userData.user.email;
        return;
    }
    
    if (!storedToken) {
        // No token, redirect to login immediately
        return redirectToLogin();
    }
    
    try {
        // Send a request to validate the token
        const response = await fetch(`${url}/validateToken`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            // Handle different status codes
            if (response.status === 401) {
                console.error('Unauthorized - Invalid token.');
            } else if (response.status === 500) {
                console.error('Server error - Try again later.');
            } else {
                console.error('Unexpected error occurred.');
            }
            return redirectToLogin();
        }

        // Token is valid, fetch user data
        const userData = await response.json();
        console.log(userData);

        // Store the user data and token for future pages
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('token', storedToken);

        // Update UI with user data
        document.querySelector('.footer-info .name').innerHTML = userData.user.name;
        document.querySelector('.footer-info .email'). innerHTML = userData.user.email;
    } catch (error) {
        console.error('Error validating token:', error);
        return redirectToLogin(); // Redirect on error
    }
};



// Logout button
document.querySelector(".logout-button").addEventListener(
    "click",
    async () => {
        try {
            const response = await fetch(`${url}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
                throw new Error('Failed to fetch data');
        }
        } catch (error) {
            console.error("Error fetching data from database:", error);
        }

        // Remove token from local storage
        localStorage.removeItem("token");

        // Redirect to login page
        redirectToLogin();
    }
);


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
        logo.src = "../imgs/logo-collapsed.svg";
        rightArrow.style.display = 'flex';
        leftArrow.style.display = 'none';
        content.style.marginLeft = 70 + 'px';
    });
        
    rightArrow.addEventListener('click', function() {
        sidebar.classList.remove("collapsed");
        logo.src = "../imgs/logo.svg";
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


