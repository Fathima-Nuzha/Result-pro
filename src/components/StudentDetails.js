import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Papa from "papaparse";
import "../CSS/StudentDetails.css";

function StudentDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { faculty, department, level } = location.state || {};

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({
    name: "",
    regNumber: "",
    indexNumber: "",
    address: "",
    birthdate: "",
    gender: "",
    mobile: "",
    email: "",
    password: "", 
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/students", {
        params: { faculty, department, level },
      });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (faculty && department && level) {
      fetchStudents();
    }
  }, [faculty, department, level]);

  const handleAddStudent = async () => {
    const { name, regNumber, indexNumber, email, address, birthdate, gender, mobile, password } = newStudent;

    // Strict validation for ALL fields
    if (!name || !regNumber || !indexNumber || !email || !address || !birthdate || !gender || !mobile || !password) {
      alert("⚠️ Please fill in all required fields.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/students/register", {
        ...newStudent,
        faculty,
        department,
        level,
      });

      if (res.data.success) {
        setStudents((prev) => [...prev, res.data.student]);
        // Reset Form
        setNewStudent({
          name: "", regNumber: "", indexNumber: "", email: "",
          address: "", birthdate: "", gender: "", mobile: "", password: "",
        });
        alert("✅ Student added and email sent successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error: " + (err.response?.data?.message || "Registration failed"));
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let csvStudents = results.data.map((row, index) => {
            // Validation for CSV rows
            if (!row.name || !row.regNumber || !row.indexNumber || !row.password || !row.email) {
              throw new Error(
                `Row ${index + 2} is missing essential fields (name, regNumber, indexNumber, email, or password)`
              );
            }
            return {
              name: row.name.trim(),
              regNumber: row.regNumber.trim(),
              indexNumber: row.indexNumber.trim(),
              address: row.address?.trim() || "N/A",
              birthdate: row.birthdate || "",
              gender: row.gender || "Other",
              mobile: row.mobile || "N/A",
              email: row.email.trim(),
              password: row.password.trim(),
              faculty,
              department,
              level,
            };
          });

          const res = await axios.post("http://localhost:5000/api/students/bulk", {
            students: csvStudents,
          });

          if (res.data.success) {
            alert("✅ CSV uploaded and emails sent successfully!");
            fetchStudents();
          }
        } catch (err) {
          console.error("CSV upload error:", err);
          alert("❌ CSV upload failed: " + err.message);
        }
      },
      error: (err) => {
        alert("❌ Error parsing CSV file.");
      },
    });
  };

  const handleDelete = async (id) => {
    if (!id) {
      alert("❌ Invalid Student ID");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    
    try {
      const res = await axios.delete(`http://localhost:5000/api/students/${id}`);
      if (res.data.success) {
        setStudents(students.filter((s) => s._id !== id));
        alert("🗑️ Student deleted.");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert("❌ Failed to delete student. Server might be unreachable.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  return (
    <div className="student-details-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h2>Students - {faculty} → {department} → {level}</h2>

      <div className="add-course-form">
        <h3>📤 Upload Students CSV</h3>
        <p style={{ fontSize: "0.8rem", color: "#666" }}>
          CSV must include headers: name, regNumber, indexNumber, email, address, birthdate, gender, mobile, password
        </p>
        <input type="file" accept=".csv" onChange={handleCSVUpload} />
      </div>

      <div className="add-course-form">
        <h3>➕ Add New Student</h3>
        <div className="form-grid">
          <input type="text" placeholder="Name" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
          <input type="text" placeholder="Registration Number" value={newStudent.regNumber} onChange={(e) => setNewStudent({ ...newStudent, regNumber: e.target.value })} />
          <input type="text" placeholder="Index Number" value={newStudent.indexNumber} onChange={(e) => setNewStudent({ ...newStudent, indexNumber: e.target.value })} />
          <input type="email" placeholder="Email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} />
          <input type="text" placeholder="Address" value={newStudent.address} onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })} />
          <input type="date" placeholder="Birthdate" value={newStudent.birthdate} onChange={(e) => setNewStudent({ ...newStudent, birthdate: e.target.value })} />
          <select value={newStudent.gender} onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input type="text" placeholder="Mobile" value={newStudent.mobile} onChange={(e) => setNewStudent({ ...newStudent, mobile: e.target.value })} />
          <input type="password" placeholder="Set Password" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} />
        </div>
        <button className="add-btn" onClick={handleAddStudent}>Add Student</button>
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <table className="details-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Reg. Number</th>
              <th>Index Number</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Gender</th>
              <th>Birthdate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.regNumber}</td>
                <td>{s.indexNumber}</td>
                <td>{s.email}</td>
                <td>{s.mobile}</td>
                <td>{s.gender}</td>
                <td>{formatDate(s.birthdate)}</td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(s._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentDetails;