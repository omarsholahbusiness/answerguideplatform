# Image Locations Guide

This document lists all the images you need to replace and where they are located.

## 📁 All Images Location
All images are stored in the `public` folder at the root of your project:
```
D:\web-projects\answerguideplatform\answerguideplatform\public\
```

---

## 🖼️ Images to Replace

### 1. **Navbar Logo** 
- **File:** `public/logo.png`
- **Used in:**
  - `components/navbar.tsx` (line 24) - Main navbar
  - `app/dashboard/_components/logo.tsx` (line 9) - Dashboard navbar
  - `app/icon.tsx` (line 30) - App icon
- **Current size:** 100x100 pixels
- **Usage:** Displayed in the top navigation bar

### 2. **Login Page Logo**
- **File:** `public/logo.png` (same as navbar logo)
- **Used in:**
  - `app/(auth)/(routes)/sign-in/page.tsx` (line 92) - Sign-in page
  - `app/(auth)/(routes)/sign-up/page.tsx` (line 151) - Sign-up page
- **Current size:** 256x256 pixels (w-64 h-64)
- **Usage:** Displayed on the right side of login/signup pages

### 3. **Teacher Photo (Homepage)**
- **File:** `public/teacher-image.png`
- **Used in:**
  - `app/page.tsx` (line 111) - Homepage hero section
- **Current size:** 256x256px (mobile) / 320x320px (desktop)
- **Usage:** Main teacher photo displayed in a circular frame on the homepage

### 4. **Floating Images Around Teacher Photo**

These are the decorative floating images around the teacher photo on the homepage:

#### a. **Pi Symbol (π)**
- **File:** `public/pi.png`
- **Used in:** `app/page.tsx` (line 146)
- **Current size:** 40x40 pixels
- **Position:** Top right of teacher photo
- **Animation:** Floating with rotation

#### b. **Calculator**
- **File:** `public/calculator.png`
- **Used in:** `app/page.tsx` (line 179)
- **Current size:** 50x50 pixels
- **Position:** Bottom left of teacher photo
- **Animation:** Floating with rotation

#### c. **Notebook**
- **File:** `public/notebook.png`
- **Used in:** `app/page.tsx` (line 212)
- **Current size:** 55x55 pixels
- **Position:** Middle right of teacher photo
- **Animation:** Floating with rotation

---

## 📝 How to Replace Images

1. **Replace the files directly:**
   - Navigate to `public/` folder
   - Replace the existing image files with your new images
   - **Keep the same file names** (logo.png, teacher-image.png, etc.)

2. **Recommended image formats:**
   - PNG (with transparency for logos)
   - JPG/JPEG (for photos)
   - SVG (for scalable logos)

3. **Recommended sizes:**
   - `logo.png`: At least 200x200px (will be scaled to 100x100 in navbar)
   - `teacher-image.png`: At least 400x400px (will be scaled to 256-320px)
   - `pi.png`: 40x40px or larger
   - `calculator.png`: 50x50px or larger
   - `notebook.png`: 55x55px or larger

4. **After replacing:**
   - Restart your development server if it's running
   - Clear browser cache if images don't update (Ctrl+Shift+R)

---

## 📂 Current Public Folder Structure

```
public/
├── calculator.png      ← Floating image (calculator)
├── logo.png            ← Logo (navbar & login page)
├── notebook.png        ← Floating image (notebook)
├── pi.png              ← Floating image (pi symbol)
├── teacher-image.png   ← Teacher photo (homepage)
├── male.png
├── logo.svg
├── file.svg
├── globe.svg
├── next.svg
└── fonts/              (font files)
```

---

## ✅ Quick Checklist

- [ ] Replace `public/logo.png` (navbar & login logo)
- [ ] Replace `public/teacher-image.png` (homepage teacher photo)
- [ ] Replace `public/pi.png` (floating pi symbol)
- [ ] Replace `public/calculator.png` (floating calculator)
- [ ] Replace `public/notebook.png` (floating notebook)

---

**Note:** Make sure to keep the same file names when replacing images, as the code references them by these exact names.

