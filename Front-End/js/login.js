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

function togglePasswordVisibility(passwordInputId, toggleIconId) {
  const passwordInput = document.getElementById(passwordInputId);
  const toggleIcon = document.getElementById(toggleIconId);

  toggleIcon.addEventListener("click", function () {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    this.classList.toggle("fa-eye-slash");
    this.classList.toggle("fa-eye");
  });
}

togglePasswordVisibility("newPassword", "toggleNewPassword");

// تحميل البيانات من Local Storage عند فتح الصفحة
window.addEventListener('DOMContentLoaded', () => {
  const savedEmail = localStorage.getItem('rememberedEmail');
  const savedPassword = localStorage.getItem('rememberedPassword');
  const rememberMeChecked = localStorage.getItem('rememberMe') === 'true';

  if (savedEmail && savedPassword && rememberMeChecked) {
    document.querySelector('input[type="email"]').value = savedEmail;
    document.querySelector('#newPassword').value = savedPassword;
    document.getElementById('rememberMe').checked = true;
  }
});

document.getElementById('loginForm').addEventListener(
  'submit',
  async function (e) {
    e.preventDefault(); // Prevent form submission

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

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

      console.log(data)
      if (response.ok) {
        // Handle successful login
        alert('Login successful');
        console.log('User:', data.user);
        // Redirect to dashboard or another page
        window.location.href = 'dashboard.html';
      } else {
        // Handle login error
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  }
);

