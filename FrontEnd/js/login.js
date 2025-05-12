// Select role button
const roleButtons = document.querySelectorAll('.role-btn');
const url = 'http://localhost:8005/api';

let role = 'admin';
roleButtons.forEach(button => {
  button.addEventListener('click', () => {
    roleButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    role = button.value;
  });
});

// Eye Icon
const passwordField = document.getElementById("password");
const toggleIcon = document.getElementById("toggleNewPassword");
function togglePassword(){

    // Check the current type of the password field
  if (passwordField.type === "password") {
    passwordField.type = "text"; // Change to text to show the password
    toggleIcon.classList.remove("fa-eye-slash");
    toggleIcon.classList.add("fa-eye"); // Change icon to 'eye'
  } else {
    passwordField.type = "password"; // Change back to password to hide it
    toggleIcon.classList.remove("fa-eye");
    toggleIcon.classList.add("fa-eye-slash"); // Change icon back to 'eye-slash'
  }
}
// toggle Event
toggleIcon.addEventListener('click',togglePassword);




// When Submit the login form
const loadingIndicator = document.getElementById('loading-indicator');
document.getElementById('loginForm').addEventListener(
  'submit',
  async function (e) {
    e.preventDefault(); 
    loadingIndicator.style.display = 'block'; // Show loading indicator
    // Remove the data of user when user go to login page from the URL
    localStorage.removeItem('userData');
    localStorage.removeItem('token');

    // make logout if the user go to the login page from url link
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log(JSON.stringify({ email, password, role }));
    try {
      // Send POST request to the API
      const response = await fetch(`${url}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();  
      if (response.ok) {
        
        localStorage.setItem('token', data.token)
        if (role === 'admin')
        { 
          window.location.href = '../admin/dashboard.html';
        }
        else if (role === 'student')
        { 
          window.location.href = '../student/dashboard.html';
        }
        else if (role === 'instructor')
        {  
          window.location.href = '../instructor/dashboard.html';
        }
      } else {
        // Handle login error
        alert(data.error || 'Login failed'); // will replace it by pop up message
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.'); // will replace it by pop up message
    }
  }

);