import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtExpiry: 86400,
  refreshExpiry: 2592000,
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'brickpro-uploads',
  },
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5'),
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER || 'admin@managementsystems.in',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'admin@managementsystems.in',
  },
};
