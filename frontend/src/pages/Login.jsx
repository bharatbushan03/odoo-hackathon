function Login() {
  return (
    <div className="page">
      <div className="login-card">

        <div className="logo-circle">
    <div className="logo-box">
        AF
    </div>
</div>

<label className="label">Email</label>
<input
  type="email"
  placeholder="name@company.com"
/>

<label className="label">Password</label>
<input
  type="password"
  placeholder="Enter password"
/>

        <div className="forgot">
          Forgot password?
        </div>

        <button className="login-btn">
          Login
        </button>

        <div className="divider">
          <span>New here?</span>
        </div>

        <div className="info-box">
          Employee accounts can only be created by invitation.
        </div>

        <button className="signup-btn">
          Create Account
        </button>

      </div>
    </div>
  );
}

export default Login;
