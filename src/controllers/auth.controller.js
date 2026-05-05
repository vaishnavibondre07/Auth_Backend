import User from "../models/user.models.js";
import crypto from "crypto";

export async function registerUser(req,res){

    try{

        const {username,email,password} = req.body;

    console.log(req.body);

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

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

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