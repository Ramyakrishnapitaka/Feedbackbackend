const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  feedback: { type: String, required: true },
  comment: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reply: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
