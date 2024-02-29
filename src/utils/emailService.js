import nodemailer from 'nodemailer'

// Create a Nodemailer transporter object
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS
    }
});


async function sendOTP(email, otp) {
    try {

        const mailOptions = {
            from: 'girgaonkar.chaitanya@gmail.com',
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP for registration is: ${otp}`
        };


        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
}

export { sendOTP }