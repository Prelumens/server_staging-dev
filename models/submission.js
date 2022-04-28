import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;


const submissionSchema = new mongoose.Schema(
  {
    student: {
        type: ObjectId,
        ref: "User",
        required: true,
    },
    grade: {
        type: String,
        trim: true,
    },
    content: {},
    submissionDate: {
        type: String,
        required: true,
    },
    itemType: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    todo: {
        type: ObjectId,
        required: true
    },
    course: {
      type: ObjectId,
      ref: "Course",
      required: true
    },
    return: {
        type: Boolean,
        default: false,
    },
  },
  { timestamps: true },

);

export default mongoose.model("Submission", submissionSchema);
