const express = require("express");
const router = express.Router();
const Grade = require("../models/grade");

//update grades
router.post("/update-grades/:type", async (req, res) => {
  const { type } = req.params; 
  const { grades, subjectType } = req.body; 

  if (!grades || grades.length === 0) {
    return res.status(400).json({ message: "❌ No grades provided." });
  }

  try {
    const bulkOps = grades.map((row) => {
      const filter = {
        registrationNumber: row.registrationNumber,
        courseId: row.courseId
      };

      const baseData = {
        registrationNumber: row.registrationNumber,
        indexNumber: row.indexNumber,
        faculty: row.faculty,
        department: row.department,
        level: row.level,
        semester: row.semester,
        courseId: row.courseId,
        courseName: row.courseName,
        courseCode: row.courseCode,
        subjectType: subjectType || row.subjectType || "Theory Only" 
      };

      let specificFields = {};
      
      if (type === "ICA") {
        specificFields = {
          ica1: row.ica1, ica2: row.ica2, ica3: row.ica3,
          additional1: row.additional1, additional2: row.additional2,
          prac_ica1: row.prac_ica1, prac_ica2: row.prac_ica2, prac_ica3: row.prac_ica3,
          prac_add1: row.prac_add1, prac_add2: row.prac_add2
        };
      } else {
        specificFields = {
          q1: row.q1, q2: row.q2, q3: row.q3, q4: row.q4, q5: row.q5,
          prac_exam_marks: row.prac_exam_marks 
        };
      }

      return {
        updateOne: {
          filter,
          update: { $set: { ...baseData, ...specificFields } },
          upsert: true
        }
      };
    });

    await Grade.bulkWrite(bulkOps);
    res.status(200).json({ message: "✅ Grades saved successfully!" });
  } catch (err) {
    console.error("Error saving grades:", err);
    res.status(500).json({ message: "❌ Server Error saving grades." });
  }
});

//fetch to grades staff-admin
router.get("/get-grades/:type", async (req, res) => {
  const { faculty, department, level, semester, courseId, courseCode } = req.query;
  try {
    const query = {};
    if (faculty) query.faculty = faculty;
    if (department) query.department = department;
    if (level) query.level = level;
    if (semester) query.semester = semester;
    if (courseId) query.courseId = courseId;
    if (courseCode) query.courseCode = { $regex: new RegExp(`^${courseCode}$`, "i") };

    const grades = await Grade.find(query);
    res.status(200).json({ grades });
  } catch (err) {
    console.error("Error fetching grades:", err);
    res.status(500).json({ message: "❌ Error fetching grades." });
  }
});

//grade delete
router.delete("/delete-grade", async (req, res) => {
  const { registrationNumber, courseId } = req.query;
  try {
    await Grade.findOneAndDelete({ registrationNumber, courseId });
    res.status(200).json({ message: "✅ Record deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server Error." });
  }
});

//admin grade approve or reject
router.post("/send-to-admin", async (req, res) => {
  const { courseCode } = req.body;
  try {
    const result = await Grade.updateMany(
      { courseCode: { $regex: new RegExp(`^${courseCode}$`, "i") } },
      { $set: { status: "Pending" } }
    );
    res.status(200).json({ message: `✅ Sent ${result.modifiedCount} records to Admin.` });
  } catch (err) {
    res.status(500).json({ message: "❌ Server Error updating status." });
  }
});

router.get("/pending-approvals", async (req, res) => {
  const { faculty, department } = req.query;
  try {
    const match = { status: "Pending" };
    if (faculty) match.faculty = faculty;
    if (department) match.department = department;

    const pendingCourses = await Grade.aggregate([
      { $match: match },
      { 
        $group: { 
          _id: "$courseCode", 
          faculty: { $first: "$faculty" },
          department: { $first: "$department" },
          level: { $first: "$level" },
          semester: { $first: "$semester" },
          totalStudents: { $sum: 1 }
        } 
      }
    ]);
    res.status(200).json({ success: true, data: pendingCourses });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post("/approve-result", async (req, res) => {
  const { courseCode } = req.body;
  try {
    await Grade.updateMany({ courseCode }, { $set: { status: "Approved" } });
    res.status(200).json({ success: true, message: "✅ Results Approved!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error approving results." });
  }
});

router.post("/reject-result", async (req, res) => {
  const { courseCode } = req.body;
  try {
    await Grade.updateMany({ courseCode }, { $set: { status: "Draft" } });
    res.status(200).json({ success: true, message: "❌ Results Rejected (Draft)." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error rejecting results." });
  }
});

//calculate result dynamically
router.get("/student-results", async (req, res) => {
  const { registrationNumber, level, semester } = req.query;

  if (!registrationNumber) {
    return res.status(400).json({ success: false, message: "❌ Registration number is required." });
  }

  try {
    const query = { 
      registrationNumber: registrationNumber, 
      status: "Approved" 
    };

    if (level) query.level = level;
    if (semester) query.semester = semester;

    const grades = await Grade.find(query);

    const gradeToGPA = {
      "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
      "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "E": 0.0
    };

    const getBest2Avg = (m1, m2, m3) => {
        const arr = [Number(m1)||0, Number(m2)||0, Number(m3)||0].sort((a,b)=>b-a);
        return (arr[0] + arr[1]) / 2;
    };

    const calculateAutoGrade = (g) => {
      const theoryIcaAvg = getBest2Avg(g.ica1, g.ica2, g.ica3);
      
      const theoryExamQs = [
        Number(g.q1) || 0, Number(g.q2) || 0, Number(g.q3) || 0, 
        Number(g.q4) || 0, Number(g.q5) || 0
      ].sort((a, b) => b - a);
      const theoryExamAvg = (theoryExamQs.slice(0, 4).reduce((a, b) => a + b, 0)) / 4;

      const theoryTotal = (theoryIcaAvg * 0.30) + (theoryExamAvg * 0.70);

      let finalScore = theoryTotal;

      if (g.subjectType === "Theory + Practical") {
          const pracIcaAvg = getBest2Avg(g.prac_ica1, g.prac_ica2, g.prac_ica3);
          const pracExam = Number(g.prac_exam_marks) || 0;
          
          const pracTotal = (pracIcaAvg * 0.40) + (pracExam * 0.60);

          finalScore = (theoryTotal + pracTotal) / 2;
      }

      const total = Math.round(finalScore);

      if (total >= 80) return "A+";
      if (total >= 75) return "A";
      if (total >= 70) return "A-";
      if (total >= 65) return "B+";
      if (total >= 60) return "B";
      if (total >= 55) return "B-";
      if (total >= 50) return "C+";
      if (total >= 45) return "C";
      if (total >= 40) return "C-";
      if (total >= 35) return "D+";
      if (total >= 30) return "D";
      return "E";
    };

    const results = grades.map(g => {
      const finalGrade = calculateAutoGrade(g);
      return {
        courseCode: g.courseCode,
        name: g.courseName,
        level: g.level,
        semester: g.semester,
        grade: finalGrade,
        gradePoint: gradeToGPA[finalGrade] || 0,
        ica1: g.ica1, ica2: g.ica2, ica3: g.ica3,
        q1: g.q1, q2: g.q2, q3: g.q3, q4: g.q4, q5: g.q5
      };
    });

    res.status(200).json({ success: true, count: results.length, results });

  } catch (error) {
    console.error("❌ Error fetching student results:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
