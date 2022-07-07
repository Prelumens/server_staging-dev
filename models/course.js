import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true,
    },
    notificationType: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);


const lessonSchema = new mongoose.Schema(
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
    content: {
      type: {},
      minlength: 200,
    },
    video: {},
    wikis: [],
  },
  { timestamps: true }
);

const courseFeedbacksSchema = new mongoose.Schema(
  {
    student: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    criterionOne: {
      type: Number,
      required: true,
    },
    criterionTwo: {
      type: Number,
      required: true,
    },
    criterionThree: {
      type: Number,
      required: true,
    },
    overallExperience: {
      type: String,
      required: true,
    },
    comment: {
      type: {},
      minlength: 200,
    },
  },
  { timestamps: true }
);
const courseSchema = new mongoose.Schema(
  {
    name: {
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
    description: {
      type: {},
      minlength: 200,
      required: true,
    },
    image: {},
    category: String,
    published: {
      type: Boolean,
      default: false,
    },
    instructor: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    enrollmentKey: {
      type: String,
      uppercase: true,
      required: true
    },
    lessons: [lessonSchema],
    notifications: [notificationSchema],
    courseFeedbacks:[courseFeedbacksSchema],
    progress: {
      type: Number
    }
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
