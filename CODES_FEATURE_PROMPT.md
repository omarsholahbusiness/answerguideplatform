# Codes Feature - Prompt for Cursor

## Feature: Codes - Discount Code Management System

### Overview
A comprehensive discount code system where administrators and teachers can generate, manage, and distribute promotional codes. Users apply these codes during course purchase to receive 100% discount (free course access).

---

## ADMIN/TEACHER PERSPECTIVE

**Page**: `/dashboard/admin/promocodes` or `/dashboard/teacher/promocodes`

### UI Components:

1. **Main Page Layout**:
   - Header with title "Codes" and blue "Create New Code" button (`bg-[#005bd3]`)
   - Search bar with Search icon for filtering codes
   - Action buttons: "Copy Available Codes" (Popover) and "Delete Codes" (Dialog)
   - Data table showing: Code (Badge with Ticket icon), Course, Usage status (Used/Available badges), Status (Active/Inactive badges), Actions (Edit/Delete buttons)

2. **Create Code Dialog**:
   - Course selection dropdown (required, shows published courses)
   - Quantity input (1-99) with up/down arrow buttons
   - Blue "Create Codes" button that generates bulk codes
   - Generates 1-99 unique 6-character codes (A-Z, 0-9, no duplicates)

3. **Edit Code Dialog**:
   - Read-only code field (monospace, bold, centered, muted background)
   - Course selection dropdown (can change course)
   - Blue "Update" button

4. **Bulk Delete Dialog**:
   - Course selection (All Courses or specific course)
   - Red "Delete" button

5. **Copy Codes Popover**:
   - Course filter dropdown
   - Copies active, unused codes to clipboard (one per line)

### Functionality:
- **Code Generation**: Auto-generates unique 6-character codes
- **Code Properties**: All codes are 100% discount, single-use, course-specific
- **Bulk Operations**: Create 1-99 codes at once, bulk delete by course
- **Code Management**: Edit course association, delete individual or bulk
- **Copy Feature**: Export available codes to clipboard

---

## USER PERSPECTIVE

**Page**: `/courses/[courseId]/purchase`

### UI Components:

1. **Course Information Card**:
   - Course title, description, image
   - Price display (large, blue `#005bd3`, shows final price after discount)
   - Success message with checkmark if code applied

2. **Code Application Section** (Card with Ticket icon):
   - **Input State**: Text input (placeholder: "Enter code to get the course"), blue "Apply" button
   - **Applied State**: Green success box with CheckCircle icon, message "Course purchased for {amount} EGP", remove button (X)
   - **Error State**: Red error text with AlertCircle icon

3. **Balance Information Card** (Wallet icon):
   - Current balance display
   - Warning if insufficient balance (amber, AlertCircle)

4. **Purchase Section**:
   - Insufficient balance card (amber) with "Add Balance" button if needed
   - Large blue "Purchase Course" button (CreditCard icon, full width)
   - Information text showing deduction amount and discount

### Functionality:
- **Code Validation**: Real-time validation via API
- **Validation Rules**: Code exists, is active, matches course, not used
- **Discount Application**: 100% discount (finalPrice = 0)
- **Purchase Flow**: Validates code, deducts balance (0 if code valid), grants access, marks code as used

---

## TECHNICAL DETAILS

### Database Model:
- `PromoCode`: id, code (unique), discountType ("PERCENTAGE"), discountValue (100), usageLimit (1), usedCount, isActive, courseId, course relation

### Code Generation:
- 6 characters: A-Z, 0-9
- No duplicate characters within code
- Uniqueness checked against database
- Always uppercase

### API Endpoints:
- `GET /api/promocodes` - List all (Admin/Teacher)
- `POST /api/promocodes` - Create single
- `POST /api/promocodes/bulk` - Create multiple (1-99)
- `PATCH /api/promocodes/[id]` - Update code
- `DELETE /api/promocodes/[id]` - Delete single
- `DELETE /api/promocodes/bulk-delete` - Delete by course
- `POST /api/promocodes/validate` - Validate for purchase

### Key Features:
- RTL support (Arabic/English)
- Toast notifications for all actions
- Loading states and disabled buttons
- Error handling with descriptive messages
- Responsive design
- Dark mode support

### Color Scheme:
- Primary: `#005bd3` (blue buttons)
- Success: Green (valid codes)
- Error: Red (invalid codes)
- Warning: Amber (insufficient balance)

---

## USER FLOWS

**Admin Flow**: Navigate to codes page → Create codes (select course, set quantity) → Copy codes → Distribute to users

**User Flow**: Go to purchase page → Enter code → Apply → See success message → Purchase (free) → Get course access

---

Use this prompt to understand, document, or enhance the Codes feature. The system provides a complete discount code management solution with intuitive UI for both administrators and end users.

