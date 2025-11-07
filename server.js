const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./usermodel");
const Feedback = require("./feedbackmodel");

const app = express();
const allowedOrigins = [
  "http://localhost:5175", 
  "https://fullstackfeedbackapplication.onrender.com" 

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection failed:", err));
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: "Signup successful!", user: { _id: newUser._id, name, email, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during signup" });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: "Invalid password" });

    res.status(200).json({ message: "Login successful!", user: { _id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});
app.post("/api/data", async (req, res) => {
  try {
    const { name, feedback, comment, userId } = req.body;
    const newFeedback = new Feedback({ name, feedback, comment, userId });
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
    res.status(500).json({ message: "Error fetching feedbacks" });
  }
});
app.put("/api/data/:id", async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });

    if (fb.userId.toString() !== req.body.userId) {
      return res.status(403).json({ message: "You can only edit your own feedback" });
    }

    const { name, feedback, comment } = req.body;
    fb.name = name;
    fb.feedback = feedback;
    fb.comment = comment;
    await fb.save();

    res.json({ message: "Feedback updated!", data: fb });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating feedback" });
  }
});
app.delete("/api/data/:id", async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });

    const user = await User.findById(req.body.userId);
    if (user.role !== "admin" && fb.userId.toString() !== req.body.userId) {
      return res.status(403).json({ message: "You can't delete this feedback" });
    }

    await fb.deleteOne();
    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting feedback" });
  }
});
app.put("/api/data/:id/reply", async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });

    const user = await User.findById(req.body.userId);
    if (user.role !== "admin") return res.status(403).json({ message: "Only admin can reply" });

    fb.reply = req.body.reply;
    await fb.save();
    res.json({ message: "Reply saved!", data: fb });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving reply" });
  }
});
const PORT = process.env.PORT || 4500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

