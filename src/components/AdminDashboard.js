import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/AdminDashboard.css";

function AdminDashboard({ username, handleLogout }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  
  const [pendingList, setPendingList] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const levels = ["Level 1", "Level 2", "Level 3", "Level 4"];
  const semesters = ["Semester 1", "Semester 2"];

  const [overviewStats, setOverviewStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalResults: 0,
    averageCGPA: 0,
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.role === "admin") {
      setSelectedFaculty(storedUser.faculty);
      setSelectedDepartment(storedUser.department);
    }
  }, []);

  useEffect(() => {
    if (!selectedFaculty || !selectedDepartment) return;

    const params = new URLSearchParams({
      faculty: selectedFaculty,
      department: selectedDepartment,
    });

    fetch(`http://localhost:5000/api/admin/overview?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOverviewStats({
            totalStudents: data.totalStudents,
            totalCourses: data.totalCourses,
            totalResults: data.totalResults,
            averageCGPA: data.averageCGPA,
          });
        }
      })
      .catch((err) => console.error("Error fetching overview stats:", err));
  }, [selectedFaculty, selectedDepartment]);

  useEffect(() => {
    if (!selectedFaculty || !selectedDepartment) return;

    const params = new URLSearchParams({
      faculty: selectedFaculty,
      department: selectedDepartment,
    });

    if (activeTab === "Approvals") setLoading(true);
    fetch(`http://localhost:5000/api/grades/pending-approvals?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPendingList(data.data || []);
        }
      })
      .catch((err) => console.error("Error fetching approvals:", err))
      .finally(() => {
        if (activeTab === "Approvals") setLoading(false);
      });
  }, [activeTab, selectedFaculty, selectedDepartment]);

  const resetSelections = () => {
    setSelectedLevel("");
    setSelectedSemester("");
  };

  return (
    <div className="admin-container">
      <header className="admin-navbar">
        <div className="navbar-left">
          <div className="logo">🎓</div>
          <h1>University Result Management System</h1>
        </div>
        <div className="navbar-right">
          <span className="user-role">
            👤 System Administrator ({username || "Admin"})
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-dashboard">
        <h2>Admin Dashboard</h2>
        <p>Manage students, courses and results approvals</p>

        <div className="dashboard-tabs">
          {["Overview", "Students", "Courses", "Approvals"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => {
                setActiveTab(tab);
                resetSelections();
              }}
            >
              {tab === "Approvals" && pendingList.length > 0 ? (
                 <span>{tab} <span className="badge">{pendingList.length}</span></span>
              ) : tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="stats-grid">
            <div className="card blue">
              <div className="icon">🎓</div>
              <div><h3>Total Students</h3><p>{overviewStats.totalStudents}</p></div>
            </div>
            <div className="card green">
              <div className="icon">📚</div>
              <div><h3>Total Courses</h3><p>{overviewStats.totalCourses}</p></div>
            </div>
            <div className="card purple">
              <div className="icon">📊</div>
              <div><h3>Approvals Pending</h3><p>{pendingList.length}</p></div>
            </div>
          </div>
        )}

        {activeTab === "Approvals" && (
          <div className="approval-section">
            <h3>🔔 Pending Approvals</h3>
            {loading ? (
              <p>Loading pending requests...</p>
            ) : pendingList.length === 0 ? (
              <p className="no-data">✅ No pending approvals.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Department</th>
                    <th>Level</th>
                    <th>Semester</th>
                    <th>Students</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: "bold", color: "#000000" }}>{item._id}</td>
                      <td style={{ fontWeight: "bold", color: "#000000" }}>{item.department}</td>
                      <td style={{ fontWeight: "bold", color: "#000000" }}>{item.level}</td>
                      <td style={{ fontWeight: "bold", color: "#000000" }}>{item.semester}</td>
                      <td style={{ fontWeight: "bold", color: "#000000" }}>{item.totalStudents}</td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => navigate("/admin-verify", { state: { courseCode: item._id } })}
                        >
                          👁️ Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "Students" && (
          <div className="dropdown-section">
            <div className="info-box">
              <p><strong>Faculty:</strong> {selectedFaculty}</p>
              <p><strong>Department:</strong> {selectedDepartment}</p>
            </div>
            <div className="dropdown" style={{ marginTop: "20px" }}>
              <label>Select Level:</label>
              <select
                value={selectedLevel}
                onChange={(e) => {
                  const level = e.target.value;
                  setSelectedLevel(level);
                  if (level) {
                    navigate("/StudentDetails", {
                      state: { faculty: selectedFaculty, department: selectedDepartment, level },
                    });
                  }
                }}
              >
                <option value="">-- Select Level --</option>
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        )}

        {activeTab === "Courses" && (
          <div className="dropdown-section">
            <div className="info-box">
              <p><strong>Faculty:</strong> {selectedFaculty}</p>
              <p><strong>Department:</strong> {selectedDepartment}</p>
            </div>
            <div className="dropdown" style={{ marginTop: "20px" }}>
              <label>Select Level:</label>
              <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
                <option value="">-- Select Level --</option>
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {selectedLevel && (
              <div className="dropdown" style={{ marginTop: "20px" }}>
                <label>Select Semester:</label>
                <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                  <option value="">-- Select Semester --</option>
                  {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {selectedLevel && selectedSemester && (
              <div style={{ marginTop: "20px" }}>
                <button
                  className="view-courses-btn"
                  onClick={() =>
                    navigate("/courseDetails", {
                      state: { faculty: selectedFaculty, department: selectedDepartment, level: selectedLevel, semester: selectedSemester },
                    })
                  }
                >
                  📘 Manage Courses
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
