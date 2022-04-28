import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const questionSchema = new mongoose.Schema(
  {
    titleField: {
      type: String,
    },
    type: {
      type: String,
    },
    choices:[
      {
        text: String,
        image: {}
      }
    ],
    correctAnswer: {
      type: String,
    },
  },
  { timestamps: true }
);
const interactiveSchema = new mongoose.Schema(
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
    instructions:[],
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
    questions: [questionSchema],
    submissions:  [
        { type: ObjectId, ref: "Student" },
        { timestamps: true }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Interactive", interactiveSchema);
