export function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(otp);
    
   return otp
}

export function generateOTPHtml(otp) {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">  
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .container {
                background-color: #fff;
                padding: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>OTP Verification</h2>
            <p>Your OTP is: <strong>${otp}</strong></p>
        </div>
    </body>
    </html>`;
}


// export function generateOTP() {
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     console.log(otp);
    
//    return otp
// }

// export function generateOTPHtml(otp) {
//     return `<!DOCTYPE html>
//     <html>
//     <head>
//         <meta charset="UTF-8">  
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>OTP Verification</title>
//         <style>
//             body {
//                 font-family: Arial, sans-serif;
//                 background-color: #f4f4f4;
//                 display: flex;
//                 justify-content: center;
//                 align-items: center;
//                 height: 100vh;
//                 margin: 0;
//             }
//             .container {
//                 background-color: #fff;
//                 padding: 20px;
//             }
//         </style>
//     </head>
//     <body>
//         <div class="container">
//             <h2>OTP Verification</h2>
//             <p>Your OTP is: <strong>${otp}</strong></p>
//         </div>
//     </body>
//     </html>`;
// }