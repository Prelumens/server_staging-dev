import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = Schema;

const adminSchema = new Schema(
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
        isActive: {
            type: Boolean,
            default: true
        },
    },
    { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
