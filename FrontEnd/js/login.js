// Select role button
const roleButtons = document.querySelectorAll('.role-btn');

let role;
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

// تحميل البيانات من Local Storage عند فتح الصفحة
// window.addEventListener('DOMContentLoaded', () => {
//   const savedEmail = localStorage.getItem('rememberedEmail');
//   const savedPassword = localStorage.getItem('rememberedPassword');
//   const rememberMeChecked = localStorage.getItem('rememberMe') === 'true';

//   if (savedEmail && savedPassword && rememberMeChecked) {
//     document.querySelector('input[type="email"]').value = savedEmail;
//     document.querySelector('#newPassword').value = savedPassword;
//     document.getElementById('rememberMe').checked = true;
//   }
// });

// When Submit the login form
document.getElementById('loginForm').addEventListener(
  'submit',
  async function (e) {
    e.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log(JSON.stringify({ email, password, role }));
    try {
      // Send POST request to the API
      const response = await fetch('http://localhost:8005/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();  
      if (response.ok) {
        localStorage.setItem('authToken', data.token)
        window.location.href = 'dashboard.html';
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


// Check if the token exists and is valid when visiting other pages (e.g., dashboard)
window.addEventListener('load', function() {
  localStorage.getItem('authToken');
});

