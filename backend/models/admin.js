const mongoose = require("mongoose");
const argon2 = require("argon2");

const AdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    faculty: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true }
);

//hash password
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await argon2.hash(this.password);
  next();
});

//verify
AdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await argon2.verify(this.password, enteredPassword);
};

module.exports = mongoose.model("Admin", AdminSchema);
