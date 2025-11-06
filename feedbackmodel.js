const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    feedback: { type: String, required: true },
    comment: { type: String, required: false },
    reply: { type: String, required: false, default: "" }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
