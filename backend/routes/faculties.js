const express = require("express");
const router = express.Router();
const Faculty = require("../models/Faculty");

router.get("/", async (req, res) => {
  try {
    const list = await Faculty.find({});
    res.json({ success: true, faculties: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
