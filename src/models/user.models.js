import mongoose from "mongoose";

const userSchema = mongoose.Schema({

    username : {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username must be unique"]
    },

    email : {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email must be unique"]
    },

    password: {
      type: String,

      required: function () {
        return !this.googleId;
     }
    },

    verified : {
        type: Boolean,
        default: false
    },

     googleId : {
        type: String,
        default: null
    },

    failedAttempts : {
        type: Number,
        default: 0
    },

    lockUntil : {
        type: Date,
        default: null
    }

})

const User = mongoose.model("User", userSchema)

export default User;



// import mongoose from "mongoose";

// const userSchema = mongoose.Schema({

//     username : {
//         type: String,
//         required: [true, "Username is required"],
//         unique: [true, "Username must be unique"]
//     },

//     email : {
//         type: String,
//         required: [true, "Email is required"],
//         unique: [true, "Email must be unique"]
//     },

//     password: {
//       type: String,

//       required: function () {
//         return !this.googleId;
//      }
//     },

//     verified : {
//         type: Boolean,
//         default: false
//     },

//      googleId : {
//         type: String,
//         default: null
//     },

//     failedAttempts : {
//         type: Number,
//         default: 0
//     },

//     lockUntil : {
//         type: Date,
//         default: null
//     }

// })

// const User = mongoose.model("User", userSchema)

// export default User;
