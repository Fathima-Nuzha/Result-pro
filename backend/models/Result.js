const mongoose = require("mongoose");

const singleResultSchema = new mongoose.Schema({
  indexNumber: { type: String, required: true },
  courseCode: { type: String, required: true }, 
  marks: { type: Number, required: true },
  grade: { type: String, required: true }
});

const resultSchema = new mongoose.Schema({
  courseId: { type: String, required: true },  
  faculty: String,
  department: String,
  level: String,
  semester: String,
  released: { type: Boolean, default: false },

  results: [singleResultSchema],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Result", resultSchema);
