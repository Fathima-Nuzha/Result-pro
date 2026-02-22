import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Papa from "papaparse";
import "../CSS/CourseDetails.css";

function CourseDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { faculty, department, level, semester } = location.state || {};

  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    courseCode: "",
    courseName: "",
    credits: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!faculty || !department || !level || !semester) return;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/courses", {
          params: { faculty, department, level, semester },
        });
        setCourses(res.data.courses || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
        alert("❌ Failed to fetch courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [faculty, department, level, semester]);

  const handleAddCourse = async () => {
    const { courseCode, courseName, credits } = newCourse;
    if (!courseCode || !courseName || !credits) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/courses", {
        faculty,
        department,
        level,
        semester,
        courseCode,
        courseName,
        credits: Number(credits),
      });

      if (res.data?.course) {
        setCourses((prev) => [...prev, res.data.course]);
        setNewCourse({ courseCode: "", courseName: "", credits: "" });
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add course.");
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const csvCourses = results.data.map((row) => ({
          faculty,
          department,
          level,
          semester,
          courseCode: row.courseCode,
          courseName: row.courseName,
          credits: Number(row.credits),
        }));

        try {
          const res = await axios.post(
            "http://localhost:5000/api/courses/bulk",
            { courses: csvCourses }
          );
          if (res.data.success) {
            setCourses((prev) => [...prev, ...csvCourses]);
            alert("✅ CSV uploaded successfully!");
          } else {
            alert("⚠️ Failed to upload CSV data.");
          }
        } catch (err) {
          console.error(err);
          alert("❌ Error uploading CSV.");
        }
      },
    });
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      alert("✅ Course deleted successfully!");
    } catch (err) {
      console.error("Delete course error:", err.response || err.message);
      alert("❌ Failed to delete course: " + (err.response?.data?.message || err.message));
    }
  };


  return (
    <div className="course-details-page">

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>
      
      <div className="header">
        <h2>📘 {semester} - Course Details</h2>
        <p>
          {faculty && department && level
            ? `${faculty} → ${department} → ${level} → ${semester}`
            : "No details provided"}
        </p>
      </div>

      {loading ? (
        <p>Loading courses...</p>
      ) : (
        <table className="course-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Credits</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length ? (
              courses.map((course) => (
                <tr key={course._id || course.courseCode}>
                  <td>{course.courseCode}</td>
                  <td>{course.courseName}</td>
                  <td>{course.credits}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteCourse(course._id)}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No courses found for this semester.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <div className="csv-upload-section">
        <h3>📤 Upload Courses via CSV</h3>
        <input type="file" accept=".csv" onChange={handleCSVUpload} />
        <p style={{ fontSize: "14px", color: "#555" }}>
          Format: courseCode, courseName, credits
        </p>
      </div>

      <div className="add-course-section">
        <h3>Add New Course ({semester})</h3>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Course Code"
            value={newCourse.courseCode}
            onChange={(e) =>
              setNewCourse({ ...newCourse, courseCode: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Course Name"
            value={newCourse.courseName}
            onChange={(e) =>
              setNewCourse({ ...newCourse, courseName: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Credits"
            value={newCourse.credits}
            onChange={(e) =>
              setNewCourse({ ...newCourse, credits: e.target.value })
            }
          />
        </div>
        <button className="add-btn" onClick={handleAddCourse}>
          ➕ Add Course
        </button>
      </div>
    </div>
  );
}

export default CourseDetails;
