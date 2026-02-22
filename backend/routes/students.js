const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const Student = require("../models/Student");
const argon2 = require("argon2");

require('dotenv').config();

const sendCredentialsEmail = async (studentEmail, studentName, registrationNumber, plainPassword) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_USER || "resultprouov@gmail.com",
        pass: (process.env.EMAIL_PASS || "fvracoleemcoapye").replace(/\s/g, ""), 
      },
    });

    await transporter.verify(); 

    const mailOptions = {
      from: `"University Admin" <${process.env.EMAIL_USER || "resultprouov@gmail.com"}>`,
      to: studentEmail,
      subject: "Your Student Account Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>Welcome to the University Result Management System</h3>
          <p>Dear ${studentName},</p>
          <p>Your account has been created successfully.</p>
          <p><b>Username:</b> ${registrationNumber}</p>
          <p><b>Password:</b> ${plainPassword}</p>
          <p>Please change your password after your first login immediately.</p>
          <p>Best regards,<br/>University Admin</p>
        </div>
      ` 
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent: " + info.response);
  } catch (error) {
    console.error(`❌ Email failed for ${studentEmail}:`, error.message);
  }
};

// Register Single Student
router.post("/register", async (req, res) => {
  try {
    const { 
      name, regNumber, indexNumber, email, password, 
      faculty, department, level, address, birthdate, gender, mobile 
    } = req.body;

    // Strict Backend Validation
    if (!name || !regNumber || !indexNumber || !email || !password || !faculty || !department || !level || !address || !birthdate || !gender || !mobile) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const existing = await Student.findOne({ 
      $or: [{ regNumber }, { indexNumber }] 
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Student with this Reg or Index number already exists." });
    }

    const hashedPassword = await argon2.hash(password);

    const newStudent = new Student({
      name, regNumber, indexNumber, email, faculty, department, level,
      address, birthdate, gender, mobile,
      password: hashedPassword
    });

    await newStudent.save();
    if (email) await sendCredentialsEmail(email, name, regNumber, password);

    res.json({ success: true, student: newStudent });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Bulk Upload Route
router.post("/bulk", async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students)) return res.status(400).json({ success: false, message: "Invalid data." });

    const processedStudents = [];
    
    for (const s of students) {
      const plainPassword = s.password; 
      const hashedPassword = await argon2.hash(plainPassword);
      
      processedStudents.push({
        ...s,
        password: hashedPassword, 
        plainToEmail: plainPassword 
      });
    }

    await Student.insertMany(processedStudents, { ordered: false });

    for (const s of processedStudents) {
      if (s.email) {
        await sendCredentialsEmail(s.email, s.name, s.regNumber, s.plainToEmail);
      }
    }

    res.json({ success: true, message: "Bulk upload successful and emails sent." });
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    res.status(500).json({ success: false, message: "Error during bulk upload." });
  }
});

router.get("/", async (req, res) => {
  try {
    const { faculty, department, level } = req.query;
    const filter = {};
    if (faculty) filter.faculty = faculty.trim();
    if (department) filter.department = department.trim();
    if (level) filter.level = level;

    const students = await Student.find(filter).select("-password");
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Fetch failed." });
  }
});

// Delete Student
router.delete("/:id", async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Student deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed." });
  }
});

module.exports = router;