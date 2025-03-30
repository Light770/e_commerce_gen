import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

def create_email_connection():
    """Create and return an SMTP connection."""
    try:
        if settings.SMTP_HOST and settings.SMTP_PORT:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.ehlo()
            if settings.SMTP_PORT == 587:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            return server
    except Exception as e:
        logger.error(f"Failed to create email connection: {e}")
    return None

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email with the given content."""
    if not settings.SMTP_HOST or not settings.EMAIL_FROM:
        logger.warning("Email settings not configured, skipping email send")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(html_content, 'html'))
        
        server = create_email_connection()
        if server:
            server.send_message(msg)
            server.quit()
            logger.info(f"Email sent to {to_email}")
            return True
        else:
            logger.error("Could not create email connection")
            return False
            
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_verification_email(to_email: str, token: str, base_url: str) -> bool:
    """Send verification email to user."""
    subject = "Verify your email address"
    verification_url = f"{base_url}verify-email?token={token}"
    
    html_content = f"""
    <html>
        <body>
            <h2>Email Verification</h2>
            <p>Thank you for registering with our application. Please verify your email address by clicking the link below:</p>
            <p><a href="{verification_url}">Verify Email</a></p>
            <p>If you did not register for this account, please ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
        </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content)

def send_password_reset_email(to_email: str, token: str, base_url: str) -> bool:
    """Send password reset email to user."""
    subject = "Reset your password"
    reset_url = f"{base_url}reset-password?token={token}"
    
    html_content = f"""
    <html>
        <body>
            <h2>Password Reset</h2>
            <p>You have requested to reset your password. Please click the link below to reset your password:</p>
            <p><a href="{reset_url}">Reset Password</a></p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
        </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content)