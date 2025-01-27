const roleButtons = document.querySelectorAll('.role-btn');


roleButtons.forEach(button => {
  button.addEventListener('click', () => {
    // إزالة الكلاس "active" من جميع الأزرار
    roleButtons.forEach(btn => btn.classList.remove('active'));
    // إضافة الكلاس "active" للزر الذي تم النقر عليه
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
togglePasswordVisibility("confirmPassword", "toggleConfirmPassword");

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("newPassword").value;

  if (!fullName || !email || !password) {
    alert("All fields are required!");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address!");
    return;
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[@#$%^&*])(?=.*[a-zA-Z\d]).{8,}$/;
  if (!passwordRegex.test(password)) {
    alert("Password must include a capital letter, a symbol (@#$%^&*), and 8+ characters.");
    return;
  }
  const userData = {
    fullName,
    email,
    password
  };

  try {
    const response = await fetch('https://example.com/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to sign up');
    }

    alert('Sign up successful!');
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error signing up:", error);
    alert("Error while signing up! Please try again.");
  }
});

