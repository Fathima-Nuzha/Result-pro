const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  regNumber: { type: String, required: true, unique: true },
  indexNumber: { type: String, required: true, unique: true },
  address: { type: String },
  birthdate: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  mobile: { type: String },
  email: { type: String },
  faculty: { type: String, required: true },
  department: { type: String, required: true },
  level: { type: String, required: true },
  password: { type: String, required: true }, 
});

module.exports = mongoose.model("Student", studentSchema);