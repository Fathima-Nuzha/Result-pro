const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const Student = require("../models/Student");
const Result = require("../models/Result");
const { Parser } = require("json2csv");
const Admin = require("../models/admin");

router.get("/students", async (req, res) => {
  try {
    const { faculty, department, level } = req.query;

    const filter = {};
    if (faculty) filter.faculty = faculty;
    if (department) filter.department = department;
    if (level) filter.level = level;

    const students = await Student.find(filter).select("-password");

    res.json({ success: true, students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/register", async (req, res) => {
  try {
    const { username, email, password, faculty, department } = req.body;

    if (!username || !email || !password || !faculty || !department) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }],
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists",
      });
    }

    const admin = new Admin({
      username,
      email,
      password,
      faculty,
      department,
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        faculty: admin.faculty,
        department: admin.department,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/courses", async (req, res) => {
  try {
    const { code, name, faculty, department, level, credits } = req.body;

    if (!code || !name || !faculty || !department || !level)
      return res.json({ success: false, message: "Missing data" });

    const course = new Course({
      code,
      name,
      faculty,
      department,
      level,
      credits
    });

    await course.save();
    res.json({ success: true, course });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/courses", async (req, res) => {
  try {
    const { faculty, department, level } = req.query;

    if (!faculty || !department || !level) {
      return res.json({ success: false, message: "Missing parameters" });
    }

    const courses = await Course.find({
      faculty,
      department,
      level
    }).select("code name");

    res.json({ success: true, courses });

  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

router.get("/overview", async (req, res) => {
  try {
    const { faculty, department } = req.query;
    const filter = {};
    if (faculty) filter.faculty = faculty;
    if (department) filter.department = department;

    const totalStudents = await Student.countDocuments(filter);
    const totalCourses = await Course.countDocuments(filter);

    res.json({
      success: true,
      totalStudents,
      totalCourses,
    });
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    res.json({ success: false, message: "Server error" });
  }
});

router.post("/result", async (req, res) => {
  try {
    const { indexNumber, courseCode, marks, grade } = req.body;

    if (!indexNumber || !courseCode || !marks || !grade)
      return res.json({ success: false, message: "Missing fields" });

    const result = new Result({
      indexNumber,
      courseCode,
      marks,
      grade
    });

    await result.save();

    res.json({ success: true, result });
  } catch (error) {
    console.error("Result upload error:", error);
    res.json({ success: false, message: "Server error" });
  }
});

module.exports = router;
