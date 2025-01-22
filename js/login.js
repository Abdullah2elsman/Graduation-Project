
// Choose role button
const roleButtons = document.querySelectorAll('.role-btn');

roleButtons.forEach(button => {
  button.addEventListener('click', () => {
    roleButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
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

document.querySelector('.login-box form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.querySelector('input[type="email"]').value.trim();
  const password = document.querySelector('#newPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  if (!email || !password) {
    alert("All fields are required!");
    return;
  }

  if (rememberMe) {
    localStorage.setItem('rememberedEmail', email);
    localStorage.setItem('rememberedPassword', password);
    localStorage.setItem('rememberMe', 'true');
  } else {
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    localStorage.setItem('rememberMe', 'false');
  }

  try {
    const response = await fetch('https://example.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Login successful!");
      window.location.href = "dashboard.html";
    } else {
      alert(data.message || "Login failed! Please check your credentials.");
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred. Please try again later.");
  }
});

