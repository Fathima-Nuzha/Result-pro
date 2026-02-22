import React, { useState } from "react";
import axios from "axios"; 
import "../CSS/ViewResults.css";

function ViewResults({ onBack }) {
  const [searchCode, setSearchCode] = useState("");
  const [searchedCourse, setSearchedCourse] = useState(""); 
  const [hasSearched, setHasSearched] = useState(false);
  const [subjectType, setSubjectType] = useState("Theory Only"); 

  const [icaResults, setIcaResults] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [resultStatus, setResultStatus] = useState("Draft");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminMsg, setAdminMsg] = useState("");

  const calculateGrade = (marks) => {
    const m = Math.round((marks + Number.EPSILON) * 100) / 100;

    if (m >= 80 && m <=100) return "A+";
    if (m >= 75 && m <= 79) return "A";
    if (m >= 70 && m <= 74) return "A-";
    if (m >= 65 && m <= 69) return "B+";
    if (m >= 60 && m <= 64) return "B";
    if (m >= 55 && m <= 59) return "B-";
    if (m >= 50 && m <= 54) return "C+";
    if (m >= 45 && m <= 49) return "C";
    if (m >= 40 && m <= 44) return "C-";
    if (m >= 35 && m <= 39) return "D+";
    if (m >= 30 && m <= 34) return "D";
    return "E";
  };

  const getBest2Avg = (m1, m2, m3) => {
    const marks = [Number(m1)||0, Number(m2)||0, Number(m3)||0].sort((a,b)=>b-a);
    return (marks[0] + marks[1]) / 2;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return setError("⚠️ Please enter a course code.");
    
    const formattedCode = searchCode.trim().toUpperCase();
    
    setLoading(true);
    setError("");
    setAdminMsg("");
    setHasSearched(false);

    try {
      const [icaRes, examRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/grades/get-grades/ICA`, { params: { courseCode: formattedCode } }),
        axios.get(`http://localhost:5000/api/grades/get-grades/Exams`, { params: { courseCode: formattedCode } })
      ]);

      const icas = icaRes.data.grades || [];
      const exams = examRes.data.grades || [];

      if (icas.length === 0 && exams.length === 0) {
        setError(`❌ No results found for course code: ${formattedCode}`);
      } else {
        setIcaResults(icas);
        setExamResults(exams);
        setSearchedCourse(formattedCode);
        setHasSearched(true);

        const firstRecord = icas[0] || exams[0];
        if (firstRecord && firstRecord.subjectType) {
          setSubjectType(firstRecord.subjectType);
        } else {
          setSubjectType("Theory Only");
        }

        if (firstRecord && firstRecord.status) {
          setResultStatus(firstRecord.status);
        } else {
          setResultStatus("Draft");
        }
      }
    } catch (err) {
      console.error(err);
      setError("❌ Error fetching results. Please check the Course Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAdmin = async () => {
    if (!searchedCourse) return;
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/grades/send-to-admin", {
        courseCode: searchedCourse
      });
      setAdminMsg(res.data.message || "✅ Results sent to Admin successfully!");
      setResultStatus("Pending");
    } catch (err) {
      console.error(err);
      setAdminMsg("❌ Failed to send to Admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHasSearched(false);
    setSearchCode("");
    setIcaResults([]);
    setExamResults([]);
    setError("");
    setAdminMsg("");
    setResultStatus("Draft");
  };

  const displayStatus = resultStatus || "Draft";
  const statusClass =
    displayStatus === "Approved"
      ? "status-approved"
      : displayStatus === "Pending"
      ? "status-pending"
      : "status-draft";

  return (
    <div className="view-results-container">
      <h2>📊 View & Submit Results</h2>

      {!hasSearched ? (
        <div className="search-section">
          <p>Enter the Course Code to view uploaded results.</p>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="e.g., IT1102" 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            />
            <button className="search-btn" onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "🔍 Search"}
            </button>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>
      ) : (
        <div className="results-display">
          
          <div className="results-header">
            <div>
                <h3>Results for: <span className="highlight">{searchedCourse}</span></h3>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "6px" }}>
                  <span className="badge">{subjectType}</span>
                  <span className={`status-badge ${statusClass}`}>{displayStatus}</span>
                </div>
            </div>
            <div className="header-actions">
               <button className="reset-btn" onClick={handleReset}>🔄 New Search</button>
               <button className="send-admin-btn" onClick={handleSendToAdmin}>
                 📤 Send to Admin
               </button>
            </div>
          </div>

          {adminMsg && <div className={`admin-msg ${adminMsg.includes("❌") ? "error" : "success"}`}>{adminMsg}</div>}

          <div className="table-wrapper">
            <h4>📘 ICA Marks Overview</h4>
            {icaResults.length > 0 ? (
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>T-ICA 1</th><th>T-ICA 2</th><th>T-ICA 3</th>

                    {subjectType === "Theory + Practical" && (
                        <>
                        <th className="prac-header">P-ICA 1</th>
                        <th className="prac-header">P-ICA 2</th>
                        <th className="prac-header">P-ICA 3</th>
                        </>
                    )}
                    
                    <th>Theory<br/>(30%)</th>
                    
                    {subjectType === "Theory + Practical" && <th>Prac<br/>(40%)</th>}
                  </tr>
                </thead>
                <tbody>
                  {icaResults.map((row, i) => {
                    const tAvg = getBest2Avg(row.ica1, row.ica2, row.ica3) * 0.3;

                    let pAvg = 0;
                    if(subjectType === "Theory + Practical"){
                        pAvg = getBest2Avg(row.prac_ica1, row.prac_ica2, row.prac_ica3) * 0.4;
                    }

                    return (
                      <tr key={i}>
                        <td>{row.registrationNumber}</td>
                        <td>{row.ica1}</td><td>{row.ica2}</td><td>{row.ica3}</td>

                        {subjectType === "Theory + Practical" && (
                            <>
                            <td className="prac-cell">{row.prac_ica1}</td>
                            <td className="prac-cell">{row.prac_ica2}</td>
                            <td className="prac-cell">{row.prac_ica3}</td>
                            </>
                        )}
                        
                        <td className="bold-cell">{tAvg.toFixed(2)}</td>
                        {subjectType === "Theory + Practical" && <td className="bold-cell">{pAvg.toFixed(2)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="no-data">⚠️ No ICA marks uploaded yet.</p>
            )}
          </div>

          <div className="table-wrapper">
            <h4>📕 Final Exam & Grading</h4>
            {examResults.length > 0 ? (
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Q5</th>
                    {subjectType === "Theory + Practical" && <th className="prac-header">Prac Exam</th>}
                    
                    <th>Theory<br/>Total</th>
                    {subjectType === "Theory + Practical" && <th>Prac<br/>Total</th>}
                    
                    <th>Final<br/>Mark</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.map((row, i) => {

                      const qMarks = [row.q1, row.q2, row.q3, row.q4, row.q5].map(Number).sort((a,b)=>b-a);
                      const tExamPart = (qMarks.slice(0,4).reduce((a,b)=>a+b,0) / 4) * 0.7;
                      
                      let tIcaPart = 0;
                      let pIcaPart = 0;
                      
                      const matchingIcaRow = icaResults.find(
                        (ica) => ica.registrationNumber === row.registrationNumber
                      );

                      if (matchingIcaRow) {
                        tIcaPart = getBest2Avg(matchingIcaRow.ica1, matchingIcaRow.ica2, matchingIcaRow.ica3) * 0.3;
                        if(subjectType === "Theory + Practical"){
                             pIcaPart = getBest2Avg(matchingIcaRow.prac_ica1, matchingIcaRow.prac_ica2, matchingIcaRow.prac_ica3) * 0.4;
                        }
                      }

                      const theoryTotal = tExamPart + tIcaPart;

                      let pracTotal = 0;
                      if(subjectType === "Theory + Practical"){
                          const pExamPart = (Number(row.prac_exam_marks)||0) * 0.6;
                          pracTotal = pExamPart + pIcaPart;
                      }

                      const grandTotal = subjectType === "Theory + Practical" 
                        ? (theoryTotal + pracTotal) / 2
                        : theoryTotal;

                      const grade = calculateGrade(grandTotal);
                      
                      return (
                        <tr key={i}>
                          <td>{row.registrationNumber}</td>
                          <td>{row.q1}</td><td>{row.q2}</td><td>{row.q3}</td><td>{row.q4}</td><td>{row.q5}</td>

                          {subjectType === "Theory + Practical" && (
                              <td className="prac-cell">{row.prac_exam_marks}</td>
                          )}

                          <td>{theoryTotal.toFixed(1)}</td>
                          
                          {subjectType === "Theory + Practical" && (
                              <td>{pracTotal.toFixed(1)}</td>
                          )}

                          <td className="bold-cell">{grandTotal.toFixed(2)}</td>
                          <td className={`grade-cell grade-${grade}`}>{grade}</td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="no-data">⚠️ No Exam marks uploaded yet.</p>
            )}
          </div>

        </div>
      )}
    
    </div>
  );
}

export default ViewResults;
