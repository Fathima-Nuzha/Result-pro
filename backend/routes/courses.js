const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

//add course - single
router.post("/", async (req, res) => {
  try {
    const { faculty, department, level, semester, courseCode, courseName, credits } = req.body;

    if (!faculty || !department || !level || !semester || !courseCode || !courseName || !credits) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newCourse = new Course({ faculty, department, level, semester, courseCode, courseName, credits });
    await newCourse.save();

    res.status(201).json({ success: true, message: "Course added successfully", course: newCourse });
  } catch (err) {
    console.error("❌ Add course failed:", err);
    res.status(500).json({ success: false, message: "Failed to add course" });
  }
});

//add course - bulk
router.post("/bulk", async (req, res) => {
  try {
    const { courses } = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ success: false, message: "No courses provided" });
    }

    await Course.insertMany(courses, { ordered: false });
    res.status(201).json({ success: true, message: "Bulk courses uploaded successfully" });
  } catch (err) {
    console.error("❌ Bulk upload failed:", err);
    res.status(500).json({ success: false, message: "Bulk upload failed" });
  }
});

//get course
router.get("/", async (req, res) => {
  try {
    const { faculty, department, level, semester } = req.query;
    const filter = {};
    if (faculty) filter.faculty = faculty;
    if (department) filter.department = department;
    if (level) filter.level = level;
    if (semester) filter.semester = semester;

    const courses = await Course.find(filter);
    res.json({ success: true, courses });
  } catch (err) {
    console.error("❌ Error fetching courses:", err);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
});

// delete course
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    console.error("❌ Delete course failed:", err);
    res.status(500).json({ success: false, message: "Failed to delete course" });
  }
});


module.exports = router;
