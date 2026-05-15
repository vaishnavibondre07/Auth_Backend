import User from "../models/user.models.js";
import bcrypt from "bcrypt";
import config from "../config/config.js";
import jwt from "jsonwebtoken";
import Session from "../models/session.model.js";
import { googleClient } from "../config/googleClient.js";
import { sendEmail } from "../services/email.service.js";
import {generateOTP, generateOTPHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";
import userModel from "../models/user.models.js";



const createSession = async (userId, req) => {
    const session = await Session.create({
        user : userId,
        refreshToken : " ",
        ip : req.ip,
        userAgent : req.headers["user-agent"]
      })

      const refreshToken = jwt.sign({
        id : userId,
        sessionId : session._id
     }, config.JWT_SECRET, {expiresIn : "7d"});

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10); 
      session.refreshToken = hashedRefreshToken;
      await session.save();

      return {
        refreshToken,
        sessionId : session._id
    };
}

function generateAccessToken(userId, sessionId){
    return jwt.sign({
        id : userId,
        sessionId : sessionId
    }, config.JWT_SECRET, {expiresIn : "15m"});
}


export async function registerUser(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const isAlreadyRegistered = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (isAlreadyRegistered) {
        return res.status(400).json({
            success: false,
            message: "Username or email already exists"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();

     const user = await User.create({
        username,
        email,
        password: hashedPassword,
        verified: false   // IMPORTANT
    });

    await sendEmail(
        email,
        "Verify your email",
        "",
        generateOTPHtml(otp)
    );

    // Generate OTP
    const otpHash = await bcrypt.hash(otp.toString(), 10);
    
    await otpModel.create({
        email,
        user: user._id,
        otpHash,
        expiresAt: new Date(Date.now() + 30 * 1000)
    });


    return res.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        data: {
            username: user.username,
            email: user.email,
            verified: user.verified
        }
    });
}

// ********************************************* LOGIN ***************************************************

export async function loginUser(req, res) {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Unlock account automatically after lock expires
    if (user.lockUntil && user.lockUntil < Date.now()) {
      user.lockUntil = null;
      user.failedAttempts = 0;
      await user.save();
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {

      const remainingTime = Math.ceil(
        (user.lockUntil - Date.now()) / 1000
      );

      return res.status(400).json({
        success: false,
        message: `Account is locked. Try again in ${remainingTime} seconds`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // Wrong password
    if (!isMatch) {

      user.failedAttempts += 1;

      const remainingAttempts = 5 - user.failedAttempts;

      // Lock account after 5 attempts
      if (user.failedAttempts >= 5) {

        user.lockUntil = Date.now() + 1 * 60 * 1000; // 1 minute
        user.failedAttempts = 0;

        await user.save();

        return res.status(400).json({
          success: false,
          message: "Account locked for 1 minute due to too many failed attempts",
        });
      }

      await user.save();

      return res.status(400).json({
        success: false,
        message: `Invalid email or password. ${remainingAttempts} attempts remaining`,
      });
    }

    // Successful login
    // user.failedAttempts = 0;
    // user.lockUntil = null;

    // await user.save();

    const sessionData = await createSession(user._id, req);

    const accessToken = generateAccessToken(
      user._id,
      sessionData.sessionId
    );

    res.cookie("refreshToken", sessionData.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        username: user.username,
        email: user.email,
      },
      token: accessToken,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
// ********************************************* REFRESH TOKEN ***************************************************

export async function refreshToken(req, res){
  try {

    const refreshToken = req.cookies.refreshToken;
    // const refreshToken = req.body

    if(!refreshToken){
      return res.status(401).json({
        success : false,
        message : "Refresh token not found"
      })
    }

    const decode = jwt.verify(refreshToken, config.JWT_SECRET);

    const session = await Session.findById(decode.session.id);

    if(!session || session.revoked){
      return res.status(401).json({
        success : false,
        message : "Invalid session"
      })
    }

    const user = await User.findById(decode.id);

    if(!user){
        return res.status(401).json({
          success : false,
          message : "User not found"
        })
      }

    const accessToken = generateAccessToken(user._id, session._id);

    res.status(200).json({
      success : true,
      message : "Access token refreshed successfully",
      token : accessToken
    })


  } catch (error) {
     return res.status(401).json({
         success : false,
         message : "Invalid refresh token"
     })
  }
}

// ********************************************* Logout ***************************************************

export async function logoutUser(req,res){

    const refreshToken = req.cookies.refreshToken;

    console.log(refreshToken);
    
    if(!refreshToken){
      return res.status(401).json({
        success: false,
        message: "Refresh token not found"
      });
    }

    const decode = jwt.verify(refreshToken, config.JWT_SECRET);

    const session = await Session.findById(decode.sessionId);

    if(!session){
      return res.status(401).json({
        success : false,
        message : "Invalid refresh token"
      })
    }

    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken")

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });

}

// ******************************************* Logout All *************************************************

export async function logoutAll(req, res){

  const refreshToken = req.cookies.refreshToken;

  if(!refreshToken){
    return res.status(401).json({
      success : false,
      message : "Refresh token not found"
     })

  }


    const decode = jwt.verify(refreshToken, config.JWT_SECRET);

    const sessions = await Session.updateMany({user : decode.id, revoked : false}, {revoked : true});

    res.clearCookie("refreshToken");

    return res.status(200).json({
      success : true,
      message : "Logged out from all devices successfully"
     })
}

// ******************************************* Google Login *************************************************

export async function googleLogin(req, res){
  try {
    const { token } = req.body;

    if(!token){
      return res.status(400).json({
        success : false,
        message : "Google token is required"
       })
    }

  // Verify the token with Google
  const ticket = await googleClient.verifyIdToken({
    idToken : token,
    audience : config.GOOGLE_CLIENT_ID,
  });

  // after verification google sends obj ticket which contains user info in payload

  const payload = ticket.getPayload();

  const email = payload.email;
  const name = payload.name;
  const googleId = payload.sub;   // Google's unique permanent ID for user.

  let user = await User.findOne({email});

  if(!user){
    user = await User.create({
      username : name,
      email,
      googleId,
      password: null
    });
  }

  const sessionData = await createSession(user._id, req);

  const accessToken = generateAccessToken(user._id, sessionData.sessionId);

  res.cookie("refreshToken", sessionData.refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  return res.status(200).json({
    success : true,
    message : "Login with Google successful",
    data : {
      username : user.username,
      email : user.email
    },
    token : accessToken
  });

} catch (error) {
    console.log(error);
    return res.status(500).json({
      success : false,
      message : "Internal server error"
     })
  }

}

// ******************************************* Verify Email *************************************************

// export async function verifyEmail(req, res) {

//   try {

//     const { email, otp } = req.body;

//     const otpDoc = await otpModel.findOne({ email });

//     if (!otpDoc) {
//         return res.status(400).json({ message: "Invalid OTP" });
//     }

//     if (otpDoc.expiresAt < new Date()) {

//       await otpModel.deleteMany({email});
//         return res.status(400).json({
//                message: "OTP expired"
//       });
//    }

//     const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);

//     if (!isMatch) {
//         return res.status(400).json({ message: "Invalid OTP" });
//     }

//     const user = await userModel.findByIdAndUpdate(
//         otpDoc.user,
//         { verified: true },
//         { returnDocument: "after" }
//     );

//     if (!user) {
//         return res.status(400).json({ message: "User not found" });
//     }

//     await otpModel.deleteMany({ user: otpDoc.user });

//     const accessToken = generateAccessToken(user._id);

//     const sessionData = await createSession(user._id, req);
//     const refreshToken = sessionData.refreshToken;

//     res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: false,
//         sameSite: "lax",
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.cookie("accessToken", accessToken, {
//         httpOnly: true,
//         secure: false,
//         sameSite: "lax",
//         maxAge: 15 * 60 * 1000,
//     });

//     return res.status(200).json({
//         message: "Email verified successfully",
//         accessToken,
//         refreshToken,
//         user: {
//             username: user.username,
//             email: user.email,
//             verified: user.verified
//         }
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//         message: "Internal Server Error"
//     });
//   }
// }

   export async function verifyEmail(req, res) {

    try {

        const { email, otp } = req.body;

        const otpDoc = await otpModel.findOne({ email });

        if (!otpDoc) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        // BLOCK CHECK
        if (
            otpDoc.blockedUntil &&
            otpDoc.blockedUntil > new Date()
        ) {

            const remainingTime = Math.ceil(
                (otpDoc.blockedUntil - new Date()) / 1000
            );

            return res.status(429).json({
                message:
                    `Too many wrong attempts. Try again after ${remainingTime} sec`
            });
        }

        // OTP EXPIRY CHECK
        if (otpDoc.expiresAt < new Date()) {

            await otpModel.deleteMany({ email });

            return res.status(400).json({
                message: "OTP expired"
            });
        }

        // COMPARE OTP
        const isMatch = await bcrypt.compare(
            otp,
            otpDoc.otpHash
        );

        // WRONG OTP
        if (!isMatch) {

            otpDoc.verifyAttempts += 1;

            // BLOCK AFTER 5 ATTEMPTS
            if (otpDoc.verifyAttempts >= 5) {

                otpDoc.blockedUntil =
                    new Date(Date.now() + 2 * 60 * 1000);

                await otpDoc.save();

                return res.status(429).json({
                    message:
                        "Too many wrong OTP attempts. Blocked for 2 mins"
                });
            }

            await otpDoc.save();

            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        // RESET OR DELETE OTP
        await otpModel.deleteMany({
            user: otpDoc.user
        });

        // VERIFY USER
        const user = await userModel.findByIdAndUpdate(
            otpDoc.user,
            { verified: true },
            { returnDocument: "after" }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // TOKENS
        const accessToken =
            generateAccessToken(user._id);

        const sessionData =
            await createSession(user._id, req);

        const refreshToken =
            sessionData.refreshToken;

        // COOKIES
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Email verified successfully",

            accessToken,
            refreshToken,

            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }

}

// ******************************************* Resend OTP *************************************************

export const resendOtp = async (req, res) => {

   try {

      const { email } = req.body;

      // FIND OTP DATA
      const otpData = await otpModel.findOne({ email });

      if (!otpData) {
         return res.status(404).json({
            success: false,
            message: "OTP data not found"
         });
      }

      // CHECK IF BLOCKED
      if (
         otpData.blockedUntil &&
         otpData.blockedUntil > new Date()
      ) {

         const remainingTime = Math.ceil(
            (otpData.blockedUntil - new Date()) / 1000
         );

         return res.status(429).json({
            success: false,
            message: `Too many attempts. Try again after ${remainingTime} sec`
         });
      }

      // CHECK RESEND LIMIT
      if (otpData.resendCount >= 5) {

         otpData.blockedUntil =
            new Date(Date.now() + 2 * 60 * 1000);

         await otpData.save();

         return res.status(429).json({
            success: false,
            message: "Too many resend attempts. Account blocked for 2 minutes"
         });
      }

      // GENERATE NEW OTP
      const otp = generateOTP();

      // HASH OTP
      const hashedOtp = await bcrypt.hash(otp, 10);

      // UPDATE OTP DATA
      otpData.otpHash = hashedOtp;

      // OTP VALID FOR 30 SEC
      otpData.expiresAt =
         new Date(Date.now() + 30 * 1000);

      // INCREASE RESEND COUNT
      otpData.resendCount += 1;

      await otpData.save();

      // SEND EMAIL
      await sendEmail(
         email,
         "Resend OTP",
         generateOTPHtml(otp)
      );

      return res.status(200).json({
         success: true,
         message: "OTP resent successfully"
      });

   } catch (error) {

      console.log(error);

      return res.status(500).json({
         success: false,
         message: "Internal Server Error"
      });

   }

};