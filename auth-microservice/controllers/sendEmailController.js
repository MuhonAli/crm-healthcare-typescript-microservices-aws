import sendGridMail from "@sendgrid/mail";
import dotEnv from "dotenv";
dotEnv.config(); // allow .env file to load
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

// send email with reset Password Token
export const sendEmailWithResetPasswordToken = async (
  frontendUrl,
  recipientEmail,
  recipientName
) => {
  const msg = {
    to: {
      email: recipientEmail,
      name: recipientName,
    },
    from: {
      email: process.env.FROM_EMAIL_ADDRESS,
      name: process.env.FROM_EMAIL_NAME,
    },
    subject: "Calystapro Password Reset Request",
    content: [
      {
        type: "text/html",
        value: `<p>Dear ${recipientName}</p></br></br>
        <p>This email is to confirm that you have requested a password reset for your Calystapro account.</p></br>
        <p>Please click on the following link to reset your password:</p></br>
        <a href="${frontendUrl}" target="_blank" aria-lebel="reset password link for calystapro account">Click Here</a></br></br>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Please note that if you do not reset your password within next 15 minutes, the link will expire and you will need to request a new password reset.</p></br>
        <p>If you have any questions or need assistance, please do not hesitate to contact Calystapro support at <a href="mailto:${process.env.SUPPORT_EMAIL_ADDRESS}" target="_blank" aria-lebel="Support Email address">${process.env.SUPPORT_EMAIL_ADDRESS}</a>.</p></br>
        <p>Thank you for using Calystapro.</p></br>
        <p>Sincerely,</p></br>
        <p>The Calystapro Team</p></br>
        `,
      },
    ],
  };
  try {
    await sendGridMail.send(msg);
    return true;
  } catch (err) {
    console.log("Error from sendEmailWithResetPasswordToken: ", err);
    return false;
  }
};
