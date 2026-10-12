# Google OAuth 2.0 Authentication with Node.js

This guide explains how to set up **Google OAuth 2.0 authentication** in a Node.js application using **Express**, **Passport**, and **JWT**.

---

# Prerequisites

Before we begin, ensure you have the following:

* Node.js installed on your machine.
* A Google account to create OAuth credentials.
* Basic knowledge of JavaScript and Node.js.

---

# Step 1: Set Up Google OAuth Credentials

To authenticate users via Google, you'll need to set up **OAuth 2.0 credentials** in the Google Cloud Console.

## Access the Google Cloud Console

1. Navigate to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Sign in with your Google account.

## Create a New Project

1. Click on the project dropdown at the top of the page.
2. Select **New Project**.
3. Provide a name for your project.
4. Click **Create**.

## Enable the OAuth Consent Screen

1. In the navigation menu, go to **APIs & Services > OAuth consent screen**.
2. Choose **External** for the user type.
3. Click **Create**.
4. Fill in the required details:

* **App name:** Your application's name.
* **User support email:** Your email address.
* **Developer contact information:** Your email address.

5. Click **Save and Continue**.

## Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials**.
3. Select **OAuth client ID**.
4. Choose **Web application** as the application type.
5. Set the **Authorized redirect URI** to:

```text
http://localhost:3000/auth/google/callback
```

6. Click **Create**.
7. Note down the **Client ID** and **Client Secret** displayed.

---

# Step 2: Initialize the Node.js Project

## Create a New Directory for Your Project

Open your terminal or command prompt and run:

```bash
mkdir google-auth-jwt
cd google-auth-jwt
```

## Initialize the Project

Initialize a new Node.js project:

```bash
npm init -y
```

This will create a `package.json` file with default settings.

## Install Required Dependencies

Install the necessary packages:

```bash
npm install express passport passport-google-oauth20 jsonwebtoken dotenv
```

### Package Overview

| Package                   | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `express`                 | Web framework for Node.js.                      |
| `passport`                | Authentication middleware.                      |
| `passport-google-oauth20` | Google OAuth 2.0 strategy for Passport.         |
| `jsonwebtoken`            | Library for working with JSON Web Tokens.       |
| `dotenv`                  | Loads environment variables from a `.env` file. |

---

# Step 3: Configure Environment Variables

## Create a `.env` File

In the root of your project directory, create a file named:

```text
.env
```

Add the following variables and replace the placeholders with your actual Google OAuth credentials and JWT secret:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret
GOOGLE_CALLBACK_URL=your-callback-url
```

### Environment Variables

* `GOOGLE_CLIENT_ID` → Your Google OAuth Client ID.
* `GOOGLE_CLIENT_SECRET` → Your Google OAuth Client Secret.
* `JWT_SECRET` → A secret key used for signing JWTs.
* `GOOGLE_CALLBACK_URL` → Your callback URL. 
> **Important:** Never commit your `.env` file or expose your Client Secret and JWT Secret publicly.

---

# Step 4: Set Up the Express Application

## Create the `app.js` File

In your project directory, create a file named:

```text
app.js
```

## Import Required Modules and Configure Middleware

Open `app.js` and add the following code:

```javascript
require('dotenv').config();

import express from 'express';
import { config } from "./config/config.js";
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const app = express();

app.use(passport.initialize());

// Configure Passport to use Google OAuth 2.0 strategy
passport.use(new GoogleStrategy({
  clientID: config.env.GOOGLE_CLIENT_ID,
  clientSecret: config.env.GOOGLE_CLIENT_SECRET,
  callbackURL: config.env.GOOGLE_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {

  // Here, you would typically find or create
  // a user in your database.

  // For this example, we'll just return the profile.
  return done(null, profile);
}));

// Route to initiate Google OAuth flow
app.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// Callback route that Google will redirect to after authentication

//In routes folder

app.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureFlash: config.NODE_ENV == "development" ? "http://localhost:5173/login" : "/login"
  }),
  googleCallback);     //controller function name



 // In Controller folder

export const googleCallback = async (req, res) => {

    console.log(req.user)

    if (!req.user) {
        return next(new AppError("Google authentication failed", 401));
    }

    const { id, displayName, emails, photos } = req.user
    const email = emails?.[0]?.value;
    const profileImage = photos?.[0]?.value;

    if (!email) {
        return next(new AppError("Google account email not provided", 400));
    }

    let user = await userModel.findOne({
        email
    })

    if (!user) {
        user = await userModel.create({
            email,
            googleID: id,
            fullname: displayName
        })
    }

    const token = jwt.sign({
        id: user._id,
    }, config.JWT_SECRET, { expiresIn: '10d' })

    res.cookie("token", token)
    res.redirect("http://localhost:5173")     // redirect the user after continue with google complete to another page
}


```

---

#  Authentication Flow

```text
User
  │
  ▼
/auth/google
  │
  ▼
Google Login
  │
  ▼
User Authorizes Application
  │
  ▼
/auth/google/callback
  │
  ▼
Passport Verifies User
  │
  ▼
JWT Generated
  │
  ▼
JWT Sent to Client
```

---

#  Important Concepts

## Google OAuth 2.0

Google OAuth 2.0 allows users to authenticate with your application using their Google account instead of creating a separate username and password.

## Passport

Passport handles the authentication process and provides the authenticated user's Google profile to your application.

## JWT

After Google successfully authenticates the user, the application generates a **JSON Web Token (JWT)** that can be used for authentication in the application.

## Callback URL

The callback URL is the endpoint where Google redirects the user after successful authentication:

```text
http://localhost:3000/auth/google/callback
```

This URL must match the **Authorized redirect URI** configured in Google Cloud Console.

---

---

#  References

* [Google Cloud Console](https://console.cloud.google.com/)
* [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
* [Passport.js Documentation](https://www.passportjs.org/)
* [JSON Web Token](https://jwt.io/)
