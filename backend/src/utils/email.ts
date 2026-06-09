import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const verifyEmailDomain = async (email: string): Promise<boolean> => {
  const domain = email.split('@')[1];
  if (!domain) return false;
  
  // First check domain suffix
  if (!email.endsWith('@edu-darom.org.il')) return false;
  
  // Then check MX records exist for domain
  try {
    const mxRecords = await resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch {
    // If DNS lookup fails, still allow if domain matches (offline development)
    return process.env.NODE_ENV === 'development';
  }
};

export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
  
  await transporter.sendMail({
    from: `"טכנולוגי ב.ש. - רשת חברתית" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '✅ אמת את כתובת המייל שלך | Verify your email',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; background: #f0f4f8; }
          .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
          .body { padding: 32px; }
          .btn { display: block; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; text-align: center; font-size: 16px; font-weight: bold; margin: 24px 0; }
          .footer { background: #f8fafc; padding: 16px 32px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏫 טכנולוגי ב.ש.</h1>
            <p>הרשת החברתית של תלמידינו</p>
          </div>
          <div class="body">
            <h2>שלום ${firstName}! 👋</h2>
            <p>תודה שנרשמת לרשת החברתית של הטכנולוגי באר שבע.</p>
            <p>לחץ על הכפתור למטה כדי לאמת את כתובת המייל שלך:</p>
            <a href="${verificationUrl}" class="btn">✉️ אמת את המייל שלי</a>
            <p style="color:#64748b;font-size:13px;">הקישור תקף ל-24 שעות. אם לא נרשמת, התעלם מהמייל הזה.</p>
          </div>
          <div class="footer">
            <p>⚠️ אתר זה נוצר על ידי תלמידים ואינו משויך רשמית לטכני באר שבע</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: `"טכנולוגי ב.ש. - רשת חברתית" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🔐 איפוס סיסמה | Password Reset',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>שלום ${firstName}</h2>
        <p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
        <a href="${resetUrl}" style="background:#1e3a8a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">
          🔐 אפס סיסמה
        </a>
        <p style="color:#64748b;font-size:13px;">הקישור תקף ל-1 שעה.</p>
      </div>
    `,
  });
};
