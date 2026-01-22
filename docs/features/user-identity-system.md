# User Identity System - Implementation Guide

**Feature**: Persistent user tracking without SSO  
**Created**: November 10, 2025  
**Status**: ✅ Implemented

---

## Overview

This system allows tracking which user created/modified each quote **without requiring SSO or authentication**. It uses browser localStorage to persist user identity across sessions.

### Key Features
- ✅ One-time name prompt on first visit
- ✅ Persistent identity stored in browser
- ✅ Automatic user tracking on all quotes
- ✅ Editable user profile
- ✅ User avatar in header
- ✅ No backend authentication required
- ✅ Privacy-friendly (local storage only)

---

## How It Works

### 1. **First Visit Flow**
```
User visits app
  ↓
No profile found in localStorage
  ↓
Show UserNamePrompt modal (blocking)
  ↓
User enters name (+ optional email)
  ↓
Profile saved to localStorage key: 'polaris.user.profile.v1'
  ↓
Modal closes, app continues
```

### 2. **Returning User Flow**
```
User visits app
  ↓
Profile found in localStorage
  ↓
UserContext loads profile
  ↓
App shows user avatar in header
  ↓
User name automatically included in all quotes
```

### 3. **Quote Creation Flow**
```
User creates quote
  ↓
SaveQuoteButton reads current user from UserContext
  ↓
Quote data includes:
  - created_by: "John Smith"
  - created_by_id: "user_abc123_xyz789"
  ↓
Quote saved to database with user info
```

---

## Files Created

### Frontend Components

**1. `frontend/src/contexts/UserContext.jsx`**
- React Context for user state management
- Manages localStorage persistence
- Provides hooks: `useUser()`

**2. `frontend/src/components/UserNamePrompt.jsx`**
- Modal shown on first visit
- Collects: Name (required), Email (optional)
- Can skip → saves as "Anonymous User"

**3. `frontend/src/components/UserProfileButton.jsx`**
- Avatar button in header
- Shows user initials
- Dropdown menu with:
  - User profile info
  - Edit profile option
  - Clear profile option

### Database Migration

**`migrations/011_add_user_tracking.sql`**
- Adds columns to `quotes` and `bridge_quotes` tables:
  - `created_by` (TEXT) - User's display name
  - `created_by_id` (TEXT) - Unique user identifier
  - `updated_by` (TEXT) - Name of last updater
  - `updated_by_id` (TEXT) - ID of last updater
- Creates indexes for performance

---

## Integration Points

### Modified Files

**1. `frontend/src/App.jsx`**
```jsx
import { UserProvider } from './contexts/UserContext';
import UserNamePrompt from './components/UserNamePrompt';
import UserProfileButton from './components/UserProfileButton';

function App() {
  return (
    <UserProvider>
      <UserNamePrompt />
      <header>
        <h1>Project Polaris</h1>
        <UserProfileButton />
      </header>
      {/* ... rest of app */}
    </UserProvider>
  );
}
```

**2. `frontend/src/components/SaveQuoteButton.jsx`**
```jsx
import { useUser } from '../contexts/UserContext';

export default function SaveQuoteButton({ ... }) {
  const { user, getUserName } = useUser();
  
  const quoteData = {
    // ... other fields
    created_by: getUserName(),
    created_by_id: user?.id || null,
  };
}
```

**3. `frontend/src/components/QuotesList.jsx`**
- Added "Created By" column to quotes table
- Shows user name with tooltip showing user ID

---

## Usage Guide

### For Users

**First Time Setup:**
1. Open the application
2. Enter your name in the welcome modal
3. (Optional) Enter your email
4. Click "Save & Continue"
5. ✅ Done! Your name is remembered

**Viewing Your Profile:**
1. Click your avatar (circle with initials) in the top-right
2. Dropdown shows your profile info

**Editing Your Profile:**
1. Click avatar → "Edit Profile"
2. Update your name or email
3. Click "Save Changes"

**Starting Over:**
1. Click avatar → "Clear Profile"
2. Confirm the action
3. You'll be prompted to enter your name again

### For Developers

**Get current user anywhere:**
```jsx
import { useUser } from '../contexts/UserContext';

function MyComponent() {
  const { user, getUserName, getUserInitials } = useUser();
  
  return (
    <div>
      <p>Current user: {getUserName()}</p>
      <p>User ID: {user?.id}</p>
      <div>{getUserInitials()}</div>
    </div>
  );
}
```

**Check if user is set:**
```jsx
const { user, isLoading } = useUser();

if (isLoading) return <div>Loading...</div>;
if (!user) return <div>No user profile</div>;
```

**Update user profile programmatically:**
```jsx
const { updateUserProfile } = useUser();

updateUserProfile({
  name: 'New Name',
  email: 'new@email.com'
});
```

---

## Data Structure

### localStorage
```json
{
  "key": "polaris.user.profile.v1",
  "value": {
    "id": "user_lkj3h4g2_abc9def",
    "name": "John Smith",
    "email": "john.smith@company.com",
    "createdAt": "2025-11-10T10:30:00.000Z",
    "updatedAt": "2025-11-10T10:30:00.000Z"
  }
}
```

### Database (quotes table)
```sql
quotes {
  id: uuid,
  name: text,
  calculator_type: text,
  -- ... other fields
  created_by: text,           -- "John Smith"
  created_by_id: text,         -- "user_lkj3h4g2_abc9def"
  updated_by: text,            -- "Jane Doe" (future)
  updated_by_id: text,         -- "user_xyz789_qrs456" (future)
  created_at: timestamptz,
  updated_at: timestamptz
}
```

---

## Security & Privacy

### ✅ What This System Does
- Stores user name locally in browser
- Tracks who created each quote
- Persists across browser sessions
- No server-side authentication

### ⚠️ What This System Does NOT Do
- Does NOT authenticate users
- Does NOT restrict access
- Does NOT verify identity
- Does NOT sync across devices
- Does NOT protect against impersonation

### Privacy Notes
- User data stored in **localStorage only**
- No data sent to external services
- User can clear profile anytime
- Clearing browser data removes user profile
- Each browser/device needs separate setup

---

## Migration Instructions

### Step 1: Run Database Migration

**Using Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Open `migrations/011_add_user_tracking.sql`
3. Copy and paste the SQL
4. Click "Run"

**Using psql:**
```bash
psql -h your-project.supabase.co -U postgres -d postgres -f migrations/011_add_user_tracking.sql
```

**Verification:**
```sql
-- Check columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
  AND column_name IN ('created_by', 'created_by_id', 'updated_by', 'updated_by_id');

-- Check indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('quotes', 'bridge_quotes') 
  AND indexname LIKE '%created_by%';
```

### Step 2: Deploy Frontend Changes

All frontend changes are already integrated in the codebase:
- ✅ UserContext added
- ✅ UserNamePrompt added
- ✅ UserProfileButton added
- ✅ App.jsx updated
- ✅ SaveQuoteButton updated
- ✅ QuotesList updated

Simply deploy or restart your frontend server.

### Step 3: Test the Feature

**Test Checklist:**
- [ ] Open app → Name prompt appears
- [ ] Enter name → Profile saved
- [ ] Refresh page → Name remembered (no prompt)
- [ ] Create quote → Quote includes created_by
- [ ] View quotes list → Created By column shows name
- [ ] Click avatar → Dropdown shows profile
- [ ] Edit profile → Changes saved
- [ ] Clear profile → Prompt appears again

---

## Troubleshooting

### Issue: Name prompt doesn't appear
**Solution:** Clear localStorage
```javascript
// In browser console
localStorage.removeItem('polaris.user.profile.v1');
location.reload();
```

### Issue: User name not showing in quotes
**Check:**
1. Did you run the database migration?
2. Is `created_by` column present in quotes table?
3. Check browser console for errors
4. Verify UserContext is wrapping App

### Issue: Avatar not showing in header
**Check:**
1. Is `<UserProfileButton />` added to header in App.jsx?
2. Is `<UserProvider>` wrapping the entire app?
3. Check browser console for errors

### Issue: Multiple devices/browsers require setup
**Expected Behavior:** Each browser/device stores its own profile locally. This is by design (no server-side auth).

**Workaround:** 
- Add device identifier to name: "John Smith (Laptop)"
- Or implement cloud sync in future enhancement

---

## Future Enhancements

### Phase 2 (Optional)
- [ ] Export user list from all quotes
- [ ] Filter quotes by creator
- [ ] Team view (show all users)
- [ ] User activity dashboard
- [ ] Email notifications (using stored email)

### Phase 3 (Advanced)
- [ ] Cloud sync for multi-device
- [ ] Team collaboration features
- [ ] User permissions/roles
- [ ] Activity audit log
- [ ] Integration with actual SSO (upgrade path)

---

## API Reference

### UserContext

**Hook: `useUser()`**

```typescript
interface User {
  id: string;              // "user_abc123_xyz789"
  name: string;            // "John Smith"
  email: string;           // "john@company.com"
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  showNamePrompt: boolean;
  setShowNamePrompt: (show: boolean) => void;
  saveUserProfile: (name: string, email?: string) => { success: boolean; error?: string };
  updateUserProfile: (updates: Partial<User>) => { success: boolean; error?: string };
  clearUserProfile: () => void;
  getUserName: () => string;
  getUserInitials: () => string;
}
```

**Methods:**

- `getUserName()` - Returns user name or "Unknown User"
- `getUserInitials()` - Returns 1-2 character initials
- `saveUserProfile(name, email)` - Creates new profile
- `updateUserProfile(updates)` - Updates existing profile
- `clearUserProfile()` - Removes profile from localStorage

---

## Rollback Instructions

If you need to remove this feature:

### 1. Rollback Database
```sql
-- Run rollback section from migration file
ALTER TABLE quotes 
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS created_by_id,
  DROP COLUMN IF EXISTS updated_by,
  DROP COLUMN IF EXISTS updated_by_id;

ALTER TABLE bridge_quotes 
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS created_by_id,
  DROP COLUMN IF EXISTS updated_by,
  DROP COLUMN IF EXISTS updated_by_id;

DROP INDEX IF EXISTS idx_quotes_created_by_id;
DROP INDEX IF EXISTS idx_bridge_quotes_created_by_id;
DROP INDEX IF EXISTS idx_quotes_created_by;
DROP INDEX IF EXISTS idx_bridge_quotes_created_by;
```

### 2. Revert Frontend Changes
Remove these imports from `App.jsx`:
```jsx
// Remove these lines
import { UserProvider } from './contexts/UserContext';
import UserNamePrompt from './components/UserNamePrompt';
import UserProfileButton from './components/UserProfileButton';
```

Remove from SaveQuoteButton.jsx:
```jsx
// Remove this import
import { useUser } from '../contexts/UserContext';

// Remove these lines
const { user, getUserName } = useUser();
created_by: getUserName(),
created_by_id: user?.id || null,
```

### 3. Delete Files
```bash
rm frontend/src/contexts/UserContext.jsx
rm frontend/src/components/UserNamePrompt.jsx
rm frontend/src/components/UserProfileButton.jsx
rm migrations/011_add_user_tracking.sql
```

---

## Questions & Support

**Q: What happens if user clears browser data?**  
A: They'll be prompted to enter their name again. Previous quotes will still show their old name.

**Q: Can two users have the same name?**  
A: Yes, names are not unique. The `created_by_id` is unique per browser.

**Q: What if user switches browsers?**  
A: They'll set up a new profile in the new browser. Each browser has its own ID.

**Q: Is this secure enough for production?**  
A: For internal tools with trusted users, yes. For public apps with untrusted users, no - implement real auth.

**Q: Can I export a list of all users?**  
A: Yes, query: `SELECT DISTINCT created_by, created_by_id FROM quotes;`

---

## Conclusion

✅ **Implementation Complete**

You now have a working user identity system that:
- Prompts for name once
- Remembers user across sessions
- Automatically tracks quote creators
- Shows user info in UI
- Requires zero server-side authentication

**Next Steps:**
1. Run database migration
2. Test the feature
3. Train users (one-time name entry)
4. Monitor adoption
5. Consider Phase 2 enhancements

---

*Generated: November 10, 2025*  
*Project: Polaris Finance Calculator*
