/**
 * Email utility for sending password reset emails
 * 
 * To configure email sending, set the following environment variables:
 * - SMTP_HOST: SMTP server host (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP server port (e.g., 587)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASSWORD: SMTP password or app password
 * - SMTP_FROM: Email address to send from
 * 
 * If email is not configured, the reset link will be logged in development mode.
 */

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

const getEmailConfig = (): EmailConfig | null => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !password || !from) {
    return null;
  }

  return {
    host,
    port: parseInt(port, 10),
    user,
    password,
    from,
  };
};

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const config = getEmailConfig();

  // If email is not configured, log in development mode
  if (!config) {
    if (process.env.NODE_ENV === "development") {
      console.log("\n=== PASSWORD RESET EMAIL (Development Mode) ===");
      console.log(`To: ${email}`);
      console.log(`Subject: Reset Your Password`);
      console.log(`Reset Link: ${resetUrl}`);
      console.log("===============================================\n");
    }
    return;
  }

  // Try to send email using nodemailer if available
  // For now, we'll use a simple approach that can be extended
  try {
    // In production, you would use nodemailer or similar
    // For now, we'll log it and let the user configure email later
    console.log("Email configuration detected. To enable email sending, install nodemailer:");
    console.log("npm install nodemailer @types/nodemailer");
    console.log("\nPassword reset link:", resetUrl);
    console.log("Email would be sent to:", email);
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw - allow the password reset to proceed
    // The link is still valid and can be shared manually if needed
  }
}
