import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import FrontPage from "./components/frontpage";
import Login from "./components/login";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import StaffDashboard from "./components/StaffDashboard";
import EditGrades from "./components/EditGrades";
import StudentDetails from "./components/StudentDetails";
import CourseDetails from "./components/CourseDetails";
import ResultDetails from "./components/ResultDetails";
import ForgotPassword from "./components/ForgotPassword";
import AdminVerifyResults from './components/AdminVerifyResults';

import "./index.css";

const ProtectedRoute = ({ user, allowedRole, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;
  return children;
};

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false); 
  }, []);


  const handleLogin = async (email, password) => { 
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), 
      });

      const res = await response.json();

      if (res.success) {
        const user = { ...res.user, role: res.role };
        setCurrentUser(user);
        localStorage.setItem("user", JSON.stringify(user));

        if (res.role === "student") navigate("/student-dashboard");
        else if (res.role === "staff") navigate("/staff-dashboard");
        else if (res.role === "admin") navigate("/admin-dashboard");

        return res;
      } else {
        alert(res.message || "Invalid email or password");
        return res;
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Server error");
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    navigate("/login");
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Routes>

      <Route path="/" element={<FrontPage />} />
      <Route path="/login" element={<Login handleLogin={handleLogin} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute user={currentUser} allowedRole="student">
            <StudentDashboard username={currentUser?.username} handleLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-dashboard"
        element={
          <ProtectedRoute user={currentUser} allowedRole="staff">
            <StaffDashboard username={currentUser?.username} handleLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-grades"
        element={
          <ProtectedRoute user={currentUser} allowedRole="staff">
            <EditGrades />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute user={currentUser} allowedRole="admin">
            <AdminDashboard username={currentUser?.username} handleLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resultDetails"
        element={
          <ProtectedRoute user={currentUser} allowedRole="admin">
            <ResultDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-verify"
        element={
          <ProtectedRoute user={currentUser} allowedRole="admin">
            <AdminVerifyResults />
          </ProtectedRoute>
        }
      />

      <Route
        path="/studentDetails"
        element={
          <ProtectedRoute user={currentUser}>
            <StudentDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courseDetails"
        element={
          <ProtectedRoute user={currentUser}>
            <CourseDetails />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppWrapper;