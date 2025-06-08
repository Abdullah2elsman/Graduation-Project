// Select role button
const roleButtons = document.querySelectorAll('.role-btn');
const API_BASE_URL = 'http://127.0.0.1:8005/api';

let role = 'admin';
roleButtons.forEach(button => {
    button.addEventListener('click', () => {
        roleButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        role = button.value;
    });
});

// Eye Icon logic for password field
const passwordField = document.getElementById("password");
const toggleIcon = document.getElementById("toggleNewPassword");
function togglePassword() {
    if (passwordField.type === "password") {
        passwordField.type = "text";
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
    } else {
        passwordField.type = "password";
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
    }
}
toggleIcon.addEventListener('click', togglePassword);

// Helper to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Login form submit logic
const loadingIndicator = document.getElementById('loading-indicator');

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Show loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    // Get form values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const roleBtn = document.querySelector('.role-btn.active');
    const role = roleBtn ? roleBtn.value : 'admin';

    try {
        // 1. Get CSRF cookie first 
        await fetch(`${API_BASE_URL.replace('/api', '')}/sanctum/csrf-cookie`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        // 2. Get CSRF token from cookie
        const xsrfToken = decodeURIComponent(getCookie('XSRF-TOKEN'));

        // 3. Send login request to the backend
        const response = await fetch(`${API_BASE_URL}/auth/login/${role}`, {
            method: 'POST',
            credentials: 'include', 
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrfToken
            },
            body: JSON.stringify({ email, password })
        });

        // 4. Parse the response
        const responseText = await response.text();
        console.log("Raw server response:", responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (err) {
            alert("Received unexpected response from server.");
            return;
        }        
        
        // Save user data in localStorage
        localStorage.setItem('userData', JSON.stringify(data.user));
        if (response.ok) {
            // 5. Redirect to the dashboard based on user role
            if (role === 'admin') {
                window.location.href = '../admin/dashboard.html';
            } else if (role === 'student') {
                window.location.href = '../student/dashboard.html';
            } else if (role === 'instructor') {
                window.location.href = '../instructor/dashboard.html';
            }
        } else {
            // Show error message
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
    } finally {
        // Hide loading indicator 
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
});
