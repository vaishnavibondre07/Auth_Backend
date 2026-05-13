import User from "../models/user.models.js";

export async function getProfile(req, res){
    try {
        const user = await User.findById(req.user.id).select("-password");

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}



// import User from "../models/user.models.js";

// export async function getProfile(req, res){
//     try {
//         const user = await User.findById(req.user.id).select("-password");

//         if(!user){
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             data: user
//         });

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// }