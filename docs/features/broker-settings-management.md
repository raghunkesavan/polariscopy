# How to Manage Broker Settings via Constants UI

## Quick Overview

The Constants UI at `/admin` lets you:
- ✅ Change display names for broker routes (e.g., "Direct Broker" → "Independent Broker")
- ✅ Change default commission percentages (e.g., 0.7% → 0.8%)
- ✅ Change tolerance value (e.g., ±0.2% → ±0.3%)
- ⚠️ **Cannot add/remove routes** - must edit code for that (see below)

---

## Part 1: Using the Constants UI (Edit Existing Values)

### Step 1: Open Constants UI
1. Start your frontend server: `npm run dev` in `frontend/` folder
2. Open browser to: `http://localhost:5173/admin` (or your frontend URL + `/admin`)
3. You'll see the Constants admin page

### Step 2: Find "Broker Settings" Section
Scroll down to the **"Broker Settings"** section (should be near the bottom, after "Market / Base Rates")

You'll see three subsections:
- **Broker Routes** - Display names
- **Broker Commission Defaults (%)** - Default percentages
- **Commission Tolerance** - Allowable adjustment range

### Step 3: Edit a Broker Route Display Name

**Example: Change "Direct Broker" to "Independent Broker"**

1. Find the field labeled **"DIRECT_BROKER"** in the "Broker Routes" section
2. You'll see:
   ```
   DIRECT_BROKER
   [Direct Broker] [Edit]
   ```
3. Click the **[Edit]** button
4. The field becomes editable and shows **[Save]** and **[Cancel]** buttons
5. Change the text from `Direct Broker` to `Independent Broker`
6. Click **[Save]**
7. ✅ Done! The dropdown in calculators will now show "Independent Broker"

### Step 4: Edit a Commission Default

**Example: Change Direct Broker commission from 0.7% to 0.8%**

1. Find **"Direct Broker"** in the "Broker Commission Defaults (%)" section
2. You'll see:
   ```
   Direct Broker
   [0.7] % [Edit]
   ```
3. Click **[Edit]**
4. Change `0.7` to `0.8`
5. Click **[Save]**
6. ✅ Done! New quotes using "Direct Broker" route will default to 0.8%

### Step 5: Edit Tolerance

**Example: Allow ±0.3% instead of ±0.2%**

1. Find **"Tolerance (±%)"** in the "Commission Tolerance" section
2. You'll see:
   ```
   Tolerance (±%)
   [0.2] % [Edit]
   ```
3. Click **[Edit]**
4. Change `0.2` to `0.3`
5. Click **[Save]**
6. ✅ Done! Users can now adjust commission ±0.3% from default

### Step 6: Save to Database
After making all your changes:
1. Scroll to the bottom of the page
2. Click **"Save All to Database"** button
3. Wait for confirmation message
4. ✅ Settings are now persisted to database (will survive browser data clearing)

---

## Part 2: Adding a New Broker Route (Requires Code Edit)

The Constants UI **cannot add new route types** - you must edit the code file first, then you can customize it in the UI.

### Step 1: Edit constants.js

**File:** `frontend/src/config/constants.js`

**Find this section (around line 80):**
```javascript
export const BROKER_ROUTES = {
  DIRECT_BROKER: 'Direct Broker',
  MORTGAGE_CLUB: 'Mortgage club',
  NETWORK: 'Network',
  PACKAGER: 'Packager',
};
```

**Add your new route:**
```javascript
export const BROKER_ROUTES = {
  DIRECT_BROKER: 'Direct Broker',
  MORTGAGE_CLUB: 'Mortgage club',
  NETWORK: 'Network',
  PACKAGER: 'Packager',
  SOLICITOR: 'Solicitor',  // ← NEW ROUTE ADDED
};
```

**Then find this section:**
```javascript
export const BROKER_COMMISSION_DEFAULTS = {
  'Direct Broker': 0.7,
  'Mortgage club': 0.9,
  'Network': 0.9,
  'Packager': 0.9,
};
```

**Add the default commission for your new route:**
```javascript
export const BROKER_COMMISSION_DEFAULTS = {
  'Direct Broker': 0.7,
  'Mortgage club': 0.9,
  'Network': 0.9,
  'Packager': 0.9,
  'Solicitor': 0.8,  // ← DEFAULT COMMISSION FOR NEW ROUTE
};
```

### Step 2: Save and Refresh
1. Save `constants.js`
2. The frontend will auto-reload (if dev server is running)
3. The new route appears in calculator dropdown immediately!

### Step 3: Customize via Constants UI (Optional)
Now you can use the Constants UI to refine it:
1. Go to `/admin`
2. Scroll to "Broker Settings"
3. You'll see a new field: **"SOLICITOR"**
4. Click **[Edit]** to change display name (e.g., "Solicitor" → "Legal Introducer")
5. Edit the commission default if needed (e.g., 0.8 → 0.75)
6. Click **[Save All to Database]**

---

## Part 3: Removing a Broker Route (Requires Code Edit)

### ⚠️ Warning
Removing a route will break existing quotes that use it! Consider hiding it instead.

### Step 1: Edit constants.js

**Remove from BROKER_ROUTES:**
```javascript
export const BROKER_ROUTES = {
  DIRECT_BROKER: 'Direct Broker',
  MORTGAGE_CLUB: 'Mortgage club',
  NETWORK: 'Network',
  // PACKAGER: 'Packager',  // ← COMMENTED OUT (REMOVED)
};
```

**Remove from BROKER_COMMISSION_DEFAULTS:**
```javascript
export const BROKER_COMMISSION_DEFAULTS = {
  'Direct Broker': 0.7,
  'Mortgage club': 0.9,
  'Network': 0.9,
  // 'Packager': 0.9,  // ← COMMENTED OUT (REMOVED)
};
```

### Step 2: Save and Refresh
1. Save `constants.js`
2. Frontend reloads
3. "Packager" no longer appears in dropdown

### Step 3: Handle Existing Quotes
Existing quotes with `broker_route = 'Packager'` will still show "Packager" in the database, but the dropdown won't offer it for new quotes.

---

## Part 4: Real-World Example Walkthrough

### Scenario: Add "Introducer" route and customize it

#### Step 1: Add to Code
Edit `frontend/src/config/constants.js`:

```javascript
// BEFORE
export const BROKER_ROUTES = {
  DIRECT_BROKER: 'Direct Broker',
  MORTGAGE_CLUB: 'Mortgage club',
  NETWORK: 'Network',
  PACKAGER: 'Packager',
};

export const BROKER_COMMISSION_DEFAULTS = {
  'Direct Broker': 0.7,
  'Mortgage club': 0.9,
  'Network': 0.9,
  'Packager': 0.9,
};

// AFTER
export const BROKER_ROUTES = {
  DIRECT_BROKER: 'Direct Broker',
  MORTGAGE_CLUB: 'Mortgage club',
  NETWORK: 'Network',
  PACKAGER: 'Packager',
  INTRODUCER: 'Introducer',  // ← ADDED
};

export const BROKER_COMMISSION_DEFAULTS = {
  'Direct Broker': 0.7,
  'Mortgage club': 0.9,
  'Network': 0.9,
  'Packager': 0.9,
  'Introducer': 0.5,  // ← ADDED (50% commission)
};
```

#### Step 2: Test in Calculator
1. Open BTL or Bridging calculator
2. Select **"Broker"** as client type
3. Open **"Broker Route"** dropdown
4. ✅ You'll see "Introducer" as an option
5. Select "Introducer"
6. ✅ Broker commission defaults to 0.5%
7. Try adjusting commission to 0.3% → ✅ Allowed (within ±0.2% tolerance)
8. Try adjusting commission to 0.1% → ❌ Capped at 0.3% (below min)

#### Step 3: Customize in Constants UI
1. Go to `http://localhost:5173/admin`
2. Scroll to **"Broker Settings"**
3. Find **"INTRODUCER"** in "Broker Routes" section
4. Click **[Edit]**
5. Change "Introducer" to "Fee Introducer"
6. Click **[Save]**
7. Find **"Introducer"** in "Broker Commission Defaults" section
8. Click **[Edit]**
9. Change 0.5 to 0.6
10. Click **[Save]**
11. Scroll down and click **"Save All to Database"**
12. ✅ Changes are now in database!

#### Step 4: Verify Changes
1. Go back to calculator
2. Refresh page
3. Select "Broker" → "Fee Introducer" (new display name)
4. ✅ Default commission is now 0.6%
5. ✅ Adjustable range is 0.4% to 0.8% (±0.2%)

---

## Common Questions

### Q: Can I add/remove routes without editing code?
**A:** No. Route **keys** (like `DIRECT_BROKER`, `NETWORK`) must be defined in `constants.js`. The Constants UI only lets you edit **display names** and **default values**.

### Q: What's the difference between the key and display name?
**A:** 
- **Key** (e.g., `DIRECT_BROKER`) = Internal identifier used in code
- **Display Name** (e.g., "Direct Broker") = What users see in dropdown
- Keys are hardcoded in `constants.js`
- Display names are editable in Constants UI

### Q: If I change a display name, will existing quotes break?
**A:** No. Quotes store the **display name** (e.g., "Direct Broker") in the database, not the key. If you change the display name, existing quotes keep their old name, new quotes use the new name.

### Q: What if I want route-specific tolerance?
**A:** Currently not supported - tolerance is global (same for all routes). Would require code changes to implement per-route tolerance.

### Q: How do I set different commissions for different users?
**A:** Not currently supported - commission defaults are app-wide. Would require implementing user-specific configuration system.

### Q: Can I make a route temporarily unavailable without deleting it?
**A:** Yes, comment it out in `constants.js`:
```javascript
export const BROKER_ROUTES = {
  DIRECT_BROKER: 'Direct Broker',
  // PACKAGER: 'Packager',  // Temporarily disabled
};
```

### Q: What happens if I delete a route that has existing quotes?
**A:** Existing quotes will still show the old route name in their saved data, but users won't be able to select it for new quotes. Consider keeping the route but changing its name to "DEPRECATED - Packager" instead.

---

## Troubleshooting

### Problem: Changes in Constants UI don't appear in calculator
**Solution:** 
1. Check browser console for errors
2. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check localStorage: Open console, run `localStorage.getItem('app.constants.override.v1')`
4. Clear localStorage and reload: `localStorage.clear()`

### Problem: New route added to code doesn't appear in dropdown
**Solution:**
1. Verify you saved `constants.js`
2. Check for syntax errors in console
3. Make sure you added route to BOTH `BROKER_ROUTES` and `BROKER_COMMISSION_DEFAULTS`
4. Hard refresh browser

### Problem: "Save All to Database" button doesn't work
**Solution:**
1. Check browser console for errors
2. Verify Supabase connection (check other Constants sections work)
3. Run the SQL migration: `migrations/013_add_broker_settings_to_app_constants.sql`
4. Check Supabase logs for permission errors

---

## Files Reference

| Task | File to Edit | Type |
|------|-------------|------|
| Add/remove route | `frontend/src/config/constants.js` | Code |
| Edit display names | Constants UI at `/admin` | UI |
| Edit commission defaults | Constants UI at `/admin` | UI |
| Edit tolerance | Constants UI at `/admin` | UI |
| Enable DB persistence | `migrations/013_add_broker_settings_to_app_constants.sql` | SQL |

---

## Summary: Quick Steps

### To Edit Existing Route (No Code)
1. Go to `/admin`
2. Scroll to "Broker Settings"
3. Click **[Edit]** on the field you want to change
4. Modify value
5. Click **[Save]**
6. Click **"Save All to Database"** at bottom

### To Add New Route (Requires Code)
1. Edit `frontend/src/config/constants.js`
2. Add to `BROKER_ROUTES` object
3. Add to `BROKER_COMMISSION_DEFAULTS` object
4. Save file and refresh browser
5. Optionally customize via Constants UI

### To Remove Route (Requires Code)
1. Edit `frontend/src/config/constants.js`
2. Comment out or delete from `BROKER_ROUTES`
3. Comment out or delete from `BROKER_COMMISSION_DEFAULTS`
4. Save file and refresh browser
