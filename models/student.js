
import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = Schema;

const assignmentSchema = new mongoose.Schema(
    {
        asssignmentId: {
            type: ObjectId,
            ref: "Assignment",
        },
        file: [],
        submissionDate: {
            type: String,
            required: true
        },
        status: {
            type: String,
        },
        grade: {
            type: String,
        }
    },
    { timestamps: true }
);
const attemptedQuizSchema = new mongoose.Schema(
    {
        quizId: {
            type: ObjectId,
            ref: "Quiz",
        },
        submittedQuiz: [],
        title: {
            type: String,
            required: true
        },
        submissionDate: {
            type: String,
            required: true
        },
        submittedQuiz: [],
        status: {
            type: String,
            default: "Unattempted",
        },
        score: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

const studentActivitySchema = new mongoose.Schema(
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
        studentActivityType: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

const studentSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 64,
    },
    image: {

    },
    role: {
        type: String,
        default: "Student",
    },
    fullName: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    middleName: {
        type: String,
    },
    lastName: {
        type: String,
        required: true,
    },
    studentNum: {
        type: String,
    },
    birthDate: {
        type: String,
    },
    picture: {},
    gender: {
        type: String,
        required: true,
    },
    guardian: {
        type: String,
        required: true,
    },
    contact: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    attemptedQuiz: [attemptedQuizSchema],
    assignmentSubmitted: [assignmentSchema],
    studentActivity: [studentActivitySchema],
    isActive: {
        type: Boolean,
        default: true
    },
    level: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
})

export default mongoose.model("Student", studentSchema);