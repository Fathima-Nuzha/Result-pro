require("dotenv").config();
const mongoose = require("mongoose");
const argon2 = require("argon2");

const Faculty = require("./models/Faculty");
const Admin = require("./models/admin");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // faculties seed
  const faculties = [
    { name: "Faculty of Applied Science", departments: ["Department of Physical", "Department of Biological"] },
    { name: "Faculty of Business Studies", departments: ["Department of Management", "Department of Finance"] },
    { name: "Faculty of Technological Studies", departments: ["Department of Engineering", "Department of IT"] }
  ];

  for (const f of faculties) {
    await Faculty.updateOne({ name: f.name }, { $set: f }, { upsert: true });
  }

  // admin seed (username: admin, password: admin123) — hashed
  const existing = await Admin.findOne({ username: "admin" });
  if (!existing) {
    const hash = await argon2.hash("admin123");
    const admin = new Admin({ username: "admin", email: "admin@university.edu", password: hash, name: "System Administrator" });
    await admin.save();
    console.log("Created admin account (admin / admin123 / admin@university.edu)");
  } else {
    console.log("Admin already exists");
  }

  // student seed (regNumber: 2021ict123, password: Abc@1234) — hashed
  const existingStudent = await Student.findOne({ regNumber: "2021ict123" });
  if (!existingStudent) {
    const hash = await argon2.hash("Abc@1234");
    const student = new Student({
      name: "Test Student",
      regNumber: "2021ict123",
      indexNumber: "2021ICT123",
      address: "Test Address",
      birthdate: new Date("2000-01-01"),
      gender: "Male",
      mobile: "1234567890",
      email: "2021ict123@stu.vau.ac.lk",
      faculty: "Faculty of Technological Studies",
      department: "Department of IT",
      level: "Level 3",
      password: hash
    });
    await student.save();
    console.log("Created student account (2021ict123 / Abc@1234)");
  } else {
    console.log("Student already exists");
  }

  console.log("Seed done");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
