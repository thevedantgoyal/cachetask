

# Password Reset Flow

## What will be added
A "Forgot Password?" link on the login page and a dedicated Reset Password page where you can set a new password after clicking the link in your email.

## How it works
1. On the login page, click "Forgot Password?"
2. Enter your email address and submit
3. You'll receive an email with a reset link
4. Clicking the link takes you to `/reset-password` where you set a new password
5. After resetting, you're redirected to login

## Technical Details

### 1. Update AuthContext (`src/contexts/AuthContext.tsx`)
- Add a `resetPassword(email)` method that calls the password reset API with `redirectTo` pointing to `/reset-password`

### 2. Update AuthPage (`src/pages/AuthPage.tsx`)
- Add a "Forgot Password?" link below the password field (visible only on login view)
- When clicked, show an email-only form that triggers the reset email
- Show success message after sending

### 3. Create ResetPasswordPage (`src/pages/ResetPasswordPage.tsx`)
- New page at `/reset-password` (public route, not behind auth)
- Detects the recovery token from the URL hash
- Shows a form with "New Password" and "Confirm Password" fields
- Calls `supabase.auth.updateUser({ password })` to save the new password
- Redirects to `/auth` on success

### 4. Update App.tsx routing
- Add `<Route path="/reset-password" element={<ResetPasswordPage />} />` as a public route

