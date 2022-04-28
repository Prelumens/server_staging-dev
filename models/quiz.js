import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;
const optionSchema = new mongoose.Schema(
    {
      text: {
        type: String,
      },
     isCorrect: {
        type: Boolean,
        required: true,
      },
      image: {}
    },
  );


  const questionSchema = new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
      },
      optionType: {
        type: String
      },
      options: [optionSchema],
      correctAnswer: {},
      image: {}
    },
    { timestamps: true }
);
const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 320,
      required: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    deadline: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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
    questions: [questionSchema],
    access: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Quiz", quizSchema);
