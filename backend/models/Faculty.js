const mongoose = require("mongoose");

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  departments: [{ type: String }]
});

module.exports = mongoose.model("Faculty", FacultySchema);
