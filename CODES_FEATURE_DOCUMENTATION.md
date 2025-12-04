# Codes Feature Documentation - Complete Feature Description

## Overview
The "الاكواد" (Codes) feature is a discount code management system that allows administrators and teachers to generate, manage, and distribute promotional codes. Users can apply these codes during course purchase to receive a 100% discount (free course access).

---

## 1. ADMIN/TEACHER PERSPECTIVE (Management Dashboard)

### Page Location
- **Admin**: `/dashboard/admin/promocodes`
- **Teacher**: `/dashboard/teacher/promocodes`
- **Note**: Both admin and teacher have identical functionality and UI

### Main Features

#### A. Code List View
**UI Components:**
- **Page Header**: 
  - Title: "الاكواد" (Codes) / "Codes"
  - Blue "Create New Code" button with Plus icon (`bg-[#005bd3]`)
  
- **Search Bar**:
  - Search input with Search icon
  - Placeholder: "Search by code or description"
  - Real-time filtering of codes list

- **Action Buttons** (in Card Header):
  - **Copy Available Codes** button (outline variant) with Copy icon
    - Opens a Popover dialog
    - Allows selecting course (or "All Courses")
    - Copies all active, unused codes to clipboard
  - **Delete Codes** button (destructive variant) with Trash icon
    - Opens bulk delete dialog

- **Data Table**:
  - Columns:
    1. **Code**: Badge with Ticket icon showing the code (monospace font, bold)
    2. **Course**: Course title (or "Not Specified")
    3. **Usage**: Badge showing "Used" (red) or "Available" (default)
    4. **Status**: Badge showing "Active" (default) or "Inactive" (secondary)
    5. **Actions**: Edit button (outline) and Delete button (destructive)
  - Empty state: "No codes" message when no codes exist

#### B. Create Code Dialog
**UI Components:**
- **Dialog Header**:
  - Title: "Create New Code"
  - Description: Instructions for creating codes

- **Form Fields**:
  1. **Course Selection** (Required):
     - Select dropdown showing all published courses
     - Placeholder: "Select a course"
     - Hint text below explaining course selection
  
  2. **Quantity** (Required, only for new codes):
     - Number input (1-99 range)
     - Up/Down arrow buttons (ChevronUp/ChevronDown icons)
     - Hint text explaining bulk generation
     - Validation: Must be between 1 and 99

- **Action Buttons**:
  - Cancel button (outline)
  - Create Codes button (blue `bg-[#005bd3]`)
  - Loading state: "Generating Codes..." when processing

**Functionality:**
- Generates 1-99 unique codes automatically
- Each code is 6 characters (uppercase letters + numbers, no duplicates)
- All codes are:
  - 100% discount (PERCENTAGE, discountValue: 100)
  - Single use only (usageLimit: 1)
  - Active by default (isActive: true)
  - Linked to selected course (courseId)

#### C. Edit Code Dialog
**UI Components:**
- **Dialog Header**:
  - Title: "Edit Code"
  - Description: Instructions for editing

- **Form Fields**:
  1. **Code** (Read-only):
     - Input field with muted background
     - Monospace, bold, centered text
     - Shows existing code value
     - Hint: Code cannot be changed
  
  2. **Course Selection** (Required):
     - Select dropdown
     - Pre-filled with current course
     - Can be changed to different course

- **Action Buttons**:
  - Cancel button
  - Update button (blue)

**Functionality:**
- Can only change the associated course
- Code value itself cannot be modified
- Updates code's courseId relationship

#### D. Delete Operations

**Single Code Delete:**
- Click trash icon on code row
- Browser confirm dialog
- Deletes individual code

**Bulk Delete Dialog:**
- **Dialog Header**: "Delete Codes" title and description
- **Form Fields**:
  - Course selection dropdown
    - Options: "All Courses" or specific course
    - Shows only courses that have codes
- **Action Buttons**:
  - Cancel button
  - Delete button (destructive, disabled if no course selected)
- **Functionality**:
  - Deletes all codes for selected course
  - Or deletes all codes if "All Courses" selected
  - Shows confirmation before deletion

#### E. Copy Codes Feature
**Popover Dialog:**
- **Trigger**: "Copy Available Codes" button
- **Content**:
  - Course selection dropdown
    - "All Courses" option
    - List of courses with codes
  - Copy button (blue, full width)
- **Functionality**:
  - Filters codes: Active AND unused (usedCount === 0)
  - Optionally filters by selected course
  - Copies codes to clipboard (one per line)
  - Shows success toast with count and course name

---

## 2. USER PERSPECTIVE (Purchase Page)

### Page Location
- `/courses/[courseId]/purchase`
- `/ar/courses/[courseId]/purchase` (Arabic locale)

### Main Features

#### A. Course Information Card
**UI Components:**
- Course title and description
- Course image (if available)
- **Price Display**:
  - Large, bold text in blue (`#005bd3`)
  - Shows final price after code application
  - Currency: "جنيه" (EGP)
  - If code applied: Shows green checkmark with success message

#### B. Code Application Section
**UI Components:**
- **Card Header**:
  - Title with Ticket icon: "الكود" (Code)
  
- **Input State** (when no code applied):
  - Text input field
    - Placeholder: "ادخل رمز الكود للحصول علي الكورس" (Enter code to get the course)
    - Auto-uppercase conversion
    - Enter key triggers validation
  - **Apply Button**:
    - Blue button (`bg-[#005bd3]`)
    - Text: "Apply" / "تطبيق"
    - Disabled when input is empty or validating
    - Loading state: "Validating..." / "جارٍ التحقق..."

- **Applied State** (when code is valid):
  - Green success box with border
  - CheckCircle icon
  - Message: "تم شراء الكورس بقيمة {amount} جنيه" (Course purchased for {amount} EGP)
  - Shows code value
  - Remove button (X icon) to clear code

- **Error State** (when code is invalid):
  - Red error text with AlertCircle icon
  - Error messages:
    - "رمز الكوبون غير صحيح" (Invalid code)
    - "تم استخدام هذا الكوبون من قبل" (Code already used)
    - "هذا الكوبون غير نشط" (Code inactive)
    - "هذا الكوبون غير صالح لهذا الكورس" (Code not valid for this course)

**Functionality:**
- Real-time validation via `/api/promocodes/validate`
- Validates:
  - Code exists
  - Code is active
  - Code is for this specific course
  - Code hasn't been used (usedCount < usageLimit)
- On success:
  - Calculates 100% discount (finalPrice = 0)
  - Updates UI to show success message
  - Enables purchase button

#### C. Balance Information Card
**UI Components:**
- **Card Header**: Wallet icon + "Account Balance" / "رصيد الحساب"
- **Content**:
  - Large balance amount (bold, ltr direction)
  - Warning message if insufficient balance (amber color, AlertCircle icon)

#### D. Purchase Section
**UI Components:**
- **Insufficient Balance Card** (if balance < final price):
  - Amber border and background
  - AlertCircle icon
  - Warning message with required amount
  - "Add Balance" button linking to balance page

- **Purchase Button**:
  - Full width, large size
  - Blue (`bg-[#005bd3]`)
  - CreditCard icon
  - Text: "Purchase Course" / "شراء الكورس"
  - Disabled when:
    - Insufficient balance
    - Currently purchasing
  - Loading state: "Purchasing..." / "جارٍ الشراء..."

- **Information Text**:
  - Shows amount to be deducted
  - Shows discount amount if code applied (green text)
  - Explains access after purchase

**Functionality:**
- Calls `/api/courses/[courseId]/purchase` with promocode (if valid)
- On success:
  - Deducts balance (0 if code applied, full price otherwise)
  - Grants course access
  - Marks code as used (increments usedCount)
  - Redirects to dashboard
  - Shows success toast

---

## 3. TECHNICAL DETAILS

### Database Schema (PromoCode Model)
```prisma
model PromoCode {
  id            String   @id @default(uuid())
  code          String   @unique
  discountType  String   // "PERCENTAGE"
  discountValue Float    // 100 (always 100%)
  usageLimit    Int?     // 1 (single use)
  usedCount     Int      @default(0)
  isActive      Boolean  @default(true)
  courseId      String?  // Linked to specific course
  course        Course?  @relation(...)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Code Generation Algorithm
- **Length**: 6 characters
- **Characters**: A-Z, 0-9
- **Uniqueness**: No duplicate characters within code
- **Uniqueness Check**: Verifies against database before creation
- **Format**: Always uppercase

### Code Rules
1. **Discount**: Always 100% (makes course free)
2. **Usage**: Single use only (usageLimit: 1)
3. **Course-Specific**: Each code is linked to one course
4. **Validation**: 
   - Must be active (isActive: true)
   - Must match course (courseId)
   - Must not be used (usedCount < usageLimit)

### API Endpoints

#### GET `/api/promocodes`
- **Access**: Admin, Teacher only
- **Returns**: List of all codes with course relation
- **Order**: Newest first

#### POST `/api/promocodes`
- **Access**: Admin, Teacher only
- **Body**: `{ courseId: string }`
- **Creates**: Single code (auto-generated)

#### POST `/api/promocodes/bulk`
- **Access**: Admin, Teacher only
- **Body**: `{ courseId: string, quantity: number }`
- **Creates**: Multiple codes (1-99)

#### PATCH `/api/promocodes/[id]`
- **Access**: Admin, Teacher only
- **Body**: `{ code?: string, courseId: string, discountType, discountValue, usageLimit, isActive }`
- **Updates**: Code properties (typically only courseId)

#### DELETE `/api/promocodes/[id]`
- **Access**: Admin, Teacher only
- **Deletes**: Single code

#### DELETE `/api/promocodes/bulk-delete`
- **Access**: Admin, Teacher only
- **Body**: `{ courseId: string | "ALL" }`
- **Deletes**: All codes for course, or all codes if "ALL"

#### POST `/api/promocodes/validate`
- **Access**: Authenticated users
- **Body**: `{ code: string, courseId: string }`
- **Returns**: 
  ```json
  {
    "valid": true,
    "discountAmount": "100.00",
    "originalPrice": "100.00",
    "finalPrice": "0.00"
  }
  ```

### UI/UX Features
- **RTL Support**: Full Arabic/English localization
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Spinners and disabled buttons during operations
- **Error Handling**: Toast notifications for all errors
- **Success Feedback**: Green badges, checkmarks, success toasts
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation

### Color Scheme
- **Primary Blue**: `#005bd3` (buttons, highlights)
- **Success Green**: Used for valid codes, success messages
- **Error Red**: Used for invalid codes, errors
- **Warning Amber**: Used for insufficient balance warnings
- **Destructive Red**: Used for delete buttons

---

## 4. USER FLOW EXAMPLES

### Flow 1: Admin Creates Codes
1. Admin navigates to `/dashboard/admin/promocodes`
2. Clicks "Create New Code" button
3. Selects course from dropdown
4. Sets quantity (e.g., 10)
5. Clicks "Create Codes"
6. System generates 10 unique codes
7. Codes appear in table
8. Admin clicks "Copy Available Codes"
9. Selects course, clicks "Copy"
10. Codes copied to clipboard (one per line)

### Flow 2: User Applies Code
1. User navigates to course purchase page
2. Sees course price (e.g., 100 EGP)
3. Enters code in input field
4. Clicks "Apply" button
5. System validates code:
   - Checks if code exists
   - Checks if code is for this course
   - Checks if code is unused
6. If valid:
   - Shows success message: "تم شراء الكورس بقيمة 0.00 جنيه"
   - Final price becomes 0.00
   - Purchase button enabled
7. User clicks "Purchase Course"
8. Course purchased for 0 EGP (free)
9. Code marked as used
10. User redirected to dashboard with course access

### Flow 3: Code Already Used
1. User enters code that was already used
2. Clicks "Apply"
3. System validates and finds `usedCount >= usageLimit`
4. Shows error: "تم استخدام هذا الكوبون من قبل"
5. Code input remains, user can try another code

---

## 5. KEY UI COMPONENTS USED

### Shadcn/UI Components
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`
- `Button` (various variants: default, outline, destructive, ghost)
- `Input`
- `Badge` (outline, default, destructive, secondary variants)
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Popover`, `PopoverTrigger`, `PopoverContent`
- `Label`

### Icons (Lucide React)
- `Plus` - Create button
- `Edit` - Edit action
- `Trash2`, `Trash` - Delete actions
- `Search` - Search input
- `Ticket` - Code badge
- `Copy` - Copy button
- `ChevronUp`, `ChevronDown` - Quantity controls
- `CheckCircle` - Success states
- `AlertCircle` - Warnings/errors
- `CreditCard` - Purchase button
- `Wallet` - Balance section
- `ArrowLeft` - Back navigation
- `X` - Remove/close actions

### Styling
- **Tailwind CSS** for all styling
- **RTL Support**: Conditional classes based on `isRTL` state
- **Dark Mode**: Supports dark mode via `dark:` classes
- **Responsive**: Mobile-first design with breakpoints

---

## 6. TRANSLATION KEYS

### Arabic (ar)
- `promocodes`: "الاكواد"
- `promocodeLabel`: "الكود"
- `promocodePlaceholder`: "ادخل رمز الكود للحصول علي الكورس"
- `applyButton`: "تطبيق"
- `promocodeApplied`: "تم شراء الكورس بقيمة {finalPrice} جنيه"

### English (en)
- `promocodes`: "Codes"
- `promocodeLabel`: "Code"
- `promocodePlaceholder`: "Enter code to get the course"
- `applyButton`: "Apply"
- `promocodeApplied`: "Course purchased for {finalPrice} EGP"

---

## 7. SECURITY & VALIDATION

### Backend Validation
- Authentication required for all operations
- Role-based access (Admin/Teacher for management, Users for validation)
- Code uniqueness enforced at database level
- Course existence validated before code creation
- Usage limit enforced (prevents reuse)

### Frontend Validation
- Input sanitization (uppercase, trim)
- Quantity limits (1-99)
- Required field validation
- Disabled states prevent invalid submissions
- Real-time error feedback

---

This comprehensive documentation covers all aspects of the Codes feature from both administrative and user perspectives, including UI components, functionality, technical implementation, and user flows.

