<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <link rel="stylesheet" href="css/login.css">
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
</head>
<body>
  <div class="container">
    <div class="form-card">
      <img class="img-logo" src="imgs/logo.svg" alt="notfound">
      <div class="login-box">
        <p class="p1">Login</p>
        <p class="p2">Welcome back! Please enter your credentials to access your account.</p>
        <div class="role-buttons">
          <button class="role-btn">I'm Instructor</button>
          <button class="role-btn">I'm Student</button>
          <button class="role-btn">I'm Admin</button>
        </div>
        <form>
          <label class="email"> Email </label>
          <input type="email" placeholder="Enter your email" required>
          <label class="pass"> Password </label>
          <div class="password-container">    
              <input type="password" id="newPassword" class="password-input" placeholder="Enter your password" required>
              <i id="toggleNewPassword" class="fa-regular fa-eye-slash"></i>
          </div>
          <div class="remember-me">
              <input class="checkbox" type="checkbox" id="rememberMe">
              <label class="rememberMe">Remember Me</label>
              <p class="p3"><a href=""> Forget password?</p></a>
          </div>
          <button type="submit" class="submit-button">Login</button>
        </form>
        <div class="divider">OR</div>
        <button class="google-button">
          <img class="google-ic" src="imgs/Google__G__logo.svg.png" alt="notfound"> 
          <span>Continue with Google</span>
        </button>    
        <p class="login-link">Don't have an account ? <a href="{{ route('registration') }}">sign up</a></p>
      </div>
    </div>
  </div>
  <script src="js/login.js" defer></script>

</body>
</html>
