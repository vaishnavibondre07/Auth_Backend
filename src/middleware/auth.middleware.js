import config  from "../config/config.js";
import jwt from "jsonwebtoken";
import Session from "../models/session.model.js";

export async function authMiddleware(req,res,next){
    try{

        console.log("SECRET:", config.JWT_SECRET);

        const authHeader = req.headers.authorization;

        // console.log(authHeader);

        console.log("HEADERS:", req.headers);
        console.log("AUTH HEADER:", req.headers.authorization);
        
        if(!authHeader || !authHeader.startsWith("Bearer ")){

            return res.status(401).json({
                success: false,
                message: "Access token missing"
            });

        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, config.JWT_SECRET);

        console.log(decoded);

        const session = await Session.findById(decoded.sessionId);

        console.log(decoded.sessionId);
        console.log(session);

        if(!session || session.revoked){
            return res.status(401).json({
                success: false,
                message: "Invalid session"
            });
        }

        req.user = decoded;

        next();
    }  catch(error) {

        return res.status(401).json({
            success: false,
            message:"Invalid or expired token"
        });
    }
}