const roleButtons = document.querySelectorAll('.role-btn');

// Choose Role
roleButtons.forEach(button => {
  button.addEventListener('click', () => {
    roleButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  });
});

// View Password
function togglePasswordVisibility(passwordInputId, toggleIconId) {
    const passwordInput = document.getElementById(passwordInputId);
    const toggleIcon = document.getElementById(toggleIconId);
  
    toggleIcon.addEventListener("click", function () {
      // تبديل نوع الحقل بين "text" و "password"
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
  
      // تبديل الأيقونة بين العين المفتوحة والمغلقة
      this.classList.toggle("fa-eye-slash");
      this.classList.toggle("fa-eye");
    });
  }
  
  // تطبيق الوظيفة على الحقول
  togglePasswordVisibility("newPassword", "toggleNewPassword");
  togglePasswordVisibility("confirmPassword", "toggleConfirmPassword");