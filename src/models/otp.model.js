import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [ true, "Email is required" ]
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [ true, "User is required" ]
    },

    otpHash: {
        type: String,
        required: [ true, "OTP hash is required" ]
    },

    resendCount : {
        type: Number,
        default: 0
    },

    expiresAt : {
        type: Date,
        required: [ true, "Expiration time is required" ]
    },

    blockedUntil : Date,

    lastOtpSentAt : {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
})

const otpModel = mongoose.model("otps", otpSchema)

export default otpModel;
