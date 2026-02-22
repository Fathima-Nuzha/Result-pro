const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  faculty: { type: String, required: true },
  department: { type: String, required: true },
  level: { type: String, required: true },
  semester: { type: String, required: true },
  courseCode: { type: String, required: true, unique: true },
  courseName: { type: String, required: true },
  credits: { type: Number, default: 0 }
});

module.exports = mongoose.model("Course", courseSchema);
