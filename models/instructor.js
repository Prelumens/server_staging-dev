
import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = Schema;

const instructorSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
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
    picture: {},
    image: {},
    role: {
        type: String,
        default: "Instructor",
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
    birthDate: {
        type: String,
        required: true,
    },
    gender: {
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
    isActive: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true
})

export default mongoose.model("Instructor", instructorSchema);