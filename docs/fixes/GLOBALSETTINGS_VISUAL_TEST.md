# GlobalSettings - Quick Visual Test Guide

## Access the Page
1. Navigate to: http://localhost:3001
2. Login if needed
3. Go to Admin → Global Settings

## Visual Checks (5 minutes)

### ✅ Page Layout
- [ ] Page title "Global Settings" displays correctly
- [ ] Subtitle text is visible and readable
- [ ] Three tabs visible: "BTL Calculator", "Bridging Calculator", "Core Range"
- [ ] Active tab has blue underline
- [ ] Page has proper padding/margins

### ✅ Accordion Sections (BTL Tab)
Test each section expands/collapses:

#### 1. Row Visibility Section
- [ ] Accordion header shows "Row Visibility" with eye icon
- [ ] Click to expand - section opens smoothly
- [ ] Checkboxes arranged in grid (3-4 columns on desktop)
- [ ] "Select All" and "Deselect All" buttons visible
- [ ] Click "Select All" - all checkboxes check
- [ ] Click "Deselect All" - all checkboxes uncheck
- [ ] Click header again - section collapses

#### 2. Row Display Order Section  
- [ ] Accordion header shows "Row Display Order" with sort icon
- [ ] Click to expand - section opens
- [ ] Rows listed with numbers (1., 2., 3., etc.)
- [ ] Hidden rows show "(Hidden)" badge in gray
- [ ] Up/down arrow buttons visible for each row
- [ ] First row's up arrow is disabled (grayed)
- [ ] Last row's down arrow is disabled (grayed)
- [ ] Click up/down arrow - row moves correctly
- [ ] Click header - section collapses

#### 3. Label Aliases Section
- [ ] Accordion header shows "Label Aliases" with label icon
- [ ] Click to expand - section opens
- [ ] "Reset All Labels" button visible in top-right
- [ ] Description text explains functionality
- [ ] Labels displayed in grid layout
- [ ] Modified labels have yellow background + "Modified" badge
- [ ] Click on a label value - enters edit mode
- [ ] Input field appears with save (✓) and cancel (✕) buttons
- [ ] Edit text and click save - label updates
- [ ] Click cancel - edit canceled
- [ ] Modified labels show reset button (↺ icon)
- [ ] Click header - section collapses

#### 4. Header Column Colors Section
- [ ] Accordion header shows "Header Column Colors" with palette icon
- [ ] Click to expand - section opens
- [ ] "Add Column" and "Reset Colors" buttons visible
- [ ] Live preview shows Label column + data columns
- [ ] Preview colors match color picker values
- [ ] Color pickers have both color input and hex text input
- [ ] Change color - preview updates immediately
- [ ] Click "Add Column" - new column appears (max 10)
- [ ] Click delete icon on column - column removed
- [ ] Click "Reset Colors" - colors reset to defaults
- [ ] Click header - section collapses

### ✅ Tab Switching
- [ ] Click "Bridging Calculator" tab - switches tabs
- [ ] All 4 accordion sections render for Bridge
- [ ] Click "Core Range" tab - switches tabs
- [ ] All 4 accordion sections render for Core
- [ ] Click back to "BTL Calculator" - switches back

### ✅ Action Buttons
- [ ] "Reset to Defaults" button visible bottom-left
- [ ] "Save Settings" button visible bottom-right (blue)
- [ ] Both buttons have proper spacing
- [ ] Hover over buttons - cursor changes to pointer

### ✅ Save Functionality
- [ ] Make a change (e.g., toggle a visibility checkbox)
- [ ] Click "Save Settings"
- [ ] Button text changes to "Saving..."
- [ ] Button becomes disabled during save
- [ ] Success notification appears
- [ ] Refresh page - changes persist

### ✅ Reset Functionality  
- [ ] Make multiple changes across sections
- [ ] Click "Reset to Defaults"
- [ ] Confirmation appears (if implemented)
- [ ] All values reset to original defaults
- [ ] Modified badges disappear

### ✅ Mobile Responsive (768px)
- [ ] Resize browser to 768px width
- [ ] Accordion sections stack vertically
- [ ] Visibility grid shows 2 columns (not 3-4)
- [ ] Label alias grid shows 1 column
- [ ] Color picker grid shows 1 column
- [ ] All content fits without horizontal scroll
- [ ] Buttons stack properly
- [ ] Touch targets are large enough

### ✅ Mobile Responsive (480px)
- [ ] Resize browser to 480px width
- [ ] Visibility grid shows 1 column
- [ ] All grids show 1 column
- [ ] Text remains readable
- [ ] No content overflow
- [ ] Action buttons stack vertically

## Quick Functional Test (2 minutes)

1. **End-to-End Workflow**:
   ```
   1. Expand "Row Visibility"
   2. Deselect "Lender Name"
   3. Expand "Row Display Order"  
   4. Move "Product Name" up one position
   5. Expand "Label Aliases"
   6. Edit "Rate" label to "Interest Rate"
   7. Expand "Header Colors"
   8. Change Label background to light blue
   9. Click "Save Settings"
   10. Refresh page
   11. Verify all changes persisted
   12. Click "Reset to Defaults"
   13. Verify everything reset
   ```

## Expected Results ✅

### Accordion Behavior
- Smooth expand/collapse animations
- Only one section can be open at a time (not required, but nice)
- Icons rotate when expanded (optional)
- No layout shift when expanding/collapsing

### Visual Design
- Clean, professional SLDS look
- Consistent spacing throughout
- Proper color contrast
- Clear visual hierarchy
- No inline style warnings in console

### Performance
- No lag when expanding sections
- Smooth scrolling
- Fast save operations
- No console errors
- No React warnings

## Common Issues to Watch For ❌

- [ ] Accordion doesn't expand/collapse
- [ ] Checkboxes don't toggle
- [ ] Up/down arrows don't work
- [ ] Label editing doesn't save
- [ ] Color changes don't update preview
- [ ] Save doesn't persist to database
- [ ] Reset doesn't work
- [ ] Mobile layout breaks
- [ ] Console shows inline style errors
- [ ] Icons don't display (404 errors)

## Success Criteria ✅

If all checkboxes pass:
- **Visual Design**: Professional, clean, SLDS-compliant ✅
- **Functionality**: All features working as expected ✅  
- **Responsive**: Works on all screen sizes ✅
- **Performance**: No lag or errors ✅
- **Code Quality**: No inline styles, uses design tokens ✅

---

**Test Date**: _____________
**Tested By**: _____________
**Status**: Pass ☐ / Fail ☐
**Notes**: ___________________________________
