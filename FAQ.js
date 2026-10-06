import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      maxlength: 500
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      maxlength: 5000
    },
    category: {
      type: String,
      trim: true,
      default: "General",
      maxlength: 100
    },
    tags: {
      type: [String],
      default: []
    },
    embedding: {
      type: [Number],
      default: [],
      select: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

faqSchema.index({ question: "text", answer: "text", category: "text", tags: "text" });

export default mongoose.model("FAQ", faqSchema);
