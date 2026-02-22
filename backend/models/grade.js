const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true },
  indexNumber: { type: String },
  faculty: { type: String, required: true },
  department: { type: String, required: true },
  level: { type: String, required: true },
  semester: { type: String, required: true },
  
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseName: { type: String },
  courseCode: { type: String },

  subjectType: { type: String, default: "Theory Only" },

  status: { type: String, default: "Draft" }, 

  ica1: { type: Number, default: 0 },
  ica2: { type: Number, default: 0 },
  ica3: { type: Number, default: 0 },
  additional1: { type: Number, default: 0 },
  additional2: { type: Number, default: 0 },

  prac_ica1: { type: Number, default: 0 },
  prac_ica2: { type: Number, default: 0 },
  prac_ica3: { type: Number, default: 0 },
  prac_add1: { type: Number, default: 0 },
  prac_add2: { type: Number, default: 0 },

  q1: { type: Number, default: 0 },
  q2: { type: Number, default: 0 },
  q3: { type: Number, default: 0 },
  q4: { type: Number, default: 0 },
  q5: { type: Number, default: 0 },
   
  prac_exam_marks: { type: Number, default: 0 },

  finalMarks: { type: Number, default: 0 }, 
  grade: { type: String } 
}, { timestamps: true });

gradeSchema.index({ registrationNumber: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Grade", gradeSchema);