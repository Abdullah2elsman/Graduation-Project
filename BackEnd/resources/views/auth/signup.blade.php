<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>sign up</title>
  <link rel="stylesheet" href="css/signup.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
</head>
<body>
  <div class="container">
    <div class="form-card">
      <img class="img-logo" src="imgs/logo.svg" alt="notfound">
      <div class="signup-box">
        <p class="p1">Create Account</p>
        <p class="p2">Create your account for a seamless learning and teaching experience.</p>
        <div class="role-buttons">
          <button class="role-btn">I'm Instructor</button>
          <button class="role-btn">I'm Student</button>
          <button class="role-btn">I'm Admin</button>
        </div>
        <form>
          <label class="name"> Full Name </label>
          <input type="text" placeholder="Enter your name" required>
          <label class="email"> Email </label>
          <input type="email" placeholder="Enter your email" required>
          <label class="pass"> Password </label>
          <div class="password-container">    
              <input type="password" id="newPassword" class="password-input" placeholder="Enter your password" required>
              <i id="toggleNewPassword" class="fa-regular fa-eye-slash"></i>
          </div>
          <p class="password-hint">Password must include a capital letter, a symbol (@#$%^&*), and 8+ characters.</p>
          <button type="submit" class="submit-button">Sign up</button>
        </form>
        <div class="divider">OR</div>
        <button class="google-button">
          <img class="google-ic" src="imgs/Google__G__logo.svg.png" alt="notfound"> 
          <span>Continue with Google</span>
        </button>    
        <p class="login-link">Already have an account ? <a href="{{ route('login') }}">Log in</a></p>
      </div>
    </div>
  </div>
  <script src="js/signup.js" defer></script>
  
</body>
</html>
