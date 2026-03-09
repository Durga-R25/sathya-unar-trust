# Complete Testing Guide - ScienceVerse
## From Scratch to Production Deployment

This guide will walk you through testing every phase of the ScienceVerse application, from initial setup to production deployment.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] Modern web browser (Chrome recommended)
- [ ] Text editor (VS Code recommended)
- [ ] Terminal/Command Prompt access

---

## Phase 0: Initial Setup

### Step 0.1: Verify Installation
```bash
node --version
# Should show v16.0.0 or higher

npm --version
# Should show 8.0.0 or higher
```

### Step 0.2: Navigate to Project
```bash
cd D:\Durga\AI\Claude\scienceapp
```

### Step 0.3: Install Dependencies
```bash
npm install
```

**Expected Output:**
- Installation completes without errors
- `node_modules` folder created
- May see deprecation warnings (safe to ignore)

### Step 0.4: Start Development Server
```bash
npm start
```

**Expected Output:**
- "Compiled successfully!" message
- Browser opens automatically at http://localhost:3000
- LoginScreen appears (Phase 6 authentication)

---

## Phase 1: Testing Core Video Player

### Step 1.1: Login to Access the App
1. You'll see the LoginScreen first
2. Select **"Student"** role
3. Enter any School ID (e.g., `TN-TEN-GOV123-ST456`)
4. Enter any password (e.g., `password123`)
5. Click **"Login as Student"**

**Expected Result:**
- ✅ Welcome message appears
- ✅ App loads with video feed
- ✅ You see the Home tab active

### Step 1.2: Test Video Feed
1. You should see a video playing automatically
2. Video title, student name, and school appear
3. Score circle (e.g., "4.2 ⭐") visible in top-right

**Expected Result:**
- ✅ Video auto-plays
- ✅ All metadata visible
- ✅ Smooth video playback

### Step 1.3: Test Swipe Navigation (Desktop)
1. Press **↓ (Down Arrow)** key on keyboard
2. Next video should load and auto-play
3. Press **↑ (Up Arrow)** key
4. Previous video should load

**Expected Result:**
- ✅ Smooth transitions between videos
- ✅ Each video auto-plays when visible
- ✅ Previous video pauses

### Step 1.4: Test Swipe Navigation (Mobile Simulation)
1. Open Chrome DevTools (F12)
2. Click **Toggle Device Toolbar** (Ctrl+Shift+M)
3. Select **"Moto G4"** or **"Galaxy S5"**
4. Click and drag upward on video (swipe up gesture)
5. Next video should appear

**Expected Result:**
- ✅ Touch gestures work
- ✅ Smooth swipe animation
- ✅ Videos change correctly

### Step 1.5: Test Video Controls
1. Click/tap on the video to pause
2. Click/tap again to resume
3. Check progress bar at bottom of video
4. Progress bar should update as video plays

**Expected Result:**
- ✅ Click to play/pause works
- ✅ Progress bar animates
- ✅ Video controls responsive

### Step 1.6: Test Score Display
1. Click the score circle (e.g., "4.2 ⭐")
2. Score breakdown modal should appear
3. Shows 4 dimensions with individual scores
4. Click **"Close"** or click outside to dismiss

**Expected Result:**
- ✅ Modal opens smoothly
- ✅ Shows all 4 dimensions
- ✅ Color-coded score bars
- ✅ Closes correctly

### Step 1.7: Test Bottom Navigation
1. Look at bottom navigation bar
2. 5 tabs visible: Home, Discover, Upload, Profile, More
3. Home tab should be active (highlighted)

**Expected Result:**
- ✅ All 5 tabs visible
- ✅ Home tab highlighted
- ✅ Icons clear and visible

**✅ Phase 1 Complete!** Video player working correctly.

---

## Phase 2: Testing Evaluation System

### Step 2.1: Open Evaluation Panel
1. While watching a video, click **"⭐ Rate"** button
2. Evaluation panel modal should appear
3. Shows current user role and weight (e.g., "Student - 10% weight")

**Expected Result:**
- ✅ Modal opens with smooth animation
- ✅ Shows 4 rating dimensions
- ✅ All stars are empty (not rated yet)

### Step 2.2: Test Star Ratings
**For each dimension, test star rating:**

1. **🔬 Scientific Clarity**
   - Hover over stars (desktop) - should highlight
   - Click on 4th star
   - 4 stars should fill in

2. **❤️ Humanity & Care**
   - Click on 5th star
   - All 5 stars should fill in

3. **🌍 Real-Life Impact**
   - Click on 3rd star
   - 3 stars should fill in

4. **💡 Original Thinking**
   - Click on 4th star
   - 4 stars should fill in

**Expected Result:**
- ✅ Stars highlight on hover
- ✅ Stars fill on click
- ✅ Rating value shows (e.g., "4/5")
- ✅ Average score calculates (should show 4.0)

### Step 2.3: Test Comment Field
1. Scroll down to comment field
2. Type: "Great explanation of photosynthesis! Very clear and engaging."
3. Character count should update (e.g., "62/500")

**Expected Result:**
- ✅ Can type in comment field
- ✅ Character counter updates
- ✅ Max 500 characters enforced

### Step 2.4: Submit Evaluation
1. Click **"Submit Evaluation"** button
2. Should see success animation
3. Modal should close after 2 seconds
4. Toast message: "Evaluation submitted successfully!"

**Expected Result:**
- ✅ Success checkmark animation
- ✅ Modal closes automatically
- ✅ Toast notification appears
- ✅ Returns to video feed

### Step 2.5: View Evaluation History
1. Click **"👥"** button (view evaluations)
2. Evaluation history modal opens
3. Should see evaluations grouped by role:
   - **Judges** (with 70% badges)
   - **Teachers** (with 20% badges)
   - **Students** (with 10% badges)

**Expected Result:**
- ✅ Modal shows all evaluations
- ✅ Grouped by role with colored badges
- ✅ Shows evaluator names, scores, comments
- ✅ Timestamps visible

### Step 2.6: Test Role Switching
1. Close evaluation history
2. Click on **role badge in header** (e.g., "🎓 student")
3. Should cycle to next role: Teacher
4. Toast: "Switched to Teacher role"
5. Click again → Judge → Admin → Student (cycles)

**Expected Result:**
- ✅ Role badge changes (🎓→👨‍🏫→⚖️→⚙️)
- ✅ Toast notification shows
- ✅ Cycles through all 4 roles

### Step 2.7: Test Different Role Evaluations
1. Switch to **Teacher** role
2. Click **"⭐ Rate"** on a video
3. Notice weight shows "Teacher - 20% weight"
4. Rate all dimensions and submit
5. Switch to **Judge** role
6. Click **"⭐ Rate"**
7. Notice weight shows "Judge - 70% weight"

**Expected Result:**
- ✅ Role-specific weights display correctly
- ✅ Each role can submit evaluations
- ✅ Evaluations appear in history with correct role badges

**✅ Phase 2 Complete!** Evaluation system working correctly.

---

## Phase 3: Testing Upload Flow

### Step 3.1: Open Upload Screen
1. Click **"➕ Upload"** tab in bottom navigation
2. Upload screen modal should appear
3. Shows two options: "📹 Record Video" and "📁 Upload Video"

**Expected Result:**
- ✅ Modal opens with smooth animation
- ✅ Two upload method cards visible
- ✅ Competition settings shown at bottom

### Step 3.2: Test Video Recorder (Camera)
1. Click **"📹 Record Video"** button
2. Browser asks for camera permission
3. Click **"Allow"**
4. Live camera preview appears

**Expected Result:**
- ✅ Camera permission prompt appears
- ✅ Camera preview loads
- ✅ Recording controls visible

### Step 3.3: Test Recording Controls
1. Click **"⏺ Start Recording"** button
2. Timer starts (00:00)
3. Progress bar animates
4. Record for 10 seconds
5. Click **"⏹ Stop Recording"**
6. Preview of recorded video appears

**Expected Result:**
- ✅ Recording starts with timer
- ✅ Timer updates every second
- ✅ Can stop recording
- ✅ Preview plays recorded video

**Note:** If you don't have a camera or want to skip recording, click "✕" to close and proceed to file upload.

### Step 3.4: Test File Upload
1. If in recorder, click **"Cancel"** to go back
2. Click **"📁 Upload Video"** button
3. File uploader screen appears
4. Drag-and-drop zone visible

**Expected Result:**
- ✅ Upload interface appears
- ✅ Drag-and-drop zone visible
- ✅ "Browse Files" button present

### Step 3.5: Select Video File
**Option A - Use Test Video (if available):**
1. Click **"📁 Browse Files"**
2. Navigate to any MP4 video file on your computer
3. Select the file

**Option B - Download Test Video:**
1. Download a small test video from: https://sample-videos.com/
2. Choose "Sample MP4 Video" (< 10MB)
3. Click **"📁 Browse Files"**
4. Select downloaded video

**Expected Result:**
- ✅ File picker opens
- ✅ Can select video file
- ✅ Video appears in preview

### Step 3.6: Fill Metadata Form
Metadata form should now be visible. Fill in:

1. **Title:** "Solar Energy Experiment"
   - Must be 10-100 characters
   - Character counter updates

2. **Description:** "In this video, I demonstrate how solar panels convert sunlight into electricity using a simple DIY setup with LEDs and a multimeter."
   - Must be 50-500 characters
   - Character counter updates

3. **Category:** Click dropdown → Select "Physics"

4. **Tags (optional):** "solar, renewable energy, electricity"

**Expected Result:**
- ✅ All fields accept input
- ✅ Character counters update
- ✅ Validation messages appear if requirements not met
- ✅ "Upload Video" button becomes enabled when valid

### Step 3.7: Submit Upload
1. Click **"Upload Video"** button
2. Upload progress screen appears
3. Shows:
   - Progress bar animating
   - Percentage (0% → 100%)
   - 4-step progress indicator
   - Warning not to close window

**Expected Result:**
- ✅ Progress screen appears
- ✅ Progress bar animates smoothly
- ✅ Percentage updates
- ✅ Step indicators light up sequentially

### Step 3.8: Upload Success
1. After progress reaches 100%
2. Success screen appears with checkmark animation
3. Message: "Video Uploaded Successfully!"
4. Modal auto-closes after 3 seconds

**Expected Result:**
- ✅ Success animation plays
- ✅ Success message shows
- ✅ Modal closes automatically
- ✅ Returns to video feed

**✅ Phase 3 Complete!** Upload flow working correctly.

---

## Phase 4: Testing Discovery & Search

### Step 4.1: Open Discovery Screen
1. Click **"🔍 Discover"** tab in bottom navigation
2. Discovery screen modal should appear
3. Three tabs at top: Videos, Trending, Leaderboard
4. Search bar at top
5. Filters button visible

**Expected Result:**
- ✅ Modal opens smoothly
- ✅ All 3 tabs visible
- ✅ Search bar ready to use
- ✅ Videos grid displays

### Step 4.2: Test Search Functionality
1. Click in search bar
2. Type: "solar"
3. Results filter in real-time
4. Should show only videos with "solar" in title/description/tags

**Try different searches:**
- "water"
- "AI"
- "physics"
- "chemistry"

**Expected Result:**
- ✅ Real-time filtering as you type
- ✅ Results update immediately
- ✅ Shows relevant videos only
- ✅ Can clear search with X button

### Step 4.3: Test Advanced Filters
1. Click **"Filters"** button
2. Filter panel slides in from right
3. Shows 5 filter options:
   - Category dropdown
   - School dropdown
   - District dropdown
   - Minimum Rating slider
   - Sort By dropdown

**Expected Result:**
- ✅ Filter panel appears
- ✅ All filter options visible
- ✅ Active filters badge shows count

### Step 4.4: Apply Filters
**Test each filter:**

1. **Category Filter:**
   - Select "Physics"
   - Click "Apply Filters"
   - Should show only Physics videos

2. **Rating Filter:**
   - Move "Minimum Rating" slider to 4.0
   - Click "Apply Filters"
   - Should show only videos rated 4.0+

3. **Sort Filter:**
   - Change "Sort By" to "Highest Rated"
   - Videos should reorder by score (highest first)

**Expected Result:**
- ✅ Filters apply correctly
- ✅ Active filters count badge updates (e.g., "3 active")
- ✅ Video grid updates with filtered results
- ✅ Can clear all filters

### Step 4.5: Test Video Grid
1. Look at the video grid
2. Each card should show:
   - Video thumbnail
   - Title
   - Student name and school
   - Category tag
   - Score badge
   - View count
   - Duration
   - 4-dimension score bars

3. Click on any video card

**Expected Result:**
- ✅ All metadata visible on cards
- ✅ Cards are responsive (adjust to screen size)
- ✅ Click shows "Selected: [Video Title]" toast
- ✅ Grid layout looks good

### Step 4.6: Test Trending Tab
1. Click **"Trending"** tab
2. Should show top 10 most evaluated videos
3. Each card has "🔥 Trending" badge
4. Shows evaluation count

**Expected Result:**
- ✅ Tab switches smoothly
- ✅ Shows exactly 10 videos
- ✅ Trending badges visible
- ✅ Sorted by evaluation count

### Step 4.7: Test Leaderboard Tab
1. Click **"Leaderboard"** tab
2. Two sub-sections appear:
   - **School Rankings**
   - **Category Rankings**

**School Rankings:**
- Top 3 schools have medal icons (🥇🥈🥉)
- Shows: Average Score, Videos, Evaluations, Views
- Color-coded cards (gold, silver, bronze)

**Category Rankings:**
- Shows all 10 categories
- Sorted by average score
- Shows video count and evaluations

**Expected Result:**
- ✅ Both ranking sections visible
- ✅ Top 3 have medals and special colors
- ✅ All statistics show correctly
- ✅ Rankings sorted properly

### Step 4.8: Test Mobile Responsiveness
1. Open Chrome DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Select "Moto G4"
4. Discovery screen should adapt:
   - Grid becomes 1 column
   - Search bar full width
   - Tabs stack if needed
   - Cards remain readable

**Expected Result:**
- ✅ Layout adapts to mobile
- ✅ All features still accessible
- ✅ Touch targets large enough (44px+)
- ✅ No horizontal scrolling

**✅ Phase 4 Complete!** Discovery and search working correctly.

---

## Phase 5: Testing Admin Configuration Panel

### Step 5.1: Switch to Admin Role
1. Close Discovery screen (if open)
2. Click **role badge in header** repeatedly
3. Cycle through: Student → Teacher → Judge → **Admin**
4. Role badge should show: "⚙️ admin"

**Expected Result:**
- ✅ Role switches to Admin
- ✅ Toast: "Switched to Admin role"
- ✅ Admin icon (⚙️) visible in header

### Step 5.2: Open Admin Panel
1. Click **"⋯ More"** tab in bottom navigation
2. Admin panel modal should appear
3. Gold gradient header with "⚙️ Admin Panel"
4. Four tabs visible: Dashboard, Settings, Categories, Export

**Expected Result:**
- ✅ Admin panel opens with gold theme
- ✅ All 4 tabs visible
- ✅ Dashboard tab active by default

### Step 5.3: Test Analytics Dashboard
Dashboard should show:

**Top Row (4 stat cards):**
- Total Videos (e.g., "5 videos")
- Total Evaluations (e.g., "12 evaluations")
- Total Views (e.g., "15.2K views")
- Total Schools (e.g., "4 schools")

**Bottom Row (4 activity cards):**
- Average Score (e.g., "4.3/5.0")
- Videos Today (e.g., "2 new")
- Videos This Week (e.g., "3 new")
- Evaluations Today (e.g., "5 new")

**Expected Result:**
- ✅ All 8 statistics display correctly
- ✅ Numbers match mock data
- ✅ Icons and labels clear
- ✅ Cards have hover effects

### Step 5.4: Test Competition Settings
1. Click **"Settings"** tab
2. Competition settings form appears

**Form fields visible:**
- Competition Name
- Start Date
- End Date
- Video Duration Limit (seconds)
- Max Submissions Per Student
- Checkboxes: Uploads Enabled, Evaluations Enabled

**Test editing:**
1. Change "Competition Name" to "District Science Fair 2025"
2. Change "Video Duration Limit" to 600 (10 minutes)
3. Uncheck "Uploads Enabled"
4. Click **"Save Settings"**
5. Toast should show: "Settings saved successfully!"

**Expected Result:**
- ✅ All form fields editable
- ✅ Validation works (e.g., dates, numbers)
- ✅ Save button works
- ✅ Success message appears

### Step 5.5: Test Category Manager
1. Click **"Categories"** tab
2. Two sections appear:
   - **Add New Category** (form at top)
   - **Existing Categories** (list below)

**Test Adding Category:**
1. Category Name: "Astronomy"
2. Icon: "🌌"
3. Click **"➕ Add"** button
4. New category appears in list below

**Test Toggling Category:**
1. Find "Physics" in the list
2. Click the **toggle button** (👁️ icon)
3. Category becomes inactive (grayed out)
4. Badge changes to "Inactive"
5. Click toggle again to re-activate

**Test Deleting Category:**
1. Click **"🗑️"** (delete) button on "Astronomy"
2. Confirmation prompt: "Delete this category?..."
3. Click "OK"
4. Category removed from list

**Expected Result:**
- ✅ Can add new categories
- ✅ Can toggle active/inactive
- ✅ Can delete categories (with confirmation)
- ✅ Categories update in real-time

### Step 5.6: Test Data Export
1. Click **"Export"** tab
2. Two export cards appear:
   - **📹 Export Videos**
   - **⭐ Export Evaluations**

**Test Video Export:**
1. Click **"Download Videos CSV"** button
2. CSV file downloads (e.g., `videos_export.csv`)
3. Open CSV in Excel or text editor
4. Should show columns: videoId, title, description, category, etc.

**Test Evaluation Export:**
1. Click **"Download Evaluations CSV"** button
2. CSV file downloads (e.g., `evaluations_export.csv`)
3. Open CSV
4. Should show: evaluationId, videoId, evaluatorName, scores, etc.

**Expected Result:**
- ✅ Both export buttons work
- ✅ CSV files download correctly
- ✅ Data is properly formatted
- ✅ All columns present

### Step 5.7: Test Access Control (Non-Admin)
1. Close Admin Panel
2. Switch to **Student** role (click role badge)
3. Click **"⋯ More"** tab
4. Should see **"🔒 Access Denied"** screen
5. Message: "Only administrators can access this panel"

**Expected Result:**
- ✅ Non-admin users can't access admin panel
- ✅ Access denied screen appears
- ✅ Clear error message
- ✅ Can close and return to app

**✅ Phase 5 Complete!** Admin panel working correctly.

---

## Phase 6: Testing Authentication & Profiles

### Step 6.1: Test Logout
1. Click **"👤 Profile"** tab in bottom navigation
2. Profile screen modal appears
3. Shows your current user info and stats
4. Scroll to bottom
5. Click **"🚪 Logout"** button
6. Confirmation: "Are you sure you want to logout?"
7. Click "OK"

**Expected Result:**
- ✅ Confirmation prompt appears
- ✅ After confirming, returns to LoginScreen
- ✅ Toast: "Logged out successfully"
- ✅ Session cleared

### Step 6.2: Test Student Login
1. On LoginScreen, select **"Student"** role
2. School ID field appears
3. Enter: `TN-TEN-GOV123-ST789` (any valid format)
4. Enter password: `student123`
5. Click **"Login as Student"**
6. Loading: "Logging in..." (1.5 seconds)
7. Success: App loads with welcome message

**Expected Result:**
- ✅ School ID field shows format info
- ✅ Login button shows correct role
- ✅ Loading state appears
- ✅ Successful login with toast message

### Step 6.3: Test School ID Validation
1. Logout and return to LoginScreen
2. Select **"Student"** role
3. Enter invalid School ID: `abc123`
4. Click **"Login as Student"**
5. Error message: "Invalid School ID format..."

**Try valid formats:**
- `TN-TEN-GOV123-ST456` ✅
- `TN-CHE-PVT001-ST001` ✅
- `KA-BLR-GOV555-ST999` ✅

**Expected Result:**
- ✅ Validation catches invalid formats
- ✅ Error message displays with shake animation
- ✅ Valid formats accepted
- ✅ Format converted to uppercase automatically

### Step 6.4: Test Teacher Login
1. Logout (if logged in)
2. On LoginScreen, select **"Teacher"** role
3. Email field appears (not School ID)
4. Enter: `teacher@example.com`
5. Enter password: `teacher123`
6. Click **"Login as Teacher"**
7. Success: App loads with teacher profile

**Expected Result:**
- ✅ Email field replaces School ID field
- ✅ Email validation works
- ✅ Login successful
- ✅ Role shows as "teacher" in header

### Step 6.5: Test Judge Login
1. Logout and return to LoginScreen
2. Select **"Judge"** role
3. Enter: `judge@example.com`
4. Enter password: `judge123`
5. Click **"Login as Judge"**

**Expected Result:**
- ✅ Judge login successful
- ✅ Role shows as "judge" in header (⚖️)

### Step 6.6: Test Admin Login
1. Logout and return to LoginScreen
2. Select **"Admin"** role
3. Enter: `admin@example.com`
4. Enter password: `admin123`
5. Click **"Login as Admin"**

**Expected Result:**
- ✅ Admin login successful
- ✅ Role shows as "admin" in header (⚙️)
- ✅ Can access Admin Panel (More tab)

### Step 6.7: Test Session Persistence
1. Login as any role
2. Wait for app to load completely
3. Refresh the page (F5 or Ctrl+R)
4. App should load directly (no login screen)
5. User still logged in with same role

**Expected Result:**
- ✅ No login screen after refresh
- ✅ User data persists
- ✅ Role maintained
- ✅ Session stored in localStorage

### Step 6.8: Test Profile Screen (All Roles)

**Login as Student and check profile:**
1. Login as Student
2. Click **"👤 Profile"** tab
3. Profile shows:
   - Avatar with student icon (🎓)
   - Name and role badge
   - School ID (in monospace font)
   - School name
   - Statistics: Videos, Views, Avg Score, Rank
   - Badges & Achievements section
   - Settings & Actions menu
   - Logout button

**Expected Result:**
- ✅ All student info displays
- ✅ Statistics show correctly
- ✅ Badges section visible
- ✅ School ID formatted properly

**Login as Teacher and check profile:**
1. Logout and login as Teacher
2. Click **"👤 Profile"** tab
3. Profile shows:
   - Avatar with teacher icon (👨‍🏫)
   - Email address
   - School name
   - Statistics: Students, Videos, Evaluations, School Rank

**Expected Result:**
- ✅ Teacher-specific info displays
- ✅ Different statistics than student
- ✅ No School ID (shows email instead)

**Login as Judge and check profile:**
1. Logout and login as Judge
2. Click **"👤 Profile"** tab
3. Profile shows:
   - Avatar with judge icon (⚖️)
   - Organization name
   - Specialization
   - Statistics: Evaluations, Videos Evaluated, Avg Time, Completion Rate

**Expected Result:**
- ✅ Judge-specific info displays
- ✅ Evaluation statistics shown
- ✅ Organization displayed

**Login as Admin and check profile:**
1. Logout and login as Admin
2. Click **"👤 Profile"** tab
3. Profile shows:
   - Avatar with admin icon (⚙️)
   - Organization
   - Access level: "Full System Access"
   - System statistics: Total Users, Videos, Evaluations, Uptime

**Expected Result:**
- ✅ Admin-specific info displays
- ✅ System-wide statistics shown
- ✅ Access level indicated

### Step 6.9: Test Password Visibility Toggle
1. Logout and return to LoginScreen
2. Enter any password
3. Click **"👁️"** (eye icon) next to password field
4. Password becomes visible as plain text
5. Click icon again
6. Password hidden again

**Expected Result:**
- ✅ Password toggles between hidden/visible
- ✅ Icon changes (👁️ ↔ 👁️‍🗨️)
- ✅ Works smoothly

**✅ Phase 6 Complete!** Authentication and profiles working correctly.

---

## Phase 7: Integration Testing (All Phases Together)

### Step 7.1: Complete User Journey - Student
**Scenario: New student logs in, watches videos, evaluates, and uploads**

1. **Login:**
   - LoginScreen → Select Student
   - Enter School ID: `TN-TEN-GOV123-ST001`
   - Password: `student2024`
   - Login successful

2. **Watch Videos:**
   - Auto-plays first video
   - Swipe up to watch 3 videos
   - Click score circles to see breakdowns

3. **Evaluate Video:**
   - Click "⭐ Rate" on current video
   - Rate all 4 dimensions (4, 5, 4, 5)
   - Add comment: "Excellent presentation!"
   - Submit evaluation

4. **Search for Videos:**
   - Click "🔍 Discover" tab
   - Search "chemistry"
   - View results
   - Click on a video card

5. **Upload Video:**
   - Click "➕ Upload" tab
   - Choose "Upload Video"
   - Select a test video file
   - Fill metadata:
     - Title: "Chemical Reactions Experiment"
     - Description: "Demonstrating acid-base reactions..."
     - Category: Chemistry
     - Tags: "chemistry, reactions"
   - Upload video

6. **View Profile:**
   - Click "👤 Profile" tab
   - Check statistics
   - View badges

7. **Logout:**
   - Click Logout button
   - Confirm logout

**Expected Result:**
- ✅ All actions flow smoothly
- ✅ No errors or crashes
- ✅ Data persists between tabs
- ✅ UI remains responsive

### Step 7.2: Complete User Journey - Teacher
**Scenario: Teacher logs in, evaluates videos, checks leaderboards**

1. **Login as Teacher:**
   - Select Teacher role
   - Email: `teacher@school.edu`
   - Login

2. **Review Student Videos:**
   - Watch 2-3 videos
   - Evaluate each with constructive feedback
   - Note: Teacher evaluations have 20% weight

3. **Check School Performance:**
   - Go to Discovery tab
   - Click Leaderboard
   - Check School Rankings
   - Find your school

4. **View Profile:**
   - Check teaching statistics
   - See how many videos supervised

**Expected Result:**
- ✅ Teacher workflow smooth
- ✅ Evaluations marked as "Teacher"
- ✅ Can see school performance
- ✅ Statistics accurate

### Step 7.3: Complete User Journey - Judge
**Scenario: Judge evaluates videos systematically**

1. **Login as Judge:**
   - Select Judge role
   - Email: `judge@committee.edu`
   - Login

2. **Evaluate Multiple Videos:**
   - Watch 5 videos in feed
   - Evaluate each professionally
   - Note: Judge evaluations have 70% weight
   - View evaluation history to see impact

3. **Check Trending:**
   - Discovery → Trending tab
   - See top videos
   - Evaluate any missing top videos

4. **View Evaluation Stats:**
   - Profile tab
   - Check: Evaluations given, videos evaluated

**Expected Result:**
- ✅ Judge workflow efficient
- ✅ High-weight evaluations reflected in scores
- ✅ Can track evaluation progress

### Step 7.4: Complete User Journey - Admin
**Scenario: Admin manages competition**

1. **Login as Admin:**
   - Select Admin role
   - Email: `admin@education.gov`
   - Login

2. **Review Dashboard:**
   - Click "More" tab
   - Check analytics dashboard
   - Note key metrics

3. **Configure Competition:**
   - Settings tab
   - Update competition dates
   - Adjust duration limits
   - Save settings

4. **Manage Categories:**
   - Categories tab
   - Add new category: "Robotics" 🤖
   - Toggle existing category
   - Delete test category

5. **Export Data:**
   - Export tab
   - Download Videos CSV
   - Download Evaluations CSV
   - Open both in Excel to verify

6. **Check All Users:**
   - Logout
   - Login as each role
   - Verify their access levels

**Expected Result:**
- ✅ Admin has full access
- ✅ Can modify all settings
- ✅ Data export works
- ✅ Other roles have appropriate restrictions

### Step 7.5: Cross-Feature Integration Test
**Test that all features work together:**

1. **Upload → Evaluate → Search:**
   - Upload a video as Student
   - Switch to Teacher, evaluate it
   - Search for it in Discovery
   - Verify it appears with evaluation

2. **Role Weights → Leaderboards:**
   - As Judge, give high scores (5, 5, 5, 5)
   - As Student, give low scores (2, 2, 2, 2)
   - Check video overall score
   - Should be closer to Judge scores (70% weight)
   - Check leaderboard ranking

3. **Admin Settings → User Experience:**
   - As Admin, disable uploads
   - Switch to Student
   - Try to upload (should see message or disabled state)
   - Re-enable as Admin
   - Verify Student can upload again

**Expected Result:**
- ✅ All features integrate seamlessly
- ✅ Data flows correctly between features
- ✅ No conflicts or errors
- ✅ Weighted scoring works as designed

### Step 7.6: Performance Test
1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Click **"Generate report"**
4. Wait for analysis to complete

**Check scores (targets):**
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >90
- PWA: 100

**Expected Result:**
- ✅ Good performance scores
- ✅ Fast load times
- ✅ No major issues flagged
- ✅ PWA requirements met

### Step 7.7: Mobile Responsiveness Test
1. Open Chrome DevTools
2. Toggle Device Toolbar
3. Test on multiple device sizes:
   - iPhone SE (375x667)
   - Moto G4 (360x640)
   - Galaxy S5 (360x640)
   - iPad (768x1024)

**Test on each device:**
- Login screen
- Video feed
- Evaluation panel
- Upload flow
- Discovery screen
- Profile screen

**Expected Result:**
- ✅ All screens adapt properly
- ✅ Text readable on small screens
- ✅ Buttons large enough to tap (44px+)
- ✅ No horizontal scrolling
- ✅ Gestures work on touch

### Step 7.8: Network Conditions Test
1. Chrome DevTools → Network tab
2. Change throttling to **"Slow 3G"**
3. Refresh page
4. Test key features:
   - Login
   - Video playback
   - Navigation
   - Upload

**Expected Result:**
- ✅ App remains usable on slow network
- ✅ Loading states appear
- ✅ Videos load progressively
- ✅ No crashes or timeouts

**✅ Phase 7 Complete!** All integration tests passing.

---

## Production Deployment (Phase 7 Extension)

### Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All 7 phases tested and working
- [ ] No console errors in browser (F12 → Console)
- [ ] All user journeys tested
- [ ] Performance scores acceptable (Lighthouse)
- [ ] Mobile responsiveness verified
- [ ] Slow network tested

### Deployment Steps

#### Step D.1: Create Firebase Project
**See FIREBASE_SETUP_GUIDE.md for complete instructions**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `scienceverse-competition`
4. Disable Analytics (optional)
5. Click "Create project"

#### Step D.2: Register Web App
1. Click "Add app" → Web icon
2. App nickname: "ScienceVerse Web"
3. Check "Also set up Firebase Hosting"
4. Register app
5. Copy Firebase configuration

#### Step D.3: Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### Step D.4: Initialize Firebase
```bash
firebase init
```

Select:
- Firestore
- Functions
- Hosting
- Storage

#### Step D.5: Configure Environment
Create `.env` file:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

#### Step D.6: Build for Production
```bash
npm run build
```

Expected output:
- `build/` folder created
- Optimized bundle
- No errors

#### Step D.7: Test Production Build Locally
```bash
firebase serve --only hosting
```

Open http://localhost:5000 and test all features again.

#### Step D.8: Deploy to Firebase
```bash
firebase deploy
```

Wait for deployment to complete.

#### Step D.9: Verify Production Deployment
1. Open production URL (e.g., `https://scienceverse-competition.web.app`)
2. Run through all Phase 7 integration tests again
3. Check Lighthouse scores on production
4. Test from real mobile device

#### Step D.10: Monitor Deployment
1. Firebase Console → Hosting
2. Check deployment status
3. Monitor traffic
4. Check for errors in Functions logs

**Expected Result:**
- ✅ App deployed successfully
- ✅ Production URL accessible
- ✅ All features work in production
- ✅ No deployment errors

---

## Troubleshooting Common Issues

### Issue: npm install fails
**Solution:**
```bash
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install
```

### Issue: App won't start (port 3000 in use)
**Solution:**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
set PORT=3001 && npm start
```

### Issue: Videos won't play
**Solution:**
- Check browser console for errors (F12)
- Verify video file format (MP4, WebM, MOV)
- Check video file size (< 50MB)
- Try different video file

### Issue: Camera not working
**Solution:**
- Browser must have camera permission
- Chrome/Firefox only (no Safari on Desktop)
- Use HTTPS (localhost is ok for testing)
- Check if camera is being used by another app

### Issue: Firebase deployment fails
**Solution:**
```bash
# Re-authenticate
firebase logout
firebase login

# Verify project
firebase use --add

# Try deploying specific service
firebase deploy --only hosting
```

### Issue: Login screen doesn't appear after Phase 6
**Solution:**
- Clear localStorage: F12 → Application → Local Storage → Clear All
- Refresh page
- Should show login screen

### Issue: Mock data not showing
**Solution:**
- Check files exist:
  - `src/data/mockVideos.js`
  - `src/data/mockEvaluations.js`
- Verify imports in App.js
- Check browser console for import errors

---

## Testing Completion Checklist

Use this checklist to track your testing progress:

### Phase 1: Video Player
- [ ] Videos auto-play
- [ ] Swipe navigation works (keyboard)
- [ ] Swipe navigation works (touch)
- [ ] Video controls work
- [ ] Score display works
- [ ] Bottom navigation visible

### Phase 2: Evaluation System
- [ ] Evaluation panel opens
- [ ] Star ratings work
- [ ] Comment field works
- [ ] Submission works
- [ ] Evaluation history shows
- [ ] Role switching works
- [ ] Different role evaluations work

### Phase 3: Upload Flow
- [ ] Upload screen opens
- [ ] Camera recording works (or tested alternative)
- [ ] File upload works
- [ ] Metadata form validates
- [ ] Upload progress shows
- [ ] Success confirmation appears

### Phase 4: Discovery & Search
- [ ] Discovery screen opens
- [ ] Search works
- [ ] Filters work
- [ ] Video grid displays
- [ ] Trending tab works
- [ ] Leaderboard tab works
- [ ] Mobile responsive

### Phase 5: Admin Panel
- [ ] Admin panel opens (admin role only)
- [ ] Dashboard shows statistics
- [ ] Settings can be updated
- [ ] Categories can be managed
- [ ] Data export works
- [ ] Access control works (non-admin blocked)

### Phase 6: Authentication
- [ ] Student login works
- [ ] School ID validation works
- [ ] Teacher login works
- [ ] Judge login works
- [ ] Admin login works
- [ ] Session persistence works
- [ ] Profile screens show correctly
- [ ] Logout works
- [ ] Password toggle works

### Phase 7: Integration
- [ ] Complete student journey works
- [ ] Complete teacher journey works
- [ ] Complete judge journey works
- [ ] Complete admin journey works
- [ ] Cross-feature integration works
- [ ] Performance scores good
- [ ] Mobile responsiveness verified
- [ ] Slow network tested

### Deployment (Optional)
- [ ] Firebase project created
- [ ] Environment configured
- [ ] Production build successful
- [ ] Local production test passed
- [ ] Deployed to Firebase
- [ ] Production URL accessible
- [ ] Production features verified

---

## Next Steps After Testing

Once all testing is complete:

1. **Document any issues found** - Create list of bugs to fix
2. **Optimize performance** - Address any Lighthouse warnings
3. **Gather user feedback** - Test with 5-10 beta users
4. **Plan Firebase integration** - Follow FIREBASE_SETUP_GUIDE.md
5. **Deploy to production** - Follow DEPLOYMENT_GUIDE.md
6. **Monitor usage** - Set up analytics and error tracking

---

**Congratulations!** 🎉

If you've completed all tests successfully, your ScienceVerse platform is ready for production deployment!

**Total Testing Time:** ~2-3 hours for thorough testing
**Phases Tested:** 7/7
**Features Verified:** 50+ features
**User Journeys:** 4 complete flows

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Complete Testing Guide ✅
