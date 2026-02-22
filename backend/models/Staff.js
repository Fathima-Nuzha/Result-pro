const mongoose = require("mongoose");
const argon2 = require("argon2");

const StaffSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: {type: String, unique: true},
  password: { type: String, required: true },
  name: { type: String, required: true },
  faculty: { type: String },
  department: { type: String },
  role: { type: String }, 
  createdAt: { type: Date, default: Date.now }
});

//hash password
StaffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await argon2.hash(this.password);
  next();
});

//compare password
StaffSchema.methods.matchPassword = async function (enteredPassword) {
  return await argon2.verify(this.password, enteredPassword);
};

module.exports = mongoose.model("Staff", StaffSchema);
