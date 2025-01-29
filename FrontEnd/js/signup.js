// Select role button
const roleButtons = document.querySelectorAll('.role-btn');

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


document.querySelector(".signupForm").addEventListener(
  "submit",
  async function (e) {
    e.preventDefault();

    const name = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // check all data is filled
    if (!name || !email || !password) {
      alert("All fields are required!");
      return;
    }

    // check email format like john@example.com
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address!");
      return;
    }

    // check password contains 8 characters, an uppercase letter, lowercase letter, and symbol
    const passwordRegex = /^(?=.*[A-Z])(?=.*[@#$%^&*])(?=.*[a-zA-Z\d]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("Password must include a capital letter, a symbol (@#$%^&*), and 8+ characters.");
      return;
    }

    const userData = {
      name,
      email,
      password,
      role
    };

    console.log(userData); // For debugging purposes

    try {
      const response = await fetch('http://localhost:8005/api/register', {
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
      window.location.href = "login.html"; // Redirect to login page
    } catch (error) {
      console.error("Error signing up:", error);
      alert("Error while signing up! Please try again.");
    }
  }
);