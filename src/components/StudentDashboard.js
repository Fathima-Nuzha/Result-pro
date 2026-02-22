import React, { useState, useEffect } from "react";
import "../CSS/StudentDashboard.css";
import jsPDF from "jspdf"; 
import autoTable from "jspdf-autotable";

const gradeValues = {
  "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "E": 0.0
};

function StudentDashboard({ handleLogout }) {
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const { username, faculty, department } = storedUser;

  const [level, setLevel] = useState("Level 1");
  const [semester, setSemester] = useState("Semester 1"); 
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpa, setGpa] = useState("0.00");
  const [cgpa, setCgpa] = useState("0.00");

  const getCredits = (code) => {
    if (!code) return 0;
    const lastChar = code.trim().slice(-1);
    const val = parseInt(lastChar, 10);
    return isNaN(val) ? 0 : val;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const courseUrl = `http://localhost:5000/api/courses?faculty=${encodeURIComponent(faculty)}&department=${encodeURIComponent(department)}&level=${encodeURIComponent(level)}&semester=${encodeURIComponent(semester)}`;
        const resultUrl = `http://localhost:5000/api/grades/student-results?registrationNumber=${username}&level=${encodeURIComponent(level)}&semester=${encodeURIComponent(semester)}`;

        const [courseRes, resultRes] = await Promise.all([fetch(courseUrl), fetch(resultUrl)]);
        const courseData = await courseRes.json();
        const resultData = await resultRes.json();

        const fetchedCourses = courseData.success ? courseData.courses : [];
        const studentResults = resultData.success ? resultData.results : [];
        const userLower = (username || "").toLowerCase();
        
        const merged = fetchedCourses
          .filter((course) => {
            const code = course.courseCode.toUpperCase();
            if (userLower.includes("ict")) return code.startsWith("IT") || code.startsWith("ACU");
            if (userLower.includes("amc")) return ["AMA", "PMA", "CSC", "STA", "ACU"].some(p => code.startsWith(p));
            if (userLower.includes("ens")) return code.startsWith("ENS") || code.startsWith("ACU");
            return true;
          })
          .map((course) => {
            const dbRecord = studentResults.find((r) => r.courseCode === course.courseCode);
            return {
              code: course.courseCode,
              name: course.courseName,
              credits: getCredits(course.courseCode),
              grade: dbRecord ? dbRecord.grade : "-",
              gradePoint: dbRecord ? dbRecord.gradePoint : 0 
            };
          });

        setCourses(merged);

        let totalWeightedPoints = 0;
        let totalCredits = 0;

        merged.forEach(c => {
          if (c.credits > 0) {
            totalCredits += c.credits; 

            if (c.grade !== "-") {
              const gp = c.gradePoint !== undefined ? c.gradePoint : (gradeValues[c.grade] || 0.0);
              totalWeightedPoints += (gp * c.credits);
            }
          }
        });

        const calculatedGpa = totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : "0.00";
        setGpa(calculatedGpa);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (faculty && department) fetchData();
  }, [username, level, semester, faculty, department]);

  useEffect(() => {
    const fetchCgpa = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/grades/student-results?registrationNumber=${username}`);
        const data = await res.json();
        
        if (data.success && data.results) {
          let totalWeightedPoints = 0;
          let totalCredits = 0;

          data.results.forEach(resItem => {
             const credits = getCredits(resItem.courseCode);
             const gp = resItem.gradePoint !== undefined ? resItem.gradePoint : (gradeValues[resItem.grade] || 0.0);

             if (credits > 0) {
                totalCredits += credits;

                if (resItem.grade !== "-") {
                   totalWeightedPoints += (gp * credits);
                }
             }
          });

          const calculatedCgpa = totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : "0.00";
          setCgpa(calculatedCgpa);
        }
      } catch (err) { console.error("Error fetching CGPA:", err); }
    };
    if (username) fetchCgpa();
  }, [username]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
doc.text("UNIVERSITY ACADEMIC RECORD", pageWidth / 2, 20, { align: "center" });

doc.text("University Of Vavuniya", pageWidth / 2, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Registration No : ${username}`, 14, 40);
    doc.text(`Faculty : ${faculty}`, 14, 46);
    doc.text(`Department : ${department}`, 14, 52);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Semester GPA: ${gpa}`, pageWidth - 60, 40);

    autoTable(doc, {
      startY: 60,
      head: [["Course Code", "Course Name", "Credits", "Grade"]],
      body: courses.map(c => [
        c.code, 
        c.name, 
        c.credits, 
        c.grade,
      ]),
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 }
    });
    doc.save(`${username}_Results.pdf`);
  };

  return (
    <div className="student-dashboard-container">
      <header className="student-header">
        <h1>🎓 Student Dashboard</h1>
        <div className="header-right">
          <span>{username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="student-info">
        <div className="nav-info">
          <span className="info-badge">{faculty}</span>
          <span className="info-badge">{department}</span>
        </div>
        <div className="summary-boxes">
          <div className="gpa-box total-gpa">
             <span className="gpa-label">Semester GPA</span>
             <span className="gpa-value">{gpa}</span>
          </div>
          <div className="gpa-box cgpa">
             <span className="gpa-label">Cumulative GPA</span>
             <span className="gpa-value">{cgpa}</span>
          </div>
        </div>
      </div>

      <div className="selectors">
        <div className="level-select">
          {["Level 1", "Level 2", "Level 3", "Level 4"].map(lvl => (
            <button key={lvl} className={`level-btn ${level === lvl ? "active" : ""}`} onClick={() => setLevel(lvl)}>{lvl}</button>
          ))}
        </div>
        <div className="semester-select">
          {["Semester 1", "Semester 2"].map(sem => (
            <button key={sem} className={`semester-btn ${semester === sem ? "active" : ""}`} onClick={() => setSemester(sem)}>{sem}</button>
          ))}
        </div>
      </div>

      <div className="results-section">
        {loading ? <div className="loading-spinner">Loading Grades...</div> : (
          <div className="table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Credits</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {courses.length > 0 ? courses.map((c, i) => (
                  <tr key={i}>
                      <td>{c.code}</td>
                      <td>{c.name}</td>
                      <td>{c.credits}</td>
                      <td className={`grade-display ${c.grade === "E" ? "fail-grade" : ""}`}>
                          {c.grade}
                      </td>
                  </tr>
                )) : <tr><td colSpan="4" style={{textAlign:"center"}}>No results released for this selection.</td></tr>}
              </tbody>
            </table>
            {courses.length > 0 && (
                <button className="download-btn" onClick={downloadPDF}>Download Results PDF</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;