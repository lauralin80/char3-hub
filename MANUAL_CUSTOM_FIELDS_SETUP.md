# Manual Custom Fields Setup for Account Management Board

Since the API doesn't have permission to create custom fields, you'll need to set them up manually in Trello.

## Account Management Board Setup

**Board URL:** https://trello.com/b/JsfYZ8JH/account-management

### Step 1: Create Custom Fields

1. **Open the Account Management board**
2. **Click the "..." menu** in the top right
3. **Select "Settings"**
4. **Click "Custom Fields"** in the left sidebar
5. **Click "Add Custom Field"**

### Step 2: Create These Custom Fields

#### 1. Task Type (List Field)
- **Name:** `Task Type`
- **Type:** List
- **Options:**
  - `Deliverable` (Lime color)
  - `Account Task` (Pink color)
  - `Client Meeting` (Sky color)
  - `Follow-up` (Yellow color)

#### 2. Project (List Field)
- **Name:** `Project`
- **Type:** List
- **Options:**
  - `iLitigate 2.0` (Blue color)
  - `Aurawell` (Green color)
  - `FFA Phase 2` (Orange color)
  - `Parle` (Purple color)
  - `Roth River` (Red color)
  - `Quartz Network` (Sky color)

#### 3. Priority (List Field)
- **Name:** `Priority`
- **Type:** List
- **Options:**
  - `High` (Red color)
  - `Medium` (Orange color)
  - `Low` (Yellow color)
  - `Urgent` (Red color)

#### 4. Status (List Field)
- **Name:** `Status`
- **Type:** List
- **Options:**
  - `Not Started` (Gray color)
  - `In Progress` (Blue color)
  - `Review` (Yellow color)
  - `Complete` (Green color)

### Step 3: Update Existing Cards

For each card on the board:

1. **Click on the card**
2. **In the custom fields section**, set:
   - **Task Type:** Based on which list the card is in
     - Cards in "📦 Deliverables" → `Deliverable`
     - Cards in "👥 Account Tasks" → `Account Task`
   - **Project:** Based on the project label
   - **Priority:** Set to `Medium` for existing cards
   - **Status:** Set to `Not Started` for existing cards

## Benefits of This Approach

✅ **Structured Data:** Custom fields provide consistent, structured data
✅ **Easy Filtering:** Your frontend can filter by custom field values
✅ **Better Analytics:** Easier to generate reports and track progress
✅ **Consistent Values:** No typos or variations in field values
✅ **Professional Look:** Clean, organized card display

## Alternative: Use Labels Strategically

If you prefer to stick with labels, here's a better approach:

### Keep These Labels:
- **Project Labels:** iLitigate 2.0, Aurawell, FFA Phase 2, Parle, Roth River, Quartz Network
- **Flexible Labels:** For ad-hoc tagging (e.g., "Client Feedback", "Blocked", "Quick Win")

### Remove These Labels:
- Task Type labels (use custom fields instead)
- Priority labels (use custom fields instead)
- Status labels (use custom fields instead)

## Next Steps

1. **Set up the custom fields manually** using the instructions above
2. **Update your frontend** to read custom field values instead of labels
3. **Test the filtering** in your custom app
4. **Apply the same approach** to other boards (Master, Design, etc.)

This will give you a much more professional and maintainable system!
