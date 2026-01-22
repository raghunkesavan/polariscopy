# Email Notifications Setup Guide

## Overview
Support request notifications are now configured to send emails when users submit support tickets.

## Requirements
- SMTP email account (Gmail recommended)
- App password for authentication

## Setup Instructions

### 1. Gmail App Password (Recommended)

1. **Enable 2-Step Verification:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

### 2. Configure Environment Variables

Add these to your `.env` file (backend):

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password

# Where to send support request notifications
SUPPORT_EMAIL=your-support-email@company.com
```

### 3. Render Deployment

Add the same environment variables to your Render service:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Go to **Environment** → **Environment Variables**
4. Add:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_SECURE` = `false`
   - `SMTP_USER` = `your-email@gmail.com`
   - `SMTP_PASSWORD` = `your-app-password`
   - `SUPPORT_EMAIL` = `your-support-email@company.com`

### 4. Install Dependencies

```bash
cd backend
npm install
```

This will install `nodemailer` package needed for email functionality.

### 5. Test Email Configuration

After setup, create a test support request through your app. You should receive an email notification.

## Email Content

When a support request is submitted, you'll receive:

**Subject:** 🆘 New Support Request: [Type] - [Page]

**Content:**
- User's name and email
- Issue type
- Page where issue occurred
- Detailed description

## Troubleshooting

### No emails received?

1. **Check SMTP credentials:**
   - Verify `SMTP_USER` and `SMTP_PASSWORD` are correct
   - For Gmail, ensure you're using an App Password, not your regular password

2. **Check spam folder:**
   - Emails might be filtered as spam initially

3. **Check backend logs:**
   - Look for email-related errors in Render logs
   - Search for "Email server" or "Failed to send"

4. **Verify 2-Step Verification:**
   - Gmail requires 2-Step Verification for App Passwords

### Using a different email provider?

Update `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` accordingly:

**Outlook/Office 365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Custom SMTP Server:**
```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=465
SMTP_SECURE=true
```

## Security Notes

- Never commit `.env` file with real credentials
- Use App Passwords instead of main account passwords
- Keep `SMTP_PASSWORD` secure
- Rotate passwords periodically

## Email Features

- ✅ HTML formatted emails
- ✅ Plain text fallback
- ✅ Automatic retry on transient failures
- ✅ Non-blocking (won't fail support request if email fails)
- ✅ Detailed logging for debugging
