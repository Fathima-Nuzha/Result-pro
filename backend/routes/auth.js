const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const argon2 = require("argon2");
const Student = require("../models/Student");
const Staff = require("../models/Staff");
const Admin = require("../models/admin");
const Otp = require("../models/Otp");

const OTP_EXPIRE_MIN = parseInt(process.env.OTP_EXPIRE_MIN || "5", 10);
const MAX_OTP_ATTEMPTS = 5;

//email 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "resultprouov@gmail.com",
    pass: "gsmytctbmodiqyuv", 
  },
});

//otp
function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

//send otp
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (
      !email.endsWith("@stu.vau.ac.lk") &&
      !email.endsWith("@vau.ac.lk")
    ) {
      return res
        .status(400)
        .json({ message: "Use your university email only" });
    }

    const existingOtp = await Otp.findOne({ email });
    if (existingOtp && existingOtp.expiresAt > new Date()) {
      return res.status(429).json({
        message: "OTP already sent. Please wait before requesting again.",
      });
    }

    const code = genOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email },
      { code, expiresAt, attempts: 0 },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: "resultprouov@gmail.com",
      to: email,
      subject: "University Password Reset OTP",
      text: `Your OTP is ${code}. It expires in ${OTP_EXPIRE_MIN} minutes.`,
    });

    return res.json({ message: "OTP sent to your university email." });
  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});

//verify otp & password reset
router.post("/verify-otp", async (req, res) => {
  try {
    console.log("VERIFY OTP BODY:", req.body); 

    const { email, otp, newPassword } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ message: "Email and OTP are required" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const otpDoc = await Otp.findOne({ email });
    if (!otpDoc) {
      return res
        .status(400)
        .json({ message: "OTP not found or expired" });
    }

    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ email });
      return res.status(429).json({
        message: "Too many attempts. Request a new OTP.",
      });
    }

    if (otpDoc.code !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user =
      (await Student.findOne({ email })) ||
      (await Staff.findOne({ email })) ||
      (await Admin.findOne({ email }));

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

//update password
    user.password = await argon2.hash(newPassword);
    await user.save();

    await Otp.deleteOne({ email });

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
});

//login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check Student Collection
    const student = await Student.findOne({ email: cleanEmail });
    if (student) {
      const isMatch = await argon2.verify(student.password, password);
      if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect password" });

      return res.json({
        success: true,
        role: "student",
        user: {
          id: student._id,
          email: student.email,
          name: student.name,
          username: student.regNumber, 
          faculty: student.faculty,
          department: student.department,
          level: student.level,
        },
      });
    }

    // 2. Check Staff Collection
    const staff = await Staff.findOne({ email: cleanEmail });
    if (staff) {
      const isMatch = await argon2.verify(staff.password, password);
      if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect password" });

      return res.json({
        success: true,
        role: "staff",
        user: {
          id: staff._id,
          email: staff.email,
          name: staff.name,
          username: staff.username,
          faculty: staff.faculty,
          department: staff.department,
          role: staff.role,
        },
      });
    }

    // 3. Check Admin Collection
    const admin = await Admin.findOne({ email: cleanEmail });
    if (admin) {
      const isMatch = await argon2.verify(admin.password, password);
      if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect password" });

      return res.json({
        success: true,
        role: "admin",
        user: {
          id: admin._id,
          email: admin.email,
          name: admin.name || "Admin",
          username: admin.username,
          faculty: admin.faculty,
          department: admin.department,
          role: admin.role,
        },
      });
    }

    return res.status(404).json({ success: false, message: "User not found" });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
