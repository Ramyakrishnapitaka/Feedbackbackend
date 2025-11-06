const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./usermodel");
const Feedback = require("./feedbackmodel");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
mongoose
  .connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB connection failed:", err));
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Signup successful!", user: { name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during signup" });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found. Please sign up." });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: "Invalid password" });

    res.status(200).json({ message: "Login successful!", user: { name: user.name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});
app.post("/api/data", async (req, res) => {
  try {
    const { name, feedback, comment } = req.body;
    const newFeedback = new Feedback({ name, feedback, comment });
    await newFeedback.save();
    res.status(201).json({ message: "Feedback saved!", data: newFeedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving feedback" });
  }
});
app.get("/api/data", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching feedback" });
  }
});
app.put("/api/data/:id", async (req, res) => {
  try {
    const { name, feedback, comment } = req.body;
    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { name, feedback, comment },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Feedback not found" });

    res.json({ message: "Feedback updated!", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating feedback" });
  }
});
app.delete("/api/data/:id", async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting feedback" });
  }
});
app.put("/api/data/:id/reply", async (req, res) => {
  try {
    const { reply } = req.body;
    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { reply },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Feedback not found" });

    res.json({ message: "Reply saved!", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving reply" });
  }
});
const PORT = process.env.PORT || 4500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
