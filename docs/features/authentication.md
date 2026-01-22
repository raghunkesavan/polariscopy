# Authentication System Implementation Guide

## Overview
Project Polaris now has a comprehensive authentication and role-based access control system with 5 access levels:

1. **Admin** - Full system access
2. **UW Team Lead** - Can edit calculators + access admin pages
3. **Head of UW** - Can edit calculators + access admin pages
4. **Underwriter** - Calculator and quotes access only (read-only calculator)
5. **Product Team** - Admin pages access only

## Setup Instructions

### 1. Install Backend Dependencies

Run the following command in PowerShell from the backend directory:

```powershell
cd backend
npm install
```

This installs:
- `bcrypt ^5.1.1` - for password hashing
- `jsonwebtoken ^9.0.2` - for JWT token generation

### 2. Run Database Migration

Execute the SQL migration file against your Supabase database:

**Option A - Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migrations/016_create_users_and_auth.sql`
4. Paste and execute the SQL

**Option B - Supabase CLI:**
```powershell
# If you have Supabase CLI installed
supabase db push --db-url "YOUR_SUPABASE_DB_CONNECTION_STRING"
```

This migration creates:
- `users` table with email, password_hash, access_level (1-5), timestamps
- Row-Level Security (RLS) policies
- `audit_logs` table for tracking user actions
- Default admin user
- Triggers for automatic timestamp updates

### 3. Set Environment Variable

Add the following environment variable to your backend `.env` file or system environment:

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important:** Generate a strong random secret for production. You can use:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start the Backend Server

```powershell
cd backend
npm run dev
```

The auth API will be available at `/api/auth` with the following endpoints:
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and get JWT token
- `GET /api/auth/me` - Get current user info (requires auth)
- `POST /api/auth/change-password` - Change password (requires auth)
- `GET /api/auth/access-levels` - Get list of access levels

### 5. Start the Frontend

```powershell
cd frontend
npm run dev
```

## First Login

### Default Admin Credentials
After running the migration, a default admin account is created:

**Email:** `admin@polaris.local`  
**Password:** `admin123`

**⚠️ IMPORTANT:** Change this password immediately after first login!

To change the password:
1. Login with the default credentials
2. Make a POST request to `/api/auth/change-password`:
   ```javascript
   {
     "currentPassword": "admin123",
     "newPassword": "your-new-secure-password"
   }
   ```

## Creating Additional Users

### Admin Registration
Only admins (access level 1) can create users with any access level. Use the `/register` page while logged in as an admin.

### Self-Registration
Public self-registration is limited to access level 4 (Underwriter). Users can register at `/register` without being logged in, but they will only be able to select Underwriter access.

### API Registration
To programmatically create users, make a POST request to `/api/auth/register`:

```javascript
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "access_level": 2
}
```

Response:
```javascript
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "access_level": 2
  },
  "token": "jwt-token-here"
}
```

## Access Control Rules

### Permission Matrix

| Access Level | Calculator Access | Edit Calculator Fields | Admin Pages | Edit Rates/Criteria | Quotes |
|--------------|------------------|------------------------|-------------|---------------------|--------|
| 1 - Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 - UW Team Lead | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 - Head of UW | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 - Underwriter | ✅ | ❌ (read-only) | ❌ | ❌ | ✅ |
| 5 - Product Team | ❌ | ❌ | ✅ | ✅ | ❌ |

### Frontend Permission Helpers

The `AuthContext` provides several helper functions:

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { 
    user,
    hasPermission,
    canEditCalculators,
    canAccessAdmin,
    canEditRatesAndCriteria,
    isUnderwriter,
    isAdmin
  } = useAuth();

  // Check specific access level (lower number = higher permission)
  if (hasPermission(3)) {
    // User has access level 3 or better (1, 2, or 3)
  }

  // Use helper functions
  if (canEditCalculators()) {
    // Show editable fields (levels 1-3)
  }

  if (canAccessAdmin()) {
    // Show admin navigation (levels 1-3, 5)
  }
}
```

### Backend Middleware

Protect routes with the provided middleware:

```javascript
const { authenticateToken, requireAccessLevel } = require('./routes/auth');

// Require authentication
app.get('/api/protected', authenticateToken, (req, res) => {
  // req.user contains the authenticated user
  res.json({ message: 'Authenticated', user: req.user });
});

// Require specific access level
app.post('/api/admin-only', 
  authenticateToken, 
  requireAccessLevel(1), // Only admins
  (req, res) => {
    res.json({ message: 'Admin access granted' });
  }
);
```

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt with 10 salt rounds. Never store plain text passwords.

2. **JWT Tokens**: Tokens expire after 7 days. Store them securely in localStorage (already implemented).

3. **HTTPS**: Always use HTTPS in production to protect tokens in transit.

4. **Environment Variables**: Never commit `JWT_SECRET` to version control. Use environment variables.

5. **Default Admin**: Change the default admin password immediately after deployment.

6. **Rate Limiting**: Consider adding rate limiting to authentication endpoints to prevent brute force attacks.

7. **Token Refresh**: Consider implementing token refresh logic for better UX with long sessions.

## Troubleshooting

### "bcrypt not found" error
Run `npm install` in the backend directory.

### "users table does not exist"
Run the database migration SQL file in Supabase.

### "Invalid token" errors
Check that `JWT_SECRET` is set correctly and matches between server restarts.

### Cannot access admin pages
Verify user's `access_level` in the database. Use Supabase dashboard to check:
```sql
SELECT id, email, name, access_level FROM users;
```

### Login redirects to login page
Check browser console for errors. Verify token is being stored in localStorage:
```javascript
localStorage.getItem('token')
```

## Database Schema Reference

### users table
```sql
- id: UUID (primary key)
- email: TEXT (unique, not null)
- password_hash: TEXT (not null)
- name: TEXT
- access_level: INTEGER (1-5, not null)
- created_at: TIMESTAMPTZ (default now())
- updated_at: TIMESTAMPTZ (default now())
```

### audit_logs table
```sql
- id: UUID (primary key)
- user_id: UUID (references users)
- action: TEXT (not null)
- details: JSONB
- created_at: TIMESTAMPTZ (default now())
```

## Next Steps

1. ✅ Install backend dependencies (`npm install`)
2. ✅ Run database migration
3. ✅ Set `JWT_SECRET` environment variable
4. ✅ Start backend server
5. ✅ Login with default admin credentials
6. ✅ Change admin password
7. ✅ Create additional user accounts as needed
8. 🔄 (Optional) Add calculator field permission checks for read-only mode
9. 🔄 (Optional) Implement additional security features (rate limiting, token refresh)

## API Documentation

### POST /api/auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "access_level": 4
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "access_level": 4
  },
  "token": "jwt-token"
}
```

### POST /api/auth/login
Authenticate and receive a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "access_level": 4
  },
  "token": "jwt-token"
}
```

### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "access_level": 4
}
```

### POST /api/auth/change-password
Change the authenticated user's password.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

### GET /api/auth/access-levels
Get the list of available access levels.

**Response (200):**
```json
{
  "1": "Admin",
  "2": "UW Team Lead",
  "3": "Head of UW",
  "4": "Underwriter",
  "5": "Product Team"
}
```
