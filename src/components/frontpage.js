import React from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/FrontPage.css";

function FrontPage() {
  const navigate = useNavigate();

  return (
    <div className="frontpage">
      <div className="front-content">
        <h1>Result Management System</h1>
        <h3>University of Vavuniya</h3>
        <div className="button-group">
          <button onClick={() => navigate("/login")}>Login</button>
        </div>
      </div>
    </div>
  );
}

export default FrontPage;
