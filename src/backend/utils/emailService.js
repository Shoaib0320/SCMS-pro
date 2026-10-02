import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import config from "../config/index.js";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: config.email.auth,
});

export const sendEmail = async (to, subject, html, attachments = []) => {
  const finalAttachments = Array.isArray(attachments) ? [...attachments] : [];

  if (html && html.includes("cid:scms-logo") && !finalAttachments.some((a) => a.cid === "scms-logo")) {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      finalAttachments.push({
        filename: "logo.png",
        path: logoPath,
        cid: "scms-logo",
      });
    }
  }

  const mailOptions = {
    from: config.email.from,
    to,
    subject,
    html,
  };

  if (finalAttachments.length > 0) {
    mailOptions.attachments = finalAttachments;
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
  return info;
};
