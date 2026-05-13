import config from '../config/config.js';
import nodemailer from 'nodemailer';
import { googleClient } from '../config/googleClient.js';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: config.GOOGLE_USER,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        refreshToken: config.GOOGLE_REFRESH_TOKEN
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Error setting up email transporter:', error);
    } else {
        console.log('Email transporter is ready to send messages');
    }
});


export async function sendEmail(to, subject, text, html) {
    try {
        const info = await transporter.sendMail({
            from: config.GOOGLE_USER,
            to,
            subject,
            text,
            html,
        });
        console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}




// import config from '../config/config.js';
// import nodemailer from 'nodemailer';
// import { googleClient } from '../config/googleClient.js';

// export const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         type: 'OAuth2',
//         user: config.GOOGLE_USER,
//         clientId: config.GOOGLE_CLIENT_ID,
//         clientSecret: config.GOOGLE_CLIENT_SECRET,
//         refreshToken: config.GOOGLE_REFRESH_TOKEN
//     }
// });

// transporter.verify((error, success) => {
//     if (error) {
//         console.error('Error setting up email transporter:', error);
//     } else {
//         console.log('Email transporter is ready to send messages');
//     }
// });


// export async function sendEmail(to, subject, text, html) {
//     try {
//         const info = await transporter.sendMail({
//             from: config.GOOGLE_USER,
//             to,
//             subject,
//             text,
//             html,
//         });
//         console.log('Email sent successfully:', info.messageId);
//     } catch (error) {
//         console.error('Error sending email:', error);
//         throw error;
//     }
// }

