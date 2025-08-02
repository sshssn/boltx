# Multi-Factor Authentication (MFA) Setup

## Overview

This implementation adds TOTP (Time-based One-Time Password) based two-factor authentication for admin users. It uses the same standard as Google Authenticator, Authy, and other authenticator apps.

## Features

- ✅ **QR Code Setup**: Easy one-time setup with QR code scanning
- ✅ **TOTP Standard**: Compatible with all major authenticator apps
- ✅ **Backup Codes**: 10 one-time backup codes for account recovery
- ✅ **Admin Only**: MFA is only required for admin users
- ✅ **Secure Storage**: Secrets stored encrypted in database
- ✅ **Session Management**: MFA verification required for each admin session

## How It Works

### 1. **Setup Process**
1. Admin user visits admin dashboard
2. System detects MFA is not enabled
3. Shows MFA setup screen with QR code
4. User scans QR code with authenticator app
5. User enters 6-digit code to verify setup
6. MFA is enabled and backup codes are generated

### 2. **Login Process**
1. Admin user logs in normally
2. System checks if MFA is enabled
3. If enabled, shows MFA verification screen
4. User enters 6-digit code from authenticator app
5. Or uses backup code if authenticator is unavailable
6. Access granted to admin dashboard

### 3. **Security Features**
- **TOTP Standard**: Uses RFC 6238 standard for time-based tokens
- **Clock Skew Tolerance**: Allows 2 time steps (60 seconds) for clock differences
- **One-time Backup Codes**: Each backup code can only be used once
- **Secure Storage**: MFA secrets stored in database with proper encryption
- **Session-based**: MFA verification required for each admin session

## API Endpoints

### Setup MFA
- **POST** `/api/mfa/setup` - Generate QR code and backup codes
- **PUT** `/api/mfa/setup` - Enable MFA with verification token

### Verify MFA
- **POST** `/api/mfa/verify` - Verify TOTP token or backup code
- **GET** `/api/mfa/verify` - Check MFA status

## Database Schema

```sql
-- MFA fields added to User table
ALTER TABLE "User" ADD COLUMN "mfaEnabled" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN "mfaSecret" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN "mfaBackupCodes" JSONB;
```

## Components

### `MFASetup`
- Handles initial MFA setup
- Shows QR code for scanning
- Displays backup codes
- Verifies first token

### `MFAVerify`
- Handles MFA verification for login
- Supports both TOTP tokens and backup codes
- Tabbed interface for different verification methods

### `AdminMFAWrapper`
- Client-side wrapper for admin pages
- Checks MFA status on page load
- Shows appropriate MFA screens
- Manages MFA flow

## Security Considerations

### 1. **OAuth Users Cannot Setup MFA**
- Only credential-based admin users can setup MFA
- OAuth users are blocked from admin access (security fix applied)

### 2. **Backup Code Security**
- Backup codes are one-time use only
- Used codes are immediately removed from database
- 10 backup codes provided for account recovery

### 3. **Token Verification**
- Uses `speakeasy` library for TOTP verification
- Allows 2 time steps for clock skew tolerance
- Invalid tokens are rejected immediately

### 4. **Session Management**
- MFA verification required for each admin session
- No persistent MFA bypass
- Secure session handling

## Usage Instructions

### For Admin Users

1. **Setup MFA**:
   - Log in to admin dashboard
   - System will prompt for MFA setup
   - Scan QR code with authenticator app
   - Enter 6-digit code to verify
   - Save backup codes securely

2. **Daily Login**:
   - Log in normally
   - Enter 6-digit code from authenticator app
   - Or use backup code if needed

3. **Backup Codes**:
   - Use if authenticator app is unavailable
   - Each code can only be used once
   - Contact support if all codes are used

### For Developers

1. **Install Dependencies**:
   ```bash
   pnpm add speakeasy qrcode
   ```

2. **Run Migration**:
   ```bash
   # Apply the MFA database migration
   ```

3. **Test MFA Flow**:
   - Create admin user
   - Visit admin dashboard
   - Complete MFA setup
   - Test login with authenticator app

## Supported Authenticator Apps

- ✅ Google Authenticator
- ✅ Authy
- ✅ 1Password
- ✅ Microsoft Authenticator
- ✅ Any TOTP-compatible app

## Troubleshooting

### Common Issues

1. **Clock Skew**: If tokens are rejected, check device clock synchronization
2. **QR Code Not Scanning**: Ensure authenticator app supports TOTP
3. **Backup Codes Used**: Contact support to reset MFA
4. **Lost Authenticator**: Use backup codes to access account

### Development

1. **Testing**: Use test authenticator apps for development
2. **Debugging**: Check browser console for MFA-related errors
3. **Database**: Verify MFA fields are properly added to User table

## Security Best Practices

1. **Backup Codes**: Store backup codes securely (password manager)
2. **Authenticator App**: Use reputable authenticator apps
3. **Device Security**: Keep authenticator device secure
4. **Regular Verification**: Test MFA setup periodically
5. **Support Contact**: Have recovery procedures in place 