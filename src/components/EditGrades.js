import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../CSS/EditGrades.css";

const EditGrades = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    type,
    faculty,
    department,
    level,
    semester,
    grades: initialGrades,
    courseId,
    courseName,
    courseCode
  } = location.state || {};

  const [grades, setGrades] = useState(initialGrades || []);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [subjectType, setSubjectType] = useState("Theory Only"); 

  const [course] = useState(
    courseId ? { _id: courseId, courseName, courseCode } : null
  );

  useEffect(() => {
    if (!type || !faculty || !department || !level || !semester || !course) {
      navigate("/staff-dashboard");
    }
  }, [type, faculty, department, level, semester, course, navigate]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const existingRes = await axios.get(`http://localhost:5000/api/grades/get-grades/${type}`, {
          params: { faculty, department, level, semester, courseId: course._id }
        });

        if (existingRes.data.grades && existingRes.data.grades.length > 0) {
          setGrades(existingRes.data.grades);
          setMessage(`✅ Loaded existing ${type} marks.`);
        } else {
          const studentRes = await axios.get("http://localhost:5000/api/students", {
            params: { faculty, department, level }
          });
          const students = studentRes.data.students || [];

          let icaDataMap = {};
          if (type !== "ICA") {
            try {
              const icaRes = await axios.get(`http://localhost:5000/api/grades/get-grades/ICA`, {
                params: { faculty, department, level, semester, courseId: course._id }
              });
              if (icaRes.data.grades) {
                icaRes.data.grades.forEach(row => {
                  const tMarks = [row.ica1 || 0, row.ica2 || 0, row.ica3 || 0].map(Number).sort((a,b) => b-a);
                  const tAvg = (tMarks[0] + tMarks[1]) / 2;
                  const pMarks = [row.prac_ica1 || 0, row.prac_ica2 || 0, row.prac_ica3 || 0].map(Number).sort((a,b) => b-a);
                  const pAvg = (pMarks[0] + pMarks[1]) / 2;
                  const key = row.registrationNumber || row.regNumber; 
                  icaDataMap[key] = { theoryAvg: tAvg, pracAvg: pAvg }; 
                });
              }
            } catch (err) { console.warn("ICA marks not found for final exam view."); }
          }

          const newRows = students.map(std => {
            const commonFields = {
              registrationNumber: std.regNumber, 
              indexNumber: std.indexNumber,
              faculty, department, level, semester,
              courseId: course._id, courseName: course.courseName, courseCode: course.courseCode
            };

            if (type === "ICA") {
              return { 
                ...commonFields, 
                ica1: 0, ica2: 0, ica3: 0, additional1: 0, additional2: 0, finalMarks: 0,
                prac_ica1: 0, prac_ica2: 0, prac_ica3: 0, prac_add1: 0, prac_add2: 0, prac_finalMarks: 0
              };
            } else {
              const icaData = icaDataMap[std.regNumber] || { theoryAvg: 0, pracAvg: 0 };
              return { 
                ...commonFields, 
                q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, icaMarks: icaData.theoryAvg,
                prac_exam_marks: 0, prac_icaMarks: icaData.pracAvg
              };
            }
          });
          setGrades(newRows);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setMessage("⚠️ Error loading student records.");
      } finally {
        setLoading(false);
      }
    };

    if (faculty && department && level && course) {
      initializeData();
    }
  }, [faculty, department, level, semester, type, course]);

  const handleSave = async () => {
    setMessage("");
    if (!grades.length) return setMessage("⚠️ No grades to save!");

    try {
      setLoading(true);
      const res = await axios.post(
        `http://localhost:5000/api/grades/update-grades/${type}`,
        { grades, subjectType }
      );
      setMessage(res.data.message || "✅ Grades saved successfully!");
    } catch (err) {
      console.error(err?.response?.data || err);
      setMessage("❌ Error saving grades!");
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (totalMarks) => {
    const total = Math.round(totalMarks);
    if (total >= 80 && total <= 100) return "A+";
    if (total >= 75 && total <= 79) return "A";
    if (total >= 70 && total <= 74) return "A-";
    if (total >= 65 && total <= 69) return "B+";
    if (total >= 60 && total <= 64) return "B";
    if (total >= 55 && total <= 59) return "B-";
    if (total >= 50 && total <= 54) return "C+";
    if (total >= 45 && total <= 49) return "C";
    if (total >= 40 && total <= 44) return "C-";
    if (total >= 35 && total <= 39) return "D+";
    if (total >= 30 && total <= 34) return "D";
    return "E";
  };

  const handleAddRow = () => {
    const newRow = {
      registrationNumber: "", indexNumber: "",
      faculty, department, level, semester,
      courseId: course._id, courseName: course.courseName, courseCode: course.courseCode
    };
    const emptyGrades = type === "ICA" 
      ? { ica1: 0, ica2: 0, ica3: 0, additional1: 0, additional2: 0, finalMarks: 0, prac_ica1: 0, prac_ica2: 0, prac_ica3: 0, prac_add1: 0, prac_add2: 0, prac_finalMarks: 0 }
      : { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, icaMarks: 0, prac_exam_marks: 0, prac_icaMarks: 0 };

    setGrades([...grades, { ...newRow, ...emptyGrades }]);
  };

  const handleDeleteRow = async (index) => {
    const updated = grades.filter((_, i) => i !== index);
    setGrades(updated);
  };

  const updateRow = (index, field, value) => {
    const updated = [...grades];
    updated[index][field] = value;
    setGrades(updated);
  };

  const calcBest2Avg = (m1, m2, m3) => {
    const marks = [Number(m1)||0, Number(m2)||0, Number(m3)||0].sort((a,b)=>b-a);
    return (marks[0] + marks[1]) / 2;
  }

  return (
    <div className="upload-container">
      <div className="upload-card">
        <div className="card-header">
            <h2>📝 Edit {type} Grades</h2>
        </div>

        <div className="info-bar">
          <span><strong>Course Name:</strong> {course?.courseName}</span>
          <span><strong>Faculty:</strong> {faculty}</span>
          <span><strong>Department:</strong> {department}</span>
          
          <span className="subject-type-selector">
            <strong>Type:</strong>
            <select value={subjectType} onChange={(e) => setSubjectType(e.target.value)} style={{marginLeft: '10px', padding: '5px'}}>
                <option value="Theory Only">Theory Only</option>
                <option value="Theory + Practical">Theory + Practical</option>
            </select>
          </span>
        </div>

        {message && (
          <div className={`message ${message.includes("❌") || message.includes("⚠️") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        {type === "ICA" ? (
          <div className="grades-table-wrapper">
            <h3 className="section-title">📖 Theory ICA Marks (30%)</h3>
            <table>
              <thead>
                <tr>
                  <th>Reg No</th><th>ICA 1</th><th>ICA 2</th><th>ICA 3</th><th>Add 1</th><th>Add 2</th><th>Total (30%)</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((row, i) => {
                  const finalCalc = calcBest2Avg(row.ica1, row.ica2, row.ica3) * 0.3;
                  return (
                    <tr key={`theory-${i}`}>
                      <td><input value={row.registrationNumber} readOnly /></td>
                      <td><input type="number" value={row.ica1} onChange={(e) => updateRow(i, 'ica1', e.target.value)} /></td>
                      <td><input type="number" value={row.ica2} onChange={(e) => updateRow(i, 'ica2', e.target.value)} /></td>
                      <td><input type="number" value={row.ica3} onChange={(e) => updateRow(i, 'ica3', e.target.value)} /></td>
                      <td><input type="number" value={row.additional1} onChange={(e) => updateRow(i, 'additional1', e.target.value)} /></td>
                      <td><input type="number" value={row.additional2} onChange={(e) => updateRow(i, 'additional2', e.target.value)} /></td>
                      <td><input value={finalCalc.toFixed(2)} className="readonly-input" readOnly /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {subjectType === "Theory + Practical" && (
                <>
                <h3 className="section-title" style={{marginTop:'30px'}}>🧪 Practical ICA Marks (40%)</h3>
                <table>
                <thead>
                    <tr><th>Reg No</th><th>Prac 1</th><th>Prac 2</th><th>Prac 3</th><th>Add 1</th><th>Add 2</th><th>Total (40%)</th><th>Action</th></tr>
                </thead>
                <tbody>
                    {grades.map((row, i) => {
                    const finalCalc = calcBest2Avg(row.prac_ica1, row.prac_ica2, row.prac_ica3) * 0.4;
                    return (
                        <tr key={`prac-${i}`}>
                        <td><input value={row.registrationNumber} readOnly /></td>
                        <td><input type="number" value={row.prac_ica1} onChange={(e) => updateRow(i, 'prac_ica1', e.target.value)} /></td>
                        <td><input type="number" value={row.prac_ica2} onChange={(e) => updateRow(i, 'prac_ica2', e.target.value)} /></td>
                        <td><input type="number" value={row.prac_ica3} onChange={(e) => updateRow(i, 'prac_ica3', e.target.value)} /></td>
                        <td><input type="number" value={row.prac_add1} onChange={(e) => updateRow(i, 'prac_add1', e.target.value)} /></td>
                        <td><input type="number" value={row.prac_add2} onChange={(e) => updateRow(i, 'prac_add2', e.target.value)} /></td>
                        <td><input value={finalCalc.toFixed(2)} className="readonly-input" readOnly /></td>
                        <td><button className="delete-btn" onClick={() => handleDeleteRow(i)}>🗑</button></td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
                </>
            )}
          </div>
        ) : (
          <div className="grades-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{width:'100px'}}>Reg No</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Q5</th>
                  {subjectType === "Theory + Practical" && <th>Prac Exam</th>}
                  <th>Theory (100%)</th>
                  {subjectType === "Theory + Practical" && <th>Prac (100%)</th>}
                  <th>Final Grade</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((row, i) => {
                  const qMarks = [row.q1, row.q2, row.q3, row.q4, row.q5].map(m => Number(m) || 0).sort((a,b)=>b-a);
                  const best4Avg = (qMarks.slice(0,4).reduce((a,b)=>a+b,0))/4;
                  const theoryICAPart = (Number(row.icaMarks) || 0) * 0.3;
                  const theoryExamPart = best4Avg * 0.7;
                  const theoryTotal = theoryICAPart + theoryExamPart;

                  let pracTotal = 0;
                  if (subjectType === "Theory + Practical") {
                      const pracICAPart = (Number(row.prac_icaMarks) || 0) * 0.4;
                      const pracExamPart = (Number(row.prac_exam_marks) || 0) * 0.6;
                      pracTotal = pracICAPart + pracExamPart;
                  }

                  const grandTotal = subjectType === "Theory + Practical" ? (theoryTotal + pracTotal) / 2 : theoryTotal;
                  const grade = calculateGrade(grandTotal);

                  return (
                    <tr key={i}>
                      <td><input value={row.registrationNumber} readOnly /></td>
                      <td><input type="number" className="small-input" value={row.q1} onChange={(e) => updateRow(i, 'q1', e.target.value)} /></td>
                      <td><input type="number" className="small-input" value={row.q2} onChange={(e) => updateRow(i, 'q2', e.target.value)} /></td>
                      <td><input type="number" className="small-input" value={row.q3} onChange={(e) => updateRow(i, 'q3', e.target.value)} /></td>
                      <td><input type="number" className="small-input" value={row.q4} onChange={(e) => updateRow(i, 'q4', e.target.value)} /></td>
                      <td><input type="number" className="small-input" value={row.q5} onChange={(e) => updateRow(i, 'q5', e.target.value)} /></td>
                      {subjectType === "Theory + Practical" && (
                         <td><input type="number" value={row.prac_exam_marks} onChange={(e) => updateRow(i, 'prac_exam_marks', e.target.value)} /></td>
                      )}
                      <td><input value={theoryTotal.toFixed(1)} className="readonly-input" readOnly /></td>
                      {subjectType === "Theory + Practical" && (
                          <td><input value={pracTotal.toFixed(1)} className="readonly-input" readOnly /></td>
                      )}
                      <td className={`grade-cell grade-${grade}`}>
                        {grade} ({grandTotal.toFixed(0)})
                      </td>
                      <td><button className="delete-btn" onClick={() => handleDeleteRow(i)}>🗑</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="btn-group">
          <button className="add-btn" onClick={handleAddRow}>➕ Add Row</button>
          <button className="save-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "💾 Save Grades"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGrades;