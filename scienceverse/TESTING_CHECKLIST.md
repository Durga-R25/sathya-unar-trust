# Local Testing Checklist

## IMPORTANT
**Do NOT deploy without completing ALL tests below successfully.**

## Test Environment
- Development Server: http://localhost:3000
- Firebase Project: (your project)

---

## 1. STUDENT ACCOUNT TESTING

### Profile Statistics ✓ HIGH PRIORITY
- [ ] Login as student
- [ ] Click Profile tab
- [ ] Verify "Videos Submitted" shows correct total count (should be 0 if new account)
- [ ] Verify "Pending Approval" section is visible and highlighted in yellow/orange
- [ ] Upload a new video and return to profile
- [ ] Verify "Pending Approval" count increases by 1
- [ ] Verify "Active Videos" shows 0 (since video is pending)
- [ ] Verify "Total Views" displays correctly

### Video Upload Flow
- [ ] Click Upload tab
- [ ] Record or upload a video file
- [ ] Fill in all required metadata (title, description, category, school info)
- [ ] Submit the video
- [ ] Verify success message appears
- [ ] Verify video goes to "pending" status (not visible in main feed)
- [ ] Return to profile - verify "Pending Approval" count increased

### Video Status After Approval
- [ ] After teacher approves (test in teacher account), return to student profile
- [ ] Verify "Pending Approval" count decreased
- [ ] Verify "Active Videos" count increased
- [ ] Video should now appear in Discovery feed

---

## 2. TEACHER ACCOUNT TESTING ✓ HIGH PRIORITY

### Profile Statistics
- [ ] Login as teacher
- [ ] Click Profile tab
- [ ] Verify "Students Managed" shows correct count
- [ ] Verify "School Videos" shows videos from your school
- [ ] Verify "Pending Approvals" is highlighted when students upload videos
- [ ] Verify no mock data (evaluations, school rank) is shown

### Access Restrictions ✓ CRITICAL
- [ ] Click More tab (should open Teacher Dashboard, not full admin panel)
- [ ] Verify ONLY these tabs are visible:
  - ✓ Video Approvals
  - ✓ My Students
  - ✓ Badges & Achievements
- [ ] Verify these tabs are NOT visible (admin only):
  - ✗ Dashboard
  - ✗ Users
  - ✗ Schools
  - ✗ Assignments
  - ✗ Competition
  - ✗ Categories
  - ✗ Export

### Video Approval Workflow ✓ CRITICAL
- [ ] In Teacher Dashboard, click "Video Approvals" tab
- [ ] Verify you see only pending videos from YOUR school
- [ ] Verify you do NOT see videos from other schools
- [ ] Click on a pending video to preview it
- [ ] Click "Approve" button
- [ ] Verify video status changes to "active"
- [ ] Verify video now appears in main Discovery feed
- [ ] Return to Profile - verify "Pending Approvals" count decreased

### "From My School" Clarification ✓ IMPORTANT
**"From My School" = Videos uploaded by students from your school**
- [ ] Verify video list only shows students with same schoolName as teacher
- [ ] Test with videos from different schools (should not appear)

---

## 3. ADMIN ACCOUNT TESTING

### Profile Statistics
- [ ] Login as admin
- [ ] Click Profile tab
- [ ] Verify "Total Users" shows real count from Firestore
- [ ] Verify "Total Videos" shows real count
- [ ] Verify "Pending Approvals" is highlighted
- [ ] Verify "Active Videos" shows count
- [ ] Verify no mock data is shown

### Full Admin Access
- [ ] Click More tab (should open full Admin Control Panel)
- [ ] Verify ALL tabs are visible:
  - Dashboard
  - Video Approvals
  - Badges & Achievements
  - Users (with sub-tabs: Teachers, Judges, Students)
  - Schools
  - Assignments
  - Competition
  - Categories
  - Export
- [ ] Admin can approve videos from ALL schools (not just one)

### Video Approval (Admin)
- [ ] Click "Video Approvals" tab
- [ ] Verify you see ALL pending videos from ALL schools
- [ ] Approve a video
- [ ] Verify it appears in Discovery feed

---

## 4. BADGE SYSTEM TESTING ✓ IMPORTANT

### Badge Calculation
- [ ] Login as student with uploaded videos
- [ ] Open More → Badges & Achievements (or from profile)
- [ ] Verify "Badges Earned" count matches actual achievements
- [ ] Check "My Badges" tab - should show earned badges only
- [ ] Check "All Badges" tab - should show all possible badges (earned + locked)

### Badge Earning Flow
- [ ] As student with 0 videos:
  - [ ] Verify "First Steps" badge is locked
- [ ] Upload first video (and get it approved):
  - [ ] Return to Badges page
  - [ ] Verify "First Steps" badge is now earned
- [ ] Upload 5 videos total:
  - [ ] Verify "Video Creator" badge is earned
- [ ] Get a video rated 4+ stars:
  - [ ] Verify "Quality Star" badge is earned

---

## 5. DISCOVERY FEED TESTING

### Real Videos Display
- [ ] Click Discover tab
- [ ] Verify feed shows ONLY approved/active videos (status='active')
- [ ] Verify pending videos do NOT appear
- [ ] Verify video player works correctly
- [ ] Test video swipe up/down navigation

### Filters and Search
- [ ] Test category filters
- [ ] Test school filters
- [ ] Search for specific videos by title
- [ ] Verify results are real videos from Firestore, not mock data

---

## 6. EVALUATION SYSTEM TESTING (Mock Elements Check)

### Evaluation Icons and Ratings ✓ VERIFY NOT MOCK
- [ ] Play a video in the feed
- [ ] Click "Evaluate" button
- [ ] Verify evaluation panel opens
- [ ] Rate video on all 4 dimensions:
  - Scientific Clarity
  - Humanity & Care
  - Real-Life Impact
  - Original Thinking
- [ ] Submit evaluation
- [ ] Verify evaluation is saved to Firestore
- [ ] Return to video - verify rating updated
- [ ] Click "View Evaluations" - verify your evaluation appears

### Aggregate Scores
- [ ] After multiple evaluations on a video:
  - [ ] Verify average score displays correctly
  - [ ] Verify total evaluation count is accurate

---

## 7. KNOWN ISSUES TO CHECK

### Issues from User Feedback:
1. **Student login not showing as pending** ✓ FIXED
   - Verify: Profile now shows "Pending Approval" count clearly

2. **Profile stats were mocked up** ✓ FIXED
   - Verify: All stats now load from Firestore with loading state

3. **Teacher login not showing pending approval** ✓ FIXED
   - Verify: Teacher profile shows "Pending Approvals" highlighted
   - Verify: Video Approvals tab shows pending videos from school

4. **Teacher should only approve students & videos** ✓ FIXED
   - Verify: Teacher dashboard has limited tabs (not full admin panel)

5. **Badges were mock up** ✓ FIXED
   - Verify: Badges calculate from real video data

---

## 8. DATA VERIFICATION

### Firestore Console Checks
1. Open Firebase Console → Firestore Database
2. Check `videos` collection:
   - [ ] Uploaded videos have correct fields (videoId, videoUrl, status, etc.)
   - [ ] Student videos have status='pending'
   - [ ] Approved videos have status='active'
   - [ ] All videos have uploaderSchool field
3. Check `users` collection:
   - [ ] Users have correct role (student/teacher/admin)
   - [ ] Teachers have schoolName field
   - [ ] Students have createdBy field (teacher uid)

---

## 9. CONSOLE ERROR CHECKS

### Browser Developer Console
- [ ] Open Chrome DevTools (F12)
- [ ] Check Console tab for errors:
  - [ ] No Firebase permission denied errors
  - [ ] No missing index errors
  - [ ] No undefined variable errors
  - [ ] No failed network requests

---

## 10. DEPLOYMENT READINESS

Only proceed with deployment if ALL of the following are true:

- [ ] All student profile statistics show real data
- [ ] Pending videos clearly visible for students
- [ ] Teacher can access limited dashboard (3 tabs only)
- [ ] Teacher can approve videos from their school only
- [ ] Admin can access full dashboard with all tabs
- [ ] Badges system calculates and displays correctly
- [ ] Video upload flow works end-to-end
- [ ] Discovery feed shows only approved videos
- [ ] No console errors in browser
- [ ] All mock/dummy data has been replaced with real data

---

## Testing Notes

**Browser**: Use Chrome or Edge for testing
**Clear Cache**: If changes don't appear, clear browser cache (Ctrl+Shift+Delete)
**Multiple Accounts**: Test with at least 1 student, 1 teacher, and 1 admin account

**Test Data Setup**:
1. Create 1 admin account
2. Admin creates 2-3 teacher accounts (different schools)
3. Each teacher creates 3-5 student accounts for their school
4. Students upload videos
5. Teachers approve some videos (leave some pending)
6. Verify stats update correctly

---

## Contact

If any test fails:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Check Firebase Console for data issues
4. Report findings before attempting deployment
