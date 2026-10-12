#  Nodemailer with Gmail OAuth2 (Client ID, Client Secret & Refresh Token)

This guide explains how to configure **Nodemailer** with **Gmail OAuth2 Authentication** using a **Client ID**, **Client Secret**, and **Refresh Token**. It also covers generating a refresh token using the **OAuth 2.0 Playground**.

---

#  Prerequisites

Before getting started, make sure you have:

- Node.js installed
- A Google account
- Access to Google Cloud Console
- Basic knowledge of Node.js

---

#  Getting OAuth2 Credentials

## Step 1: Create or Select a Google Cloud Project

1. Open - [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing project.

---

## Step 2: Enable Gmail API

1. Navigate to **APIs & Services → Library**.
2. Search for **Gmail API**.
3. Click **Enable**.

---

## Step 3: Configure OAuth Consent Screen

1. Go to **OAuth Consent Screen**.
2. Click **Get Started**.
3. Fill in the required details:

| Field | Value |
|-------|------|
| Project Name | Your Project Name |
| Support Email | Your Email |
| Application Type | External |
| Contact Information | Your Email |

4. Click **Create**.
5. Return to your project.
6. Navigate to **APIs & Services**.

---

## Step 4: Create OAuth2 Credentials

1. Go to **Credentials**.
2. Click **Create Credentials**.
3. Select **OAuth Client ID**.
4. Choose **Web Application**.

### Authorized Redirect URIs

Add the following URIs:

```
http://localhost
https://developers.google.com/oauthplayground
```

> **Production:** You can also add your deployed server URL here.

After creating the credentials, Google will provide:

- Client ID
- Client Secret

Save them inside your `.env` file.

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

---

## Step 5: Add Test User

1. Open your project.
2. Go to **Credentials**.
3. Select your **OAuth Client ID**.
4. Navigate to **Audience**.
5. Under **Test Users**, click **Add User**.
6. Add the Gmail address you plan to use.

> **Important**
>
> The email added as a **Test User** must be the **same email account** you use later while generating the Refresh Token in the OAuth 2.0 Playground.

---

# 🔑 Generating Refresh Token using OAuth 2.0 Playground

## Step 1: Open - [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

Open the **OAuth 2.0 Playground** in your browser.

---

## Step 2: Configure Playground

Click the **Settings (⚙️)** icon in the top-right corner.

Enable:

-  Use your own OAuth credentials

Then enter:

- Client ID
- Client Secret

Also ensure:

```
Access Type = Offline
```

Offline access is required to receive a **Refresh Token**.

---

## Step 3: Select Gmail Scope

In **Step 1** of the Playground select:

```
Gmail API v1
```

Choose the following scope:

```
https://mail.google.com/
```

---

## Step 4: Authorize APIs

Click:

```
Authorize APIs
```

Login with the **same Gmail account** that you added as a **Test User**.

---

## Step 5: Exchange Authorization Code

After authorization:

Click

```
Exchange authorization code for tokens
```

Google will generate:

- Access Token
- Refresh Token

---

## Step 6: Save Refresh Token

Copy the generated Refresh Token.

Add the following values to your `.env` file:

```env
GOOGLE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
GOOGLE_USER=your-email@gmail.com
```

> **Note**
>
> `GOOGLE_USER` must be the same Gmail account used:
>
> - As the Test User
> - During OAuth Playground authorization

---

#  Installation

## Initialize Node Project

```bash
npm init -y
```

---

## Install Nodemailer

```bash
npm install nodemailer
```

---

## Install Dotenv

```bash
npm install dotenv
```

---

#  Configuration

## Create `.env`

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
GOOGLE_USER=your-email@gmail.com
```

Replace each placeholder with your actual credentials.

---

#  Create `email.js`

```javascript
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

module.exports = transporter;
```

---

#  Create Email Sending Function

Add the following function inside the same `email.js` file.

```javascript
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your Name" <${process.env.GOOGLE_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message Sent:", info.messageId);
    console.log(nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error Sending Email:", error);
  }
};

module.exports = sendEmail;
```

---

#  Using the Email Function

(now you can use it in your registerController)
                    ↓
```javascript

import sendEmail from "./email";

try{
await sendEmail({
  to: "recipient@example.com",
  subject: "Test Email Subject",
  html: "This is a test email sent with Nodemailer using OAuth2.",
   <p>Please verify your email address by clicking the link below:</p>
    <a href="${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}">Verify Email</a>
    <p>If you did not create an account, please ignore this email.</p>
})
}catch(emailErr) {
  console.error("Email sending failed:", emailErr);              

```

---

# Need to make controller to verify-Email

```javascript

async function verifyEmail(req, res) {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid token",
                success: false,
                err: "User not found"
            })
        }
        user.verified = true;
        await user.save();

        const html =
            ` <h1>Email Verified Successfully!</h1>
              <p>Your email has been verified. You can now log in to your account.</p>
              <a href="http://localhost:3000/login">Go to Login</a>   `

        return res.send(html);
        } catch (err) {
        return res.status(400).json({
            message: "Invalid or expired token",
            success: false,
            err: err.message
        })
}}

```

---

# In login function we add this check

  add this before generating token check
  
```javascript

 if (!user.verified) {
            return res.status(400).json({
                message: "Please verify your email before logging in",
                success: false,
                err: "Email not verified"
            })

```

---



#  Run the Application

```bash
node app.js
```

If everything is configured correctly, you'll see a success message in your terminal indicating that the email has been sent.

---

#  Troubleshooting

## Invalid Credentials

If you receive an **Invalid Credentials** error:

- Verify Client ID
- Verify Client Secret
- Verify Refresh Token
- Ensure all credentials belong to the same Google account.

---

## Email Not Sending

Check that:

- Gmail API is enabled.
- OAuth scope is:

```
https://mail.google.com/
```

- Refresh Token hasn't expired or been revoked.
- The Gmail account is added as a Test User.

---

# 📁 Project Structure

```
project/
│
├── email.js
├── app.js
├── .env
├── package.json
└── node_modules/
```

---

#  References

- [Nodemailer Documentation](https://nodemailer.com/)
- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

#  Environment Variables

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_USER=
```

---

##  You're Done!

Your Node.js application is now configured to send emails securely using **Nodemailer** with **Gmail OAuth2 Authentication** without using your Gmail password.







---







# 📧 Nodemailer + SMTP Notes

##  How Email is Sent from a Web Server

Whenever a user performs actions like:

- Sign Up
- Forgot Password
- OTP Verification
- Email Verification

your **web server** is responsible for sending the email.

However, a web server **cannot send emails directly** to someone's inbox.

Instead, it sends the email through an **SMTP server**, which is responsible for delivering it to the recipient.

### Email Flow

```text
Web Server
     │
     ▼
SMTP Server
     │
     ▼
Recipient's Email Inbox
```

### Step-by-Step Flow

1. The **Web Server** creates the email (recipient, subject, body, attachments, etc.).
2. The **Web Server** sends the email request to an **SMTP Server**.
3. The **SMTP Server** authenticates the request.
4. The **SMTP Server** delivers the email to the recipient's email provider.
5. The recipient receives the email in their inbox.

---

#  What is a Transporter?

A **Transporter** is a **Nodemailer object** that creates a connection between your **web server** and an **SMTP server**.

Without a transporter, your application has **no way to communicate with the SMTP server**.

### Transporter Flow

```text
Your Web Server
       │
       │  (Transporter)
       ▼
SMTP Server
       │
       ▼
Recipient's Email Inbox
```

### Responsibilities of a Transporter

- Establish a connection with the SMTP server.
- Authenticate your application.
- Send email details (recipient, subject, body, attachments, etc.).
- Allow the SMTP server to deliver the email.

---

#  Google SMTP Server

Google provides its own **SMTP servers**, allowing applications to send emails using a Gmail account.

Instead of building and maintaining your own mail server, your application simply connects to **Google's SMTP server**.

---

#  OAuth2 Credentials Required

To securely connect your application to Google's SMTP server, OAuth2 authentication is used.

Store the following credentials in your `.env` file:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_USER=
```

### Purpose of Each Credential

| Environment Variable | Purpose |
|----------------------|---------|
| `GOOGLE_CLIENT_ID` | Identifies your application to Google. |
| `GOOGLE_CLIENT_SECRET` | Proves that your application is authentic. |
| `GOOGLE_REFRESH_TOKEN` | Allows your server to obtain a new Access Token without asking the user to log in again. |
| `GOOGLE_USER` | The Gmail account from which emails will be sent. |

These credentials allow your application to authenticate securely with Google's SMTP server.

---

#  Complete Email Flow

```text
User Action
     │
     ▼
Web Server (Node.js)
     │
     ▼
Transporter (Nodemailer)
     │
     ▼
Google SMTP Server
     │
     ▼
Recipient's Email Provider
     │
     ▼
Recipient's Inbox
```

---

#  Easy Definitions

## SMTP (Simple Mail Transfer Protocol)

> **SMTP is the protocol responsible for sending emails from one server to another.**

---

## Transporter

> **A Transporter is a Nodemailer object that creates a connection between your web server and an SMTP server, authenticates your application, and sends email requests.**

---

## Google SMTP Server

> **Google's SMTP server is the mail server that sends emails from your Gmail account after verifying your application's OAuth2 credentials.**

---

# 💡 Key Takeaways

- A **Web Server** creates the email.
- The **Transporter** connects your application to the SMTP server.
- The **SMTP Server** sends the email to the recipient.
- **Google SMTP** is Gmail's mail server used for email delivery.
- **OAuth2 credentials** authenticate your application securely without exposing your Gmail password.






