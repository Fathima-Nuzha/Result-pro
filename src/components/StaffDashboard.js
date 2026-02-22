import React, { useState } from "react";
import "../CSS/StaffDashboard.css";
import UploadGrades from "./UploadGrades";
import ViewResults from "./ViewResults";

function StaffDashboard({ username, handleLogout }) {
  const [page, setPage] = useState("home");
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const goHome = () => setPage("home");
  const openUploadPage = () => setPage("upload");
  const openViewPage = () => setPage("view");

  const handleGradesUpdated = () => {
    setRefreshTrigger(prev => !prev);
    setPage("view");
  };

  const Navbar = () => (
    <div className="staff-navbar">
      <div className="navbar-left">
        <span className="logo">🎓</span>
        <h2>University Result Management System</h2>
      </div>

      <div className="navbar-right">
        <span className="user-role"> Welcome, {username}</span>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );

  if (page === "upload") {
    return (
      <div className="staff-container">
        <Navbar />
        <div className="staff-dashboard-full">
          <button className="back-btn" onClick={goHome}>⬅️ Back</button>
          <h2 className="page-title">📤 Upload Results</h2>
          <UploadGrades onGradesUpdated={handleGradesUpdated} />
        </div>
      </div>
    );
  }

  if (page === "view") {
    return (
      <div className="staff-container">
        <Navbar />
        <div className="staff-dashboard-full">
          <button className="back-btn" onClick={goHome}>⬅️ Back</button>
          <h2 className="page-title">📋 Uploaded Results</h2>
          <ViewResults refreshTrigger={refreshTrigger} />
        </div>
      </div>
    );
  }

  return (
    <div className="staff-container">
      <Navbar />

      <div className="staff-dashboard">
        <div className="staff-buttons">
          <button className="upload-btn" onClick={openUploadPage}>
            📤 Upload Results
          </button>

          <button className="view-btn" onClick={openViewPage}>
            📋 View Uploaded Results
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;