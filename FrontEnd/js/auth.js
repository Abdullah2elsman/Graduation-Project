const API_BASE_URL = "http://127.0.0.1:8005/api";

// ========== Helper Functions ==========

/**
 * Fetch CSRF cookie
 */
async function getCsrfCookie() {
    try {
        await fetch(`${API_BASE_URL.replace('/api', '')}/sanctum/csrf-cookie`, {
            credentials: 'include'
        });
    } catch (error) {
        console.error("Error fetching CSRF cookie:", error);
    }
}

/**
 * Fetch user data from the backend to validate authentication
 * @returns {Object|null} userData or null if not authenticated
 */
async function fetchUserData() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
            method: 'GET',
            credentials: 'include',
            headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            },
        });
        if (!response.ok) throw new Error('Unauthorized');
        return await response.json();
    } catch (error) {
        return null;
    }
}

/**
 * Store user data in localStorage (optional, for UI updates)
 */
function saveUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
}

/**
 * Remove user data and token from localStorage
 */
function clearUserData() {
    localStorage.removeItem('userData');
}

/**
 * Update user info in the UI (footer)
 */
function updateUserUI(userData) {
    if(document.querySelector('.sidebar')){
        if (userData?.user) {
            document.querySelector('.footer-info .name').textContent = userData.user.name;
            document.querySelector('.footer-info .email').textContent = userData.user.email;
        }
    }
}

/**
 * Redirect to login page unless already there
 */
function redirectToLogin() {
    window.location.href = '../Auth/login.html';
}

// ========== Main Auth Logic ==========

/**
 * Checks if the user is logged in, updates UI, or redirects to login if not authenticated
 */
async function checkUserLogin() {
    let userData = null;

    // Try to get user data from localStorage first (for performance)
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
        try {
            userData = JSON.parse(storedUserData);
            if (userData && userData.user && userData.user.name) {
                updateUserUI(userData);
                return;
            }
        } catch (e) {
            clearUserData();
        }
    }
    // Get CSRF Cookie 
    await getCsrfCookie();

    // Fetch user data using HttpOnly cookie
    userData = await fetchUserData();

    if (!userData) {
        clearUserData();
        return redirectToLogin();
    }

    saveUserData(userData);
    updateUserUI(userData);
}

// ========== Logout Function ==========

/**
 * Logs the user out by calling backend and clearing local data
 */
async function logout() {
    try {
        // Fetch CSRF token
        await fetch('http://127.0.0.1:8005/sanctum/csrf-cookie', {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        // Retrieve and decode XSRF token
        const xsrfToken = decodeURIComponent(getCookie('XSRF-TOKEN'));

        // Send logout request
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-XSRF-TOKEN': xsrfToken
            }
        });

        if (response.ok) {
            alert('Logged out successfully 👋');
            redirectToLogin();
        } else {
            const data = await response.json();
            alert(data.error || 'Logout failed!');
            redirectToLogin();
        }
    } catch (error) {
        alert('Logout error. Please try again.');
    }
}

// Helper function to get cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


// ========== Event Listeners ==========

document.addEventListener("DOMContentLoaded", () => {
    // Check login status when page loads
    checkUserLogin();
    
    // Logout button event
    const logoutBtn = document.querySelector(".logout-button");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
});
