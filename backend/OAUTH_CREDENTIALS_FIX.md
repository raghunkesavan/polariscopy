# 🔐 Salesforce OAuth Credentials - Fix Guide

## Current Status
✅ Code is correct
✅ Environment variables are loaded
❌ **Salesforce authentication failing (401 invalid_grant)**

## The Problem
The error `"error":"invalid_grant","error_description":"authentication failure"` means Salesforce is rejecting the credentials.

---

## 🔧 How to Fix

### Option 1: Verify Your Salesforce Credentials

1. **Username**: Must be the FULL Salesforce username (not email)
   - Example: `raghu.kesavan@mfsastra.com.dev` ✅
   - NOT: `raghu.kesavan` ❌

2. **Password**: Must be your Salesforce login password
   - This is the password you use to log into Salesforce
   - NOT an API token

3. **Security Token**: CRITICAL!
   - Get from: Salesforce Setup → Personal Settings → Reset Security Token
   - Email will be sent to you with the token
   - Must be appended to password in OAuth request

### Step-by-Step Fix:

#### Step 1: Verify Security Token
```
1. Log into Salesforce
2. Click your avatar (top right)
3. Go to Settings
4. Search for "Security Token"
5. Click "Reset Security Token"
6. Check your email (from salesforce-security@salesforce.com)
7. Copy the new token
```

#### Step 2: Update .env File
```bash
# Get your credentials ready:
SF_USERNAME=raghu.kesavan@mfsastra.com.dev       # Your full Salesforce username
SF_PASSWORD=Hrishi@27                            # Your Salesforce login password
SF_SECURITY_TOKEN=<paste_new_token_here>        # Your security token from email

# The OAuth request will send: password + security_token concatenated
# Example: Hrishi@27 + F0BB2Wv2ePUS9Vnwl7QHA8nx = Hrishi@27F0BB2Wv2ePUS9Vnwl7QHA8nx
```

#### Step 3: Test Again
```bash
# Run the diagnostic
node scripts/diagnose-oauth.js

# You should see:
# ✅ OAuth Token Request SUCCESSFUL!
```

---

## 🧪 Manual Test (If Diagnostic Still Fails)

Use curl to test directly:

```bash
curl -X POST \
  "https://mfsuk--dev.sandbox.my.salesforce.com/services/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD+YOUR_SECURITY_TOKEN"
```

If this works, your credentials are correct.

---

## 🚨 Common Issues & Solutions

### Issue 1: "invalid_grant" Error
**Cause**: Wrong password, username, or security token
**Fix**: Re-verify all three values in .env

### Issue 2: "invalid_client" Error
**Cause**: Client ID or Secret is wrong
**Fix**: Check Connected App settings in Salesforce
```
Salesforce Setup → Apps → App Manager → Your Connected App → View
Copy Client ID and Secret
```

### Issue 3: "invalid_client_id" Error
**Cause**: Connected App is not enabled
**Fix**:
```
Setup → Apps → App Manager → Your Connected App → Edit
Enable OAuth flows for your app
Verify scopes include: api, refresh_token
```

### Issue 4: Multiple Failed Attempts
**Cause**: Account lockout due to too many failed login attempts
**Fix**: 
```
Wait 30 minutes or contact Salesforce admin
OR
Try resetting password in Salesforce Setup
```

---

## 📋 Checklist

- [ ] Username is full email format (username@company.sandbox)
- [ ] Password is the one you use to log into Salesforce
- [ ] Security token was reset and copied from email
- [ ] .env file has all three values
- [ ] Connected App is created in Salesforce
- [ ] Client ID and Secret match Connected App
- [ ] OAuth flows are enabled in Connected App
- [ ] User has permission to use Connected App
- [ ] Account is not locked out

---

## ✅ Code Verification

Your axios code is **CORRECT**:

```javascript
const tokenResponse = await axios.post(
  "https://mfsuk--dev.sandbox.my.salesforce.com/services/oauth2/token",
  qs.stringify({
    grant_type: "password",
    client_id: process.env.SF_CLIENT_ID,              // ✅ Correct
    client_secret: process.env.SF_CLIENT_SECRET,      // ✅ Correct
    username: process.env.SF_USERNAME,                // ✅ Correct
    password: process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN  // ✅ Correct
  }),
  { 
    headers: { "Content-Type": "application/x-www-form-urlencoded" },  // ✅ Correct
    validateStatus: () => true
  }
);
```

The issue is **NOT with the code** - it's with the credentials!

---

## Next Steps

1. ✅ Reset your Salesforce security token
2. ✅ Update .env with new security token
3. ✅ Run diagnostic again: `node scripts/diagnose-oauth.js`
4. ✅ Once OAuth test passes, start the backend server

Happy coding! 🚀
