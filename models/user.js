import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = Schema;

const userSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
        },
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
        picture: {},
        role: {
            type: [String],
            default: ["Student"],
            enum: ["Student", "Instructor", "Admin"],
        },
        passwordResetCode: {
            data: String,
            default: "",
        },
        courses: [{ type: ObjectId, ref: "Course" }],
        agreedToTermsAndCondition: {
            type: Boolean,
            default: false,
        },
        parentMode: {
            type: Boolean,
            default: true
        },
        guardian: {
            type: String,
        },
        screenTimeout: {
            type: Number,
            default: 7200000
            //default of 2 hours
        },
        screenTimeoutEnabled: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
