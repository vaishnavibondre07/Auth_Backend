import User from "../models/user.models.js";
import bcrypt from "bcrypt";

export async function registerUser(req,res){

    try{

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

     return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          username: user.username,
          email: user.email
        }
      });

    } catch(error){

        return res.status(500).json({
            success : false,
            message : "Internal Server Error"
        })
    }
}


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