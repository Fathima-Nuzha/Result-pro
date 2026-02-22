import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/Login.css";
import axios from "axios"; 

function Login({ handleLogin }) {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("savedEmail");
    if (saved) setEmail(saved);
  }, []);

  const handleForgotPassword = () => {
    navigate("/forgot-password"); 
  };

  const handleLoginClick = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (handleLogin) {
        res = await handleLogin(email, password);
      } else {
        const response = await axios.post("http://localhost:5000/api/auth/login", {
          email: email,   
          password: password,
        });
        res = response.data;
      }

      console.log("Login Response:", res); 

      if (res.success) {
        localStorage.setItem("user", JSON.stringify(res.user)); 
        localStorage.setItem("role", res.role); 

        if (rememberMe) localStorage.setItem("savedEmail", email);
        else localStorage.removeItem("savedEmail");

        switch (res.role) {
          case "student":
            navigate("/student-dashboard");
            break;
          case "staff":
            navigate("/staff-dashboard");
            break;
          case "admin":
            navigate("/admin-dashboard");
            break;
          default:
            alert("Role not recognized: " + res.role);
            navigate("/");
        }
      } else {
        alert(res.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Server error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <nav className="navbar">
        <h1>🎓 University Result Management System</h1>
      </nav>

      <div className="login-container">
        <h2>User Login</h2>
        <form onSubmit={handleLoginClick}>
          <div className="form-row">
            <label>Email Address</label>
            <input
              type="email" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="remember-forgot">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />{" "}
              Remember Me
            </label>
            <button type="button" onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>
          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;