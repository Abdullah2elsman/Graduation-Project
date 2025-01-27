
const roleButtons = document.querySelectorAll('.role-btn');

// إضافة حدث النقر لكل زر
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