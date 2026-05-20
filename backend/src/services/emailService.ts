import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import {} from '../config/env';
import { appConfig } from '../config/app.config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Get base URL from environment or use default
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const emailConfig = {
        enabled: process.env.EMAIL_ENABLED === 'true',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
        from: {
          name: process.env.EMAIL_FROM_NAME || 'RideFlow',
          email: process.env.EMAIL_FROM_EMAIL || 'noreply@rideflow.com',
        },
      };
      
      if (!emailConfig.enabled) {
        logger.warn('Email service not configured - emails will be logged instead');
        return;
      }

      if (!emailConfig.user || !emailConfig.pass) {
        logger.warn('Email credentials not configured - emails will be logged instead');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.port === 465,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      });

      // Verify connection
      await this.transporter.verify();
      this.isConfigured = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (!this.isConfigured || !this.transporter) {
        // Log email instead of sending if not configured
        logger.info('Email would be sent:', {
          to: options.to,
          subject: options.subject,
          html: options.html.substring(0, 200) + '...',
        });
        return;
      }

      const fromName = process.env.EMAIL_FROM_NAME || 'RideFlow';
      const fromEmail = process.env.EMAIL_FROM_EMAIL || 'noreply@rideflow.com';
      
      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to: ${options.to}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendEmailVerification(email: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${APP_BASE_URL}/verify-email?token=${token}`;
    
    const businessName = (appConfig as any)?.businessName || 'RideFlow';
    const primaryColor = (appConfig as any)?.brandColors?.primary || '#4F46E5';
    const contactEmail = (appConfig as any)?.contactEmail || 'support@rideflow.com';
    const contactPhone = (appConfig as any)?.contactPhone || '+91 1234567890';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: ${primaryColor}; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${businessName}</div>
          </div>
          
          <h2>Welcome to ${businessName}!</h2>
          
          <p>Hi ${name},</p>
          
          <p>Thank you for registering with ${businessName}. To complete your registration and start booking bikes, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <p>If you didn't create an account with us, please ignore this email.</p>
          
          <div class="footer">
            <p>Best regards,<br>The ${businessName} Team</p>
            <p>Contact us: ${contactEmail} | ${contactPhone}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Verify your email - ${businessName}`,
      html,
      text: `Hi ${name}, please verify your email by visiting: ${verificationUrl}`,
    });
  }

  async sendPasswordReset(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${APP_BASE_URL}/reset-password?token=${token}`;
    
    const businessName = (appConfig as any)?.businessName || 'RideFlow';
    const primaryColor = (appConfig as any)?.brandColors?.primary || '#4F46E5';
    const contactEmail = (appConfig as any)?.contactEmail || 'support@rideflow.com';
    const contactPhone = (appConfig as any)?.contactPhone || '+91 1234567890';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: ${primaryColor}; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${businessName}</div>
          </div>
          
          <h2>Password Reset Request</h2>
          
          <p>Hi ${name},</p>
          
          <p>We received a request to reset your password for your ${businessName} account. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          
          <div class="warning">
            <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
          </div>
          
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <div class="footer">
            <p>Best regards,<br>The ${businessName} Team</p>
            <p>Contact us: ${contactEmail} | ${contactPhone}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Password Reset - ${businessName}`,
      html,
      text: `Hi ${name}, reset your password by visiting: ${resetUrl}`,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const businessName = (appConfig as any)?.businessName || 'RideFlow';
    const primaryColor = (appConfig as any)?.brandColors?.primary || '#4F46E5';
    const contactEmail = (appConfig as any)?.contactEmail || 'support@rideflow.com';
    const contactPhone = (appConfig as any)?.contactPhone || '+91 1234567890';
    const businessDescription = (appConfig as any)?.businessDescription || 'Your trusted bike rental platform';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${businessName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: ${primaryColor}; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${businessName}</div>
          </div>
          
          <h2>Welcome to ${businessName}!</h2>
          
          <p>Hi ${name},</p>
          
          <p>Welcome to ${businessName}! We're excited to have you join our community of eco-friendly riders.</p>
          
          <p>${businessDescription}</p>
          
          <div style="text-align: center;">
            <a href="${APP_BASE_URL}" class="button">Start Exploring Bikes</a>
          </div>
          
          <p>Here's what you can do with your account:</p>
          <ul>
            <li>Browse available bikes at nearby stations</li>
            <li>Book bikes for hourly or daily rentals</li>
            <li>Track your booking history</li>
            <li>Leave reviews for bikes you've rented</li>
          </ul>
          
          <p>If you have any questions, feel free to contact our support team.</p>
          
          <div class="footer">
            <p>Happy riding!<br>The ${businessName} Team</p>
            <p>Contact us: ${contactEmail} | ${contactPhone}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Welcome to ${businessName}!`,
      html,
      text: `Welcome to ${businessName}! Start exploring bikes at ${APP_BASE_URL}`,
    });
  }
}

export const emailService = new EmailService();