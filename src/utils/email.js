import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }
    return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = getTransporter();

        const mailOptions = {
            from: `"QPaperVault" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email sending failed");
    }
};
