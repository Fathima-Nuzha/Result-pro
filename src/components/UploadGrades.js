import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../CSS/UploadGrades.css";

const faculties = [
  "Faculty of Applied Science",
  "Faculty of Business Studies",
  "Faculty of Technological Studies",
];

const facultyDepartments = {
  "Faculty of Applied Science": ["Physical Science", "Biological Science"],
  "Faculty of Business Studies": ["Management", "Finance"],
  "Faculty of Technological Studies": ["Engineering", "IT"],
};

const levels = ["Level 1", "Level 2", "Level 3", "Level 4"];
const semesters = ["Semester 1", "Semester 2"];

const UploadGrades = ({ initialType }) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(initialType || "");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [message, setMessage] = useState("");

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (initialType) setSelectedType(initialType);
  }, [initialType]);

  const handleProceed = () => {
    setMessage("");

    if (!selectedType || !selectedFaculty || !selectedDepartment || !selectedLevel || !selectedSemester || !selectedCourse) {
      return setMessage("⚠️ Please select all dropdowns before proceeding!");
    }

    const navigationState = {
      type: selectedType,
      faculty: selectedFaculty,
      department: selectedDepartment,
      level: selectedLevel,
      semester: selectedSemester,
      courseId: selectedCourse._id,
      courseName: selectedCourse.courseName,
      courseCode: selectedCourse.courseCode,
      grades: [] 
    };

    // Directly navigate to the editing screen with selection data
    navigate('/edit-grades', { state: navigationState });
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (selectedFaculty && selectedDepartment && selectedLevel && selectedSemester) {
        try {
          const res = await axios.get("http://localhost:5000/api/courses", {
            params: {
              faculty: selectedFaculty,
              department: selectedDepartment,
              level: selectedLevel,
              semester: selectedSemester,
            },
          });
          setCourses(res.data.courses || []);
        } catch (err) {
          console.error("Error fetching courses", err);
        }
      }
    };
    fetchCourses();
  }, [selectedFaculty, selectedDepartment, selectedLevel, selectedSemester]);

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2>📘 Select Result Update Category</h2>

        {!selectedType ? (
          <div className="button-container">
            <button onClick={() => setSelectedType("ICA")}>ICA</button>
            <button onClick={() => setSelectedType("Exams")}>Final Exams</button>
          </div>
        ) : (
          <>
            <div className="dropdown-section">
              <div className="dropdown">
                <label>Faculty:</label>
                <select value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
                  <option value="">-- Select Faculty --</option>
                  {faculties.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {selectedFaculty && (
                <div className="dropdown">
                  <label>Department:</label>
                  <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                    <option value="">-- Select Department --</option>
                    {facultyDepartments[selectedFaculty].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}

              {selectedDepartment && (
                <div className="dropdown">
                  <label>Level:</label>
                  <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
                    <option value="">-- Select Level --</option>
                    {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}

              {selectedLevel && (
                <div className="dropdown">
                  <label>Semester:</label>
                  <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                    <option value="">-- Select Semester --</option>
                    {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {selectedSemester && courses.length > 0 && (
                <div className="dropdown">
                  <label>Course:</label>
                  <select
                    value={selectedCourse?._id || ""}
                    onChange={(e) => {
                      const course = courses.find(c => c._id === e.target.value);
                      setSelectedCourse(course);
                    }}
                  >
                    <option value="">-- Select Course --</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.courseCode} - {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="button-container" style={{ marginTop: "25px" }}>
              <button onClick={handleProceed}>
                📝 Proceed to Edit
              </button>
              <button className="secondary-btn" onClick={() => setSelectedType("")}>Back</button>
            </div>

            {message && <p className="message error">{message}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default UploadGrades;