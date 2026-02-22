import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../CSS/ViewResults.css"; 

const AdminVerifyResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseCode } = location.state || {};

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subjectType, setSubjectType] = useState("Theory Only");
  const [resultStatus, setResultStatus] = useState("Draft");

  useEffect(() => {
    if (!courseCode) return navigate("/admin-dashboard");

    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/grades/get-grades/Any`, {
          params: { courseCode }
        });
        const data = res.data.grades || [];
        setResults(data);

        if (data.length > 0 && data[0].subjectType) {
          setSubjectType(data[0].subjectType);
        }
        if (data.length > 0 && data[0].status) {
          setResultStatus(data[0].status);
        } else {
          setResultStatus("Draft");
        }

      } catch (err) {
        console.error("Error fetching data", err);
        alert("Failed to load grades.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseCode, navigate]);

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
    const arr = [Number(m1)||0, Number(m2)||0, Number(m3)||0].sort((a,b)=>b-a);
    return (arr[0] + arr[1]) / 2;
  };

  const displayStatus = resultStatus || "Draft";
  const statusClass =
    displayStatus === "Approved"
      ? "status-approved"
      : displayStatus === "Pending"
      ? "status-pending"
      : "status-draft";

  const handleApprove = async () => {
    if (!window.confirm("Are you sure you want to PUBLISH these results?")) return;
    setProcessing(true);
    try {
      await axios.post("http://localhost:5000/api/grades/approve-result", { courseCode });
      alert("✅ Results Approved Successfully!");
      navigate("/admin-dashboard");
    } catch (err) {
      alert("Error approving results.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Reject these results? They will be sent back to Staff as Drafts.")) return;
    setProcessing(true);
    try {
      await axios.post("http://localhost:5000/api/grades/reject-result", { courseCode });
      alert("❌ Results Rejected. Sent back to Draft.");
      navigate("/admin-dashboard");
    } catch (err) {
      alert("Error rejecting results.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="view-results-container">
      <div className="results-header">
        <button className="back-btn" onClick={() => navigate("/admin-dashboard")}>⬅ Back</button>
        <div>
            <h2>🛡️ Verify Results: <span className="highlight">{courseCode}</span></h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "6px" }}>
              <span className="badge">{subjectType}</span>
              <span className={`status-badge ${statusClass}`}>{displayStatus}</span>
            </div>
        </div>
      </div>

      {loading ? <p>Loading data...</p> : (
        <>
          <div className="table-wrapper">
            <h4>Student Grades Summary</h4>
            <div className="table-responsive">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Index No</th>
                    <th>Theory Total<br/>(100%)</th>
                    
                    {subjectType === "Theory + Practical" && (
                        <th>Prac Total<br/>(100%)</th>
                    )}

                    <th>Final Mark</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => {
                    const tIcaAvg = getBest2Avg(row.ica1, row.ica2, row.ica3);
                    
                    const qMarks = [row.q1, row.q2, row.q3, row.q4, row.q5].map(Number).sort((a,b)=>b-a);
                    const tExamAvg = (qMarks.slice(0,4).reduce((a,b)=>a+b,0) / 4);

                    const theoryTotal = (tIcaAvg * 0.3) + (tExamAvg * 0.7);

                    let pracTotal = 0;
                    if(subjectType === "Theory + Practical"){
                        const pIcaAvg = getBest2Avg(row.prac_ica1, row.prac_ica2, row.prac_ica3);
                        const pExam = Number(row.prac_exam_marks) || 0;
                        pracTotal = (pIcaAvg * 0.4) + (pExam * 0.6);
                    }

                    const grandTotal = subjectType === "Theory + Practical"
                        ? (theoryTotal + pracTotal) / 2
                        : theoryTotal;

                    const grade = calculateGrade(grandTotal);

                    return (
                      <tr key={i}>
                        <td>{row.indexNumber}</td>

                        <td>
                            {theoryTotal.toFixed(2)} 
                            <span style={{fontSize:'0.8em', color:'#666', display:'block'}}>
                                (ICA:{tIcaAvg.toFixed(0)} | Ex:{tExamAvg.toFixed(0)})
                            </span>
                        </td>

                        {subjectType === "Theory + Practical" && (
                            <td>
                                {pracTotal.toFixed(2)}
                                <span style={{fontSize:'0.8em', color:'#666', display:'block'}}>
                                    (ICA:{(getBest2Avg(row.prac_ica1, row.prac_ica2, row.prac_ica3)).toFixed(0)} | Ex:{row.prac_exam_marks})
                                </span>
                            </td>
                        )}

                        <td className="bold-cell">{grandTotal.toFixed(2)}</td>
                        <td className={`grade-cell grade-${grade}`}>{grade}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="btn-group" style={{ justifyContent: "center", gap: "20px", marginTop: "30px" }}>
            <button 
              className="delete-btn" 
              style={{ padding: "15px 30px", fontSize: "1.1em" }}
              onClick={handleReject}
              disabled={processing}
            >
              ❌ Reject / Send Back
            </button>
            
            <button 
              className="save-btn" 
              style={{ padding: "15px 30px", fontSize: "1.1em" }}
              onClick={handleApprove}
              disabled={processing}
            >
              ✅ Approve & Publish
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminVerifyResults;
