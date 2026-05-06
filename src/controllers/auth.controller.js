import User from "../models/user.models.js";
import bcrypt from "bcrypt";
import config from "../config/config.js";
import jwt from "jsonwebtoken";
import Session from "../models/session.model.js";

export async function registerUser(req,res){

        const {username,email,password} = req.body;

        console.log(req.body);

        if(!username || !email || !password){
           return res.status(400).json({
                                  success: false,
                                  message: "All fields are required"
                             });
                           }

     const isAlreadyRegistered = await User.findOne({
        $or : [
            {username : username},
            {email : email}
        ]
     })

     if(isAlreadyRegistered){
        return res.status(400).json({
            success : false,
            message : "Username or email already exists"
        })
     }

    //  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
     const hashedPassword = await bcrypt.hash(password, 10);

     const user = await User.create({
        username,
        email,
        password : hashedPassword
     })

     const session = await Session.create({
        user : user._id,
        refreshToken : " ",
        ip : req.ip,
        userAgent : req.headers["user-agent"]
      })

      const refreshToken = jwt.sign({
        id : user._id,
        sessionId : session._id
     }, config.JWT_SECRET, {expiresIn : "7d"});

     const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

     session.refreshToken = hashedRefreshToken;
     await session.save();

     const accesstoken = jwt.sign({
        id : user._id,
        sessionId : session._id
     }, config.JWT_SECRET, {expiresIn : "1m"});

    
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax", 
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })

     return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          username: user.username,
          email: user.email
        },
        token: accesstoken,
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

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        username: user.username,
        email: user.email,
      },
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

     const accessToken = jwt.sign({
        id : user._id,
        sessionId : session._id
      }, config.JWT_SECRET, {expiresIn : "1m"});

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