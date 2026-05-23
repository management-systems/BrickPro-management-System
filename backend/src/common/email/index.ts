import nodemailer from 'nodemailer';
import { config } from '../../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"Management Systems" <${config.smtp.from}>`,
    to,
    subject: 'Your OTP - BrickPro',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;">
        <h2 style="color:#333;text-align:center;">BrickPro Verification</h2>
        <p style="color:#555;">Your OTP is:</p>
        <div style="background:#f5f5f5;padding:15px;text-align:center;border-radius:8px;margin:20px 0;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a73e8;">${otp}</span>
        </div>
        <p style="color:#888;font-size:12px;">This OTP expires in ${config.otpExpiryMinutes} minutes. Do not share with anyone.</p>
      </div>
    `,
  });
}
