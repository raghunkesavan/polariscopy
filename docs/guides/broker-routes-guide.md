# Add/Delete Broker Routes in Constants UI - Quick Guide

## New Feature: Manage Broker Routes Without Code!

You can now **add** and **delete** broker routes directly from the Constants UI at `/admin` - no need to edit `constants.js`!

---

## How to Add a New Broker Route

### Step 1: Open Constants UI
1. Navigate to `http://localhost:5173/admin` (or your frontend URL + `/admin`)
2. Scroll down to the **"Broker Settings"** section

### Step 2: Click "Add New Route"
1. Find the **"Broker Routes"** subsection
2. Click the blue **"Add New Route"** button in the top-right corner
3. A form will appear with 3 fields

### Step 3: Fill in the Form

**Route Key** (Required)
- Enter the internal identifier (e.g., `SOLICITOR`, `INTRODUCER`)
- Will be auto-converted to UPPERCASE
- Spaces will be replaced with underscores
- Must be unique (cannot duplicate existing keys)

**Display Name** (Required)
- Enter the name users will see in the dropdown (e.g., `Solicitor`, `Legal Introducer`)
- This is what appears in calculator dropdowns

**Default Commission (%)** (Required)
- Enter the default commission percentage (e.g., `0.8` for 0.8%)
- Numeric value between 0 and 100
- Defaults to `0.9` if not specified

### Step 4: Add the Route
1. Click the green **"Add Route"** button
2. Success message appears confirming the route was added
3. Form closes automatically
4. New route appears in the routes list immediately

### Step 5: Save to Database
1. Scroll to the bottom of the page
2. Click **"Save All to Database"** to persist the change
3. Done! The new route is now available in all calculators

---

## Example: Adding "Solicitor" Route

**Inputs:**
- Route Key: `solicitor` → Saved as: `SOLICITOR`
- Display Name: `Legal Introducer`
- Default Commission: `0.75`

**Result:**
- Calculator dropdown shows: "Legal Introducer"
- Default commission: 0.75%
- Adjustable range: 0.55% to 0.95% (±0.2% tolerance)

---

## How to Delete a Broker Route

### Step 1: Find the Route
1. Go to `/admin` → Scroll to "Broker Settings" → "Broker Routes"
2. Locate the route you want to delete

### Step 2: Click Delete Button
1. Each route has a red **"Delete"** button (only visible when NOT editing)
2. Click the **"Delete"** button for the route you want to remove

### Step 3: Confirm Deletion
1. A confirmation dialog appears:
   ```
   Are you sure you want to delete the route "SOLICITOR"?
   
   Warning: Existing quotes using this route will still reference it in the database.
   ```
2. Click **OK** to confirm, or **Cancel** to abort

### Step 4: Save to Database
1. Success message confirms deletion
2. Route disappears from the list immediately
3. Scroll to bottom and click **"Save All to Database"**
4. Done! The route is removed from all calculators

---

## ⚠️ Important Warnings

### Deleting Routes
- **Existing quotes** that used the deleted route will still show it in their saved data
- The route simply won't appear in the dropdown for **new quotes**
- Consider renaming instead of deleting if you have existing quotes

### Route Keys vs Display Names
- **Route Key** (e.g., `SOLICITOR`) = Internal identifier, stored in code/database
- **Display Name** (e.g., "Legal Introducer") = What users see in UI
- Changing the display name doesn't affect existing quotes
- Deleting the route key removes it from dropdowns

### Validation
- Cannot add route with empty key or display name
- Cannot add duplicate route keys
- Route keys are auto-formatted (uppercase, underscores)

---

## Real-World Scenario

### Scenario: Your business adds a new "Estate Agent" introducer type

**Step 1: Add the Route**
1. Go to `/admin`
2. Click "Add New Route"
3. Fill in:
   - Route Key: `estate agent`
   - Display Name: `Estate Agent Introducer`
   - Default Commission: `0.6`
4. Click "Add Route"

**Step 2: Customize (Optional)**
1. The new `ESTATE_AGENT` route appears
2. Click "Edit" to refine the display name if needed
3. Adjust the commission default if needed

**Step 3: Save**
1. Click "Save All to Database"
2. Done! Brokers can now select "Estate Agent Introducer" in calculators

**Step 4: Use in Calculator**
1. Open BTL or Bridging calculator
2. Select "Broker" as client type
3. Select "Estate Agent Introducer" from "Broker Route" dropdown
4. Commission defaults to 0.6%
5. User can adjust ±0.2% (0.4% to 0.8%)

---

## Comparison: Old vs New Way

| Task | Old Way (Code Edit) | New Way (UI) |
|------|---------------------|--------------|
| **Add route** | Edit `constants.js`, save, refresh | Click "Add New Route", fill form, done |
| **Delete route** | Edit `constants.js`, comment out, save | Click "Delete" button, confirm |
| **Time required** | 2-3 minutes + code knowledge | 30 seconds, no code needed |
| **Risk** | Syntax errors break app | Validated, safe |
| **Who can do it** | Developers only | Anyone with admin access |

---

## UI Buttons Reference

### In Broker Routes Section:

**Blue "Add New Route" Button**
- Location: Top-right of "Broker Routes" heading
- Opens the add route form
- Changes to "Cancel" when form is open

**Green "Add Route" Button**
- Location: Inside add route form
- Submits the form to create new route
- Only enabled when form is filled

**Gray "Edit" Button**
- Location: Next to each route input field
- Enables editing the display name
- Changes to "Save" and "Cancel" buttons when clicked

**Red "Delete" Button**
- Location: Next to each route (when not editing)
- Deletes the route with confirmation
- Only shows when route is not being edited

---

## Troubleshooting

### Problem: "Add Route" button doesn't respond
**Solution:** Check all 3 fields are filled. Route key and display name cannot be empty.

### Problem: Error "Route key already exists"
**Solution:** Choose a different route key. Each key must be unique.

### Problem: Deleted route still appears in calculator dropdown
**Solution:** Hard refresh the calculator page (Ctrl+Shift+R or Cmd+Shift+R).

### Problem: New route doesn't appear after adding
**Solution:** 
1. Check for error message in Constants UI
2. Try refreshing the page
3. Check browser console for errors

### Problem: Changes don't persist after page reload
**Solution:** Make sure you clicked "Save All to Database" at the bottom of the page.

---

## Best Practices

1. **Use descriptive route keys** - Make them clear and easy to understand
2. **Test in calculator** - After adding, test the route in BTL/Bridging calculator
3. **Save to database** - Always click "Save All to Database" after making changes
4. **Communicate changes** - Let team know when routes are added/deleted
5. **Don't delete routes with active quotes** - Rename them instead (e.g., "DEPRECATED - Packager")

---

## What Gets Saved Where

| Data | Location | Persists |
|------|----------|----------|
| Route Key | localStorage + database | ✅ Yes |
| Display Name | localStorage + database | ✅ Yes |
| Commission Default | localStorage + database | ✅ Yes |
| Add/Delete Actions | localStorage + database | ✅ Yes |

After clicking "Save All to Database", everything is persisted and will survive:
- Page refreshes ✅
- Browser restarts ✅
- Different devices/browsers ✅
- localStorage clearing ✅

---

## Summary

### To Add a Route (30 seconds):
1. `/admin` → "Broker Settings"
2. Click "Add New Route"
3. Fill: Key, Display Name, Commission
4. Click "Add Route"
5. Click "Save All to Database"

### To Delete a Route (15 seconds):
1. `/admin` → "Broker Settings"
2. Find the route
3. Click "Delete"
4. Confirm
5. Click "Save All to Database"

✅ No code editing required!
✅ Changes take effect immediately!
✅ Validated and safe!
