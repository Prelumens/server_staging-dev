import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const assignmentSchema = new mongoose.Schema(
  {
    title: {
        type: String,
        trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: {},
      minlength: 200,
      required: true,
    },
    course: {
      type: ObjectId,
      ref: "Course",
    },
    instructor: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    access: {
        type: Boolean,
        default: false,
    },
    deadline: {
      type: Date,
      required: true,
    },
    submissions:  [
        { type: ObjectId, ref: "Student" },
        { timestamps: true }
    ],
    attachment: [],
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
