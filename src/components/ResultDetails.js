import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../CSS/ResultDetails.css"; 

function ResultDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { faculty, department, level, semester, courseId, username } = location.state || {};

  const [results, setResults] = useState([]);
  const [released, setReleased] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState(false);

  const fetchResults = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/results?courseId=${encodeURIComponent(courseId)}`
      );
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setReleased(Boolean(data.released));
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Error loading results:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!courseId) {
      navigate(-1);
      return;
    }
    fetchResults();
  }, [courseId, fetchResults, navigate]);

  const handleDownload = async () => {
    if (!courseId) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/results/download?courseId=${encodeURIComponent(courseId)}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Download failed" }));
        alert(err.message || "Download failed");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${courseId}_results.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    }
  };

  const handleRelease = async () => {
    if (!courseId) return;
    if (!window.confirm("Are you sure you want to release this result?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/results/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (data.success) {
        setReleased(true);
        alert("Result released successfully.");
      } else {
        alert(data.message || "Failed to release result.");
      }
    } catch (err) {
      console.error(err);
      alert("Error releasing result.");
    }
  };

  const handleView = () => {
    setViewing(true);
    fetchResults();
  };

  const Navbar = () => (
    <div className="staff-navbar">
      <div className="navbar-left">
        <span className="logo">📊</span>
        <h1>Result Management</h1>
      </div>

      <div className="navbar-right">
        <span className="user-role">{username || "Admin"}</span>
        <button className="logout-btn" onClick={() => navigate("/login")}>
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="result-details-page">
      <Navbar />

      <div className="result-details-container">
        <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>

        <h2>Result Details — {courseId}</h2>
        <p>
          {faculty} / {department} / {level} {semester ? ` / ${semester}` : ""}
        </p>

        <div className="result-actions">
          <button
            className="download-btn"
            onClick={handleDownload}
            disabled={loading || results.length === 0}
          >
            Download Result
          </button>

          <button className="release-btn" onClick={handleRelease} disabled={released}>
            {released ? "Released" : "Release Result"}
          </button>

          <button className="view-btn" onClick={handleView} disabled={viewing}>
            View Result
          </button>
        </div>

        {loading && <p className="loading-text">Loading results...</p>}

        {viewing && (
          <div className="result-table-container">
            {results.length === 0 ? (
              <p className="no-results">No results to display.</p>
            ) : (
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Index Number</th>
                    <th>Name</th>
                    <th>Marks</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={r.studentId || idx}>
                      <td>{r.studentId}</td>
                      <td>{r.indexNumber}</td>
                      <td>{r.studentName}</td>
                      <td>{r.marks}</td>
                      <td>{r.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultDetails;