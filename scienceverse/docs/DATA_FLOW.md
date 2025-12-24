# ScienceVerse - Data Flow Diagrams

## Table of Contents
- [Overview](#overview)
- [Authentication Flows](#authentication-flows)
- [Video Upload Flow](#video-upload-flow)
- [Video Approval Flow](#video-approval-flow)
- [Video Playback Flow](#video-playback-flow)
- [Evaluation Flow](#evaluation-flow)
- [Notification Flow](#notification-flow)
- [Discovery Flow](#discovery-flow)
- [Admin Operations Flow](#admin-operations-flow)
- [Error Handling Flows](#error-handling-flows)
- [Real-Time Data Synchronization](#real-time-data-synchronization)

---

## Overview

This document provides detailed data flow diagrams for all major operations in the ScienceVerse platform. Each flow shows the complete path of data from user action to final result, including all intermediate processing steps, validations, and error handling.

### Diagram Conventions

```
→   : Data flow direction
┌─┐ : Process/Component
│ │ : Data store
◆   : Decision point
⚠   : Error handling
✓   : Success state
```

---

## Authentication Flows

### 1. User Registration Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Registration Flow                         │
└──────────────────────────────────────────────────────────────┘

User Input (LoginScreen.js)
     │
     ├─ Name: string
     ├─ Email: string
     ├─ Password: string
     ├─ School Name: string
     └─ Role: student|teacher|judge|admin
     │
     ▼
┌────────────────────┐
│  Validate Input    │
│  - Required fields │
│  - Email format    │
│  - Password length │
└─────────┬──────────┘
          │
          ▼
     ◆ Valid?
     ├─ No → Show error message → Return to form
     │
     └─ Yes
          │
          ▼
┌──────────────────────────────────┐
│  Firebase Authentication         │
│  createUserWithEmailAndPassword  │
└────────────┬─────────────────────┘
             │
             ▼
        ◆ Success?
        ├─ No → ⚠ Handle error (email exists, weak password)
        │        └→ Show error → Return to form
        │
        └─ Yes
             │
             ├─ User UID generated
             │
             ▼
┌──────────────────────────────┐
│  Create User Document        │
│  Firestore: users/{uid}      │
│  Data:                       │
│    - uid                     │
│    - email                   │
│    - name                    │
│    - role                    │
│    - schoolName              │
│    - createdAt               │
│    - badges: []              │
│    - totalScore: 0           │
└─────────┬────────────────────┘
          │
          ▼
     ◆ Success?
     ├─ No → ⚠ Rollback: Delete auth account
     │        └→ Show error → Return to form
     │
     └─ Yes
          │
          ├─ User document created
          │
          ▼
┌──────────────────────────┐
│  Store in LocalStorage   │
│  Key: scienceverse_user  │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│  Update Context          │
│  UserContext.setUser     │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│  Navigate to Home        │
│  ✓ Registration Success  │
└──────────────────────────┘
```

**Data Transformation:**
```javascript
// Input
{
  name: "John Doe",
  email: "john@school.edu",
  password: "SecurePass123",
  schoolName: "Springfield High",
  role: "student"
}

// Firebase Auth Response
{
  uid: "abc123xyz",
  email: "john@school.edu"
}

// Firestore Document (users/abc123xyz)
{
  uid: "abc123xyz",
  email: "john@school.edu",
  name: "John Doe",
  role: "student",
  schoolName: "Springfield High",
  createdAt: "2024-03-15T10:30:00Z",
  badges: [],
  totalScore: 0
}

// Context State
{
  currentUser: {
    uid: "abc123xyz",
    email: "john@school.edu",
    name: "John Doe",
    role: "student",
    schoolName: "Springfield High",
    createdAt: "2024-03-15T10:30:00Z",
    badges: [],
    totalScore: 0
  }
}
```

---

### 2. User Login Flow

```
┌──────────────────────────────────────────────────────────────┐
│                       Login Flow                             │
└──────────────────────────────────────────────────────────────┘

User Input (LoginScreen.js)
     │
     ├─ Email: string
     └─ Password: string
     │
     ▼
┌────────────────────┐
│  Validate Input    │
│  - Required fields │
│  - Email format    │
└─────────┬──────────┘
          │
          ▼
     ◆ Valid?
     ├─ No → Show error → Return to form
     │
     └─ Yes
          │
          ▼
┌──────────────────────────────────┐
│  Firebase Authentication         │
│  signInWithEmailAndPassword      │
└────────────┬─────────────────────┘
             │
             ▼
        ◆ Success?
        ├─ No → ⚠ Handle error
        │        ├─ Invalid credentials
        │        ├─ User not found
        │        └─ Too many attempts
        │        └→ Show error → Return to form
        │
        └─ Yes
             │
             ├─ Auth token generated
             │
             ▼
┌──────────────────────────────────────┐
│  Fetch User Profile                  │
│  Firestore: users/{uid}              │
│  getDoc(doc(db, 'users', uid))       │
└────────────┬─────────────────────────┘
             │
             ▼
        ◆ Exists?
        ├─ No → ⚠ User profile not found
        │        └→ Show error → Logout → Return to login
        │
        └─ Yes
             │
             ├─ User data retrieved
             │
             ▼
┌──────────────────────────────────────┐
│  Merge Auth + Profile Data           │
│  {                                   │
│    uid: auth.uid,                    │
│    email: auth.email,                │
│    ...profileData                    │
│  }                                   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Store in LocalStorage               │
│  localStorage.setItem(...)           │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Update Context                      │
│  UserContext.setUser(userData)       │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Load Initial Data                   │
│  ├─ Videos                           │
│  ├─ Evaluations                      │
│  └─ Notifications                    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Navigate to Home                    │
│  ✓ Login Success                     │
└──────────────────────────────────────┘
```

---

### 3. Session Restoration Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  Session Restoration Flow                    │
└──────────────────────────────────────────────────────────────┘

App Mount (useEffect)
     │
     ▼
┌──────────────────────────────────────┐
│  Check LocalStorage                  │
│  localStorage.getItem(               │
│    'scienceverse_user'               │
│  )                                   │
└────────────┬─────────────────────────┘
             │
             ▼
        ◆ Exists?
        ├─ No → Show login screen
        │
        └─ Yes
             │
             ├─ Stored user data found
             │
             ▼
┌──────────────────────────────────────┐
│  Parse JSON                          │
│  JSON.parse(storedData)              │
└────────────┬─────────────────────────┘
             │
             ▼
        ◆ Valid JSON?
        ├─ No → ⚠ Clear storage → Show login
        │
        └─ Yes
             │
             ▼
┌──────────────────────────────────────┐
│  Verify Firebase Auth State          │
│  onAuthStateChanged(auth, ...)       │
└────────────┬─────────────────────────┘
             │
             ▼
        ◆ Authenticated?
        ├─ No → ⚠ Clear storage → Show login
        │        (Session expired)
        │
        └─ Yes
             │
             ├─ Auth token valid
             │
             ▼
┌──────────────────────────────────────┐
│  Restore User Context                │
│  UserContext.setUser(userData)       │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Load App Data                       │
│  ├─ Videos                           │
│  ├─ Evaluations                      │
│  └─ Notifications                    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Show Home Screen                    │
│  ✓ Session Restored                  │
└──────────────────────────────────────┘
```

---

## Video Upload Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Video Upload Flow                        │
└──────────────────────────────────────────────────────────────┘

User (UploadScreen.js)
     │
     ├─ Select video file
     ├─ Enter title
     ├─ Enter description
     └─ Select category
     │
     ▼
┌────────────────────────────────────────┐
│  Client-Side Validation                │
│  ├─ Required fields                    │
│  ├─ File size < 100MB                  │
│  ├─ File type: video/*                 │
│  └─ Title length < 100 chars           │
└─────────┬──────────────────────────────┘
          │
          ▼
     ◆ Valid?
     ├─ No → Show validation errors → Return
     │
     └─ Yes
          │
          ├─ Generate video ID
          ├─ videoId = `video_${timestamp}_${random}`
          │
          ▼
┌──────────────────────────────────────────┐
│  Upload Video File                       │
│  Firebase Storage: videos/{videoId}/...  │
│  uploadBytesResumable(...)               │
└────────┬─────────────────────────────────┘
         │
         ├─ Monitor progress (0-80%)
         │  └─ Update UI progressBar
         │
         ▼
    ◆ Success?
    ├─ No → ⚠ Upload failed
    │        ├─ Network error
    │        ├─ File too large
    │        └─ Permission denied
    │        └→ Show error → Allow retry
    │
    └─ Yes
         │
         ├─ videoDownloadURL obtained
         │
         ▼
┌──────────────────────────────────────────┐
│  Generate Thumbnail (Client-Side)       │
│  1. Create video element                │
│  2. Load video file                     │
│  3. Seek to 1 second                    │
│  4. Capture frame to canvas             │
│  5. Convert to JPEG blob (80% quality)  │
└────────┬─────────────────────────────────┘
         │
         ├─ Update progress (85%)
         │
         ▼
    ◆ Success?
    ├─ No → ⚠ Continue without thumbnail
    │        └─ thumbnailURL = ''
    │
    └─ Yes
         │
         ├─ thumbnailBlob generated
         │
         ▼
┌──────────────────────────────────────────┐
│  Upload Thumbnail                        │
│  Firebase Storage:                       │
│    thumbnails/{videoId}/thumbnail.jpg    │
└────────┬─────────────────────────────────┘
         │
         ├─ Update progress (90%)
         │
         ▼
    ◆ Success?
    ├─ No → ⚠ Continue without thumbnail
    │
    └─ Yes
         │
         ├─ thumbnailURL obtained
         │
         ▼
┌──────────────────────────────────────────┐
│  Extract Video Duration                  │
│  Load video metadata                     │
│  duration = video.duration               │
└────────┬─────────────────────────────────┘
         │
         ├─ Update progress (95%)
         │
         ▼
┌──────────────────────────────────────────┐
│  Create Video Document                   │
│  Firestore: videos collection            │
│  addDoc(collection(db, 'videos'), {      │
│    videoId,                              │
│    title,                                │
│    description,                          │
│    category,                             │
│    videoUrl: downloadURL,                │
│    thumbnailUrl: thumbnailURL,           │
│    duration,                             │
│    uploaderId: currentUser.uid,          │
│    uploaderName: currentUser.name,       │
│    uploaderSchool: currentUser.schoolName│
│    status: (admin ? 'active':'pending'), │
│    createdAt: new Date().toISOString(),  │
│    views: 0,                             │
│    likes: 0                              │
│  })                                      │
└────────┬─────────────────────────────────┘
         │
         ▼
    ◆ Success?
    ├─ No → ⚠ Firestore error
    │        ├─ Delete uploaded files
    │        └→ Show error → Allow retry
    │
    └─ Yes
         │
         ├─ Video document created
         ├─ Update progress (100%)
         │
         ▼
┌──────────────────────────────────────────┐
│  Create Notification (if not admin)     │
│  Firestore: notifications collection     │
│  Notify teachers/admins of new video    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Show Success Message                    │
│  ✓ "Video uploaded successfully!"       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Navigate to Home/My Videos              │
│  Video appears in feed (if approved)     │
└──────────────────────────────────────────┘
```

**Data Transformation:**
```javascript
// Input
{
  title: "Volcano Science Experiment",
  description: "Learn how to make a volcano...",
  category: "Chemistry",
  videoFile: File (50MB)
}

// Generated
videoId = "video_1710501234567_abc123xyz"

// Upload Progress Events
{
  progress: 20,  // 0-100%
  bytesTransferred: 10485760,
  totalBytes: 52428800
}

// Firestore Document (videos collection)
{
  videoId: "video_1710501234567_abc123xyz",
  title: "Volcano Science Experiment",
  description: "Learn how to make a volcano...",
  category: "Chemistry",
  videoUrl: "https://firebasestorage...videos/video_1710.../video.mp4",
  thumbnailUrl: "https://firebasestorage...thumbnails/video_1710.../thumbnail.jpg",
  duration: 120,  // seconds
  uploaderId: "abc123xyz",
  uploaderName: "John Doe",
  uploaderSchool: "Springfield High",
  status: "pending",
  createdAt: "2024-03-15T12:00:00Z",
  views: 0,
  likes: 0
}
```

---

## Video Approval Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Video Approval Flow                       │
└──────────────────────────────────────────────────────────────┘

Teacher/Admin (AdminPanel.js)
     │
     ├─ View pending videos list
     ├─ Select video to review
     └─ Click "Approve" button
     │
     ▼
┌────────────────────────────────────────┐
│  Verify Permission                     │
│  Check:                                │
│  ├─ User is teacher/admin              │
│  └─ If teacher, same school as video  │
└─────────┬──────────────────────────────┘
          │
          ▼
     ◆ Authorized?
     ├─ No → ⚠ Permission denied
     │        └→ Show error message
     │
     └─ Yes
          │
          ▼
┌──────────────────────────────────────────┐
│  Confirmation Dialog                     │
│  "Approve this video?"                   │
└─────────┬────────────────────────────────┘
          │
          ▼
     ◆ Confirmed?
     ├─ No → Cancel → Return to list
     │
     └─ Yes
          │
          ▼
┌──────────────────────────────────────────┐
│  Query Video Document                    │
│  Firestore:                              │
│  query(collection('videos'),             │
│    where('videoId', '==', videoId))      │
└─────────┬────────────────────────────────┘
          │
          ▼
     ◆ Found?
     ├─ No → ⚠ Video not found
     │
     └─ Yes
          │
          ├─ Video document retrieved
          │
          ▼
┌──────────────────────────────────────────┐
│  Security Rules Check                    │
│  Firestore Rules Engine:                 │
│  ├─ isTeacher() &&                       │
│  │   resource.uploaderSchool ==          │
│  │   getUserData().schoolName            │
│  └─ Only update allowed fields:          │
│      [status, approvedBy, approvedAt]    │
└─────────┬────────────────────────────────┘
          │
          ▼
     ◆ Rules pass?
     ├─ No → ⚠ Permission denied
     │        └→ Error: "Insufficient permissions"
     │
     └─ Yes
          │
          ▼
┌──────────────────────────────────────────┐
│  Update Video Document                   │
│  Firestore: updateDoc(videoRef, {        │
│    status: 'active',                     │
│    approvedBy: currentUser.name,         │
│    approvedAt: new Date().toISOString()  │
│  })                                      │
└─────────┬────────────────────────────────┘
          │
          ▼
     ◆ Success?
     ├─ No → ⚠ Update failed
     │        └→ Show error → Allow retry
     │
     └─ Yes
          │
          ├─ Video status changed to 'active'
          │
          ▼
┌──────────────────────────────────────────┐
│  Create Notification for Uploader        │
│  Firestore: notifications collection     │
│  addDoc(collection('notifications'), {   │
│    userId: video.uploaderId,             │
│    title: 'Video Approved!',             │
│    message: 'Your video "..." has been   │
│              approved and is now live',  │
│    icon: '✅',                           │
│    type: 'approval',                     │
│    read: false,                          │
│    createdAt: new Date().toISOString()   │
│  })                                      │
└─────────┬────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────┐
│  Update Local State                      │
│  ├─ Remove from pending list             │
│  ├─ Add to active videos list            │
│  └─ Update UI                            │
└─────────┬────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────┐
│  Show Success Toast                      │
│  ✓ "Video approved successfully!"       │
└─────────┬────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────┐
│  Video Now Visible in:                   │
│  ├─ Home feed (all users)                │
│  ├─ Discovery screen                     │
│  └─ Uploader's profile                   │
└──────────────────────────────────────────┘
```

**Firestore Security Rules (from firestore.rules):**
```javascript
allow update: if isOwner(resource.data.uploaderId) || isAdmin() || (
  isTeacher() &&
  resource.data.uploaderSchool == getUserData().schoolName &&
  request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['status', 'approvedBy', 'approvedAt'])
);
```

---

## Video Playback Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Video Playback Flow                       │
└──────────────────────────────────────────────────────────────┘

User Action
     │
     ├─ Swipe up/down in feed
     ├─ Click video in discovery
     └─ Navigate to video directly
     │
     ▼
┌────────────────────────────────────────┐
│  Determine Target Video                │
│  ├─ From feed: currentIndex ± 1        │
│  ├─ From discovery: selected videoId   │
│  └─ Direct: URL parameter              │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Load Video Data                       │
│  videos[targetIndex] or                │
│  find(v => v.videoId === targetId)     │
└─────────┬──────────────────────────────┘
          │
          ▼
     ◆ Video exists?
     ├─ No → ⚠ Video not found
     │        └→ Show error → Return to feed
     │
     └─ Yes
          │
          ├─ Video object retrieved
          │
          ▼
┌────────────────────────────────────────┐
│  Check Video Status                    │
│  video.status === 'active'             │
└─────────┬──────────────────────────────┘
          │
          ▼
     ◆ Active?
     ├─ No → Show "Video not available"
     │
     └─ Yes
          │
          ▼
┌────────────────────────────────────────┐
│  Render VideoPlayer Component          │
│  Props: { video, currentUser, ... }   │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Load Video from CDN                   │
│  <video src={video.videoUrl} />        │
│                                        │
│  Firebase Storage CDN:                 │
│  1. Resolve nearest edge location     │
│  2. Check edge cache                  │
│  3. Serve from cache or fetch origin │
└─────────┬──────────────────────────────┘
          │
          ├─ Video buffering...
          │
          ▼
     ◆ Ready?
     ├─ No → Show loading spinner
     │        ├─ onWaiting event
     │        └─ Network slow/failed
     │
     └─ Yes
          │
          ├─ onCanPlay event
          │
          ▼
┌────────────────────────────────────────┐
│  Auto-play Video                       │
│  videoRef.current.play()               │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Load Video Metadata                   │
│  ├─ Load evaluations for this video   │
│  ├─ Calculate average score           │
│  ├─ Load uploader info                │
│  └─ Check if user can evaluate        │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Update View Count (Future)            │
│  Firestore: increment views by 1       │
│  (Throttled: once per user per video)  │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Display Video Player                  │
│  ├─ Video player with controls         │
│  ├─ Video info overlay                 │
│  ├─ Action buttons:                    │
│  │   - Evaluate (if permitted)         │
│  │   - View Evaluations                │
│  │   - Like (future)                   │
│  │   - Share (future)                  │
│  └─ Uploader info                      │
└─────────┬──────────────────────────────┘
          │
          ▼
     User Interaction
     ├─ Play/Pause → Toggle playback
     ├─ Mute/Unmute → Toggle audio
     ├─ Swipe → Next/Previous video
     ├─ Click Evaluate → Open evaluation form
     └─ Click Info → Show/Hide description
```

**Performance Optimization:**
```javascript
// CDN Edge Locations
User Location: Mumbai, India
   ↓
Nearest Edge: Mumbai (Asia South)
   ├─ Latency: 20-50ms
   ├─ Cache Hit: 85% (video likely cached)
   └─ Bandwidth: Full speed

// vs Without CDN
User Location: Mumbai, India
   ↓
Origin Server: US Central
   ├─ Latency: 300-500ms
   ├─ No caching
   └─ Bandwidth: Limited by distance

// Buffering Time Comparison
With CDN: 1-2 seconds
Without CDN: 8-15 seconds
Improvement: 80-85% faster
```

---

## Evaluation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Evaluation Flow                          │
└──────────────────────────────────────────────────────────────┘

Teacher/Judge (VideoPlayer)
     │
     ├─ Watch video
     └─ Click "Evaluate" button
     │
     ▼
┌────────────────────────────────────────┐
│  Check Permission                      │
│  canEvaluate(currentUser, video):      │
│  ├─ Not a student                      │
│  ├─ Not video owner                    │
│  └─ If teacher, same school           │
└─────────┬──────────────────────────────┘
          │
          ▼
     ◆ Permitted?
     ├─ No → Show "Cannot evaluate" message
     │
     └─ Yes
          │
          ▼
┌────────────────────────────────────────┐
│  Open EvaluationForm                   │
│  Props: { video, currentUser }        │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  User Rates Video                      │
│  4 Dimensions (1-5 stars each):        │
│  ├─ Scientific Clarity                 │
│  ├─ Humanity & Care                    │
│  ├─ Real-Life Impact                   │
│  └─ Original Thinking                  │
│                                        │
│  Plus:                                 │
│  └─ Comments (optional)                │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Validate Form                         │
│  ├─ All 4 dimensions rated (required)  │
│  └─ Comments length check (optional)   │
└─────────┬──────────────────────────────┘
          │
          ▼
     ◆ Valid?
     ├─ No → Show validation errors
     │        └→ Return to form
     │
     └─ Yes
          │
          ▼
┌────────────────────────────────────────┐
│  Calculate Overall Score               │
│  overallScore = (                      │
│    scientificClarity +                 │
│    humanityAndCare +                   │
│    realLifeImpact +                    │
│    originalThinking                    │
│  ) / 4                                 │
└─────────┬──────────────────────────────┘
          │
          ├─ overallScore: 1.0 - 5.0
          │
          ▼
┌────────────────────────────────────────┐
│  Generate Evaluation ID                │
│  evaluationId = `eval_${timestamp}_    │
│                  ${random}`            │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Create Evaluation Document            │
│  Firestore: evaluations collection     │
│  addDoc(collection('evaluations'), {   │
│    evaluationId,                       │
│    videoId,                            │
│    evaluatorId: currentUser.uid,       │
│    evaluatorName,                      │
│    evaluatorRole,                      │
│    scientificClarity,                  │
│    humanityAndCare,                    │
│    realLifeImpact,                     │
│    originalThinking,                   │
│    overallScore,                       │
│    comments,                           │
│    createdAt: new Date().toISOString() │
│  })                                    │
└─────────┬──────────────────────────────┘
          │
          ▼
     ◆ Success?
     ├─ No → ⚠ Firestore error
     │        └→ Show error → Allow retry
     │
     └─ Yes
          │
          ├─ Evaluation saved
          │
          ▼
┌────────────────────────────────────────┐
│  Update Video Aggregate Score          │
│  1. Query all evaluations for video   │
│  2. Calculate new average              │
│  3. Update video document:             │
│     - averageScore                     │
│     - evaluationCount                  │
└─────────┬──────────────────────────────┘
          │
          ▼
     ◆ Success?
     ├─ No → ⚠ Log warning (evaluation saved)
     │
     └─ Yes
          │
          ▼
┌────────────────────────────────────────┐
│  Create Notification for Uploader      │
│  Firestore: notifications collection   │
│  addDoc(collection('notifications'), { │
│    userId: video.uploaderId,           │
│    title: 'New Evaluation Received',   │
│    message: '{evaluatorName} rated     │
│              your video "{title}"',    │
│    icon: '⭐',                         │
│    type: 'evaluation',                 │
│    read: false,                        │
│    createdAt: new Date().toISOString() │
│  })                                    │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Update Badge Progress (Future)        │
│  Check if evaluator earned:            │
│  ├─ "Active Evaluator" badge           │
│  └─ Other evaluation-based badges      │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Close Evaluation Form                 │
│  Show Success Toast:                   │
│  ✓ "Evaluation submitted successfully!"│
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Update UI                             │
│  ├─ Video now shows updated score      │
│  ├─ Evaluation count incremented       │
│  └─ "Evaluate" button disabled (future)│
│      (prevent duplicate evaluations)   │
└──────────────────────────────────────────┘
```

**Data Transformation:**
```javascript
// Input
{
  scientificClarity: 5,
  humanityAndCare: 4,
  realLifeImpact: 5,
  originalThinking: 4,
  comments: "Excellent demonstration with clear explanations..."
}

// Calculated
overallScore = (5 + 4 + 5 + 4) / 4 = 4.5

// Evaluation Document (evaluations collection)
{
  evaluationId: "eval_1710501234567_xyz789",
  videoId: "video_1710501234567_abc123xyz",
  evaluatorId: "teacher123",
  evaluatorName: "Dr. Smith",
  evaluatorRole: "teacher",
  scientificClarity: 5,
  humanityAndCare: 4,
  realLifeImpact: 5,
  originalThinking: 4,
  overallScore: 4.5,
  comments: "Excellent demonstration...",
  createdAt: "2024-03-15T14:30:00Z"
}

// Updated Video Document
{
  ...existing fields,
  averageScore: 4.3,  // Average of all evaluations
  evaluationCount: 3  // Total number of evaluations
}

// Notification Document
{
  userId: "student123",
  title: "New Evaluation Received",
  message: "Dr. Smith rated your video \"Volcano Experiment\"",
  icon: "⭐",
  type: "evaluation",
  read: false,
  createdAt: "2024-03-15T14:30:00Z"
}
```

---

## Notification Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Notification Flow                         │
└──────────────────────────────────────────────────────────────┘

Trigger Event
     │
     ├─ Video approved
     ├─ New evaluation received
     ├─ Badge earned
     └─ System announcement
     │
     ▼
┌────────────────────────────────────────┐
│  Identify Recipients                   │
│  Based on event type:                  │
│  ├─ Video approved → Uploader          │
│  ├─ Evaluation → Uploader              │
│  ├─ New video → Teachers/Admins        │
│  └─ Announcement → All/Role-specific   │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Create Notification Document          │
│  Firestore: notifications collection   │
│  addDoc(collection('notifications'), { │
│    userId: recipientId,                │
│    title: string,                      │
│    message: string,                    │
│    icon: emoji,                        │
│    type: string,                       │
│    read: false,                        │
│    createdAt: Timestamp,               │
│    metadata: {                         │
│      videoId?: string,                 │
│      evaluationId?: string             │
│    }                                   │
│  })                                    │
└─────────┬──────────────────────────────┘
          │
          ▼
     ◆ Success?
     ├─ No → ⚠ Log error (non-critical)
     │
     └─ Yes
          │
          ├─ Notification created
          │
          ▼
┌────────────────────────────────────────┐
│  Recipient User Session Check          │
│  Is user currently active?             │
└─────────┬──────────────────────────────┘
          │
          ├─ No → User will see on next login
          │
          └─ Yes
               │
               ▼
┌────────────────────────────────────────┐
│  Load Notifications (App.js)           │
│  useEffect with interval:              │
│  Every 30 seconds:                     │
│  query(collection('notifications'),    │
│    where('userId', '==', uid),         │
│    orderBy('createdAt', 'desc'))       │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Calculate Unread Count                │
│  unreadCount = notifications.filter(   │
│    n => !n.read                        │
│  ).length                              │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Update UI                             │
│  ├─ Notification bell icon             │
│  ├─ Badge with unread count            │
│  └─ Highlight unread notifications     │
└─────────┬──────────────────────────────┘
          │
          ▼
     User clicks bell
          │
          ▼
┌────────────────────────────────────────┐
│  Show Notification Dropdown            │
│  ├─ List recent 5 notifications        │
│  ├─ Unread notifications highlighted   │
│  └─ "View All" link                    │
└─────────┬──────────────────────────────┘
          │
          ▼
     User clicks notification
          │
          ▼
┌────────────────────────────────────────┐
│  Mark as Read                          │
│  Firestore: updateDoc(notifRef, {      │
│    read: true                          │
│  })                                    │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Navigate to Related Content           │
│  Based on notification type:           │
│  ├─ Evaluation → Show video            │
│  ├─ Approval → Show video              │
│  └─ Badge → Show profile               │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Update Unread Count                   │
│  unreadCount -= 1                      │
│  Re-render notification bell           │
└──────────────────────────────────────────┘
```

**Future Enhancement: Real-Time Push Notifications**
```
Current: Polling every 30 seconds
   ├─ Pros: Simple, reliable
   └─ Cons: 30s delay, unnecessary requests

Future: Firebase Cloud Messaging (FCM)
   ├─ Instant delivery (<1s delay)
   ├─ Push to device even when app closed
   ├─ Reduced Firestore reads (95% reduction)
   └─ Better user experience
```

---

## Discovery Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      Discovery Flow                          │
└──────────────────────────────────────────────────────────────┘

User (DiscoveryScreen.js)
     │
     ▼
┌────────────────────────────────────────┐
│  Load All Active Videos                │
│  Firestore:                            │
│  query(collection('videos'),           │
│    where('status', '==', 'active'))    │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Apply Filters                         │
│  User selections:                      │
│  ├─ Category (dropdown)                │
│  ├─ Sort by (newest/popular/topRated)  │
│  └─ Search query (text input)          │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Filter by Category                    │
│  if (selectedCategory !== 'All') {     │
│    videos = videos.filter(             │
│      v => v.category === selectedCategory│
│    )                                   │
│  }                                     │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Filter by Search Query                │
│  if (searchQuery) {                    │
│    videos = videos.filter(             │
│      v => v.title.includes(query) ||   │
│           v.description.includes(query)││
│           v.uploaderName.includes(query││
│    )                                   │
│  }                                     │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Sort Videos                           │
│  switch(sortBy) {                      │
│    case 'newest':                      │
│      sort by createdAt desc            │
│    case 'popular':                     │
│      sort by views desc                │
│    case 'topRated':                    │
│      sort by averageScore desc         │
│  }                                     │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Pagination (Future)                   │
│  currentPage = 1                       │
│  itemsPerPage = 12                     │
│  displayedVideos = videos.slice(       │
│    (currentPage - 1) * itemsPerPage,   │
│    currentPage * itemsPerPage          │
│  )                                     │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Render VideoGrid                      │
│  For each video:                       │
│  ├─ Thumbnail (or placeholder)         │
│  ├─ Title                              │
│  ├─ Uploader name                      │
│  ├─ Duration badge                     │
│  ├─ Score badge (if evaluated)         │
│  └─ Stats (views, evaluations)         │
└─────────┬──────────────────────────────┘
          │
          ▼
     User clicks video card
          │
          ▼
┌────────────────────────────────────────┐
│  Navigate to Video Playback            │
│  1. Set selectedVideoId                │
│  2. Switch to Home tab                 │
│  3. VideoFeed receives initialVideoId  │
│  4. Find video index                   │
│  5. Start playback at that index       │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Video Plays in Feed                   │
│  ✓ User can swipe to browse more       │
└──────────────────────────────────────────┘
```

**Performance Optimization:**
```javascript
// Memoized filtering (React useMemo)
const filteredVideos = useMemo(() => {
  let result = videos.filter(v => v.status === 'active');

  // Apply filters
  if (selectedCategory !== 'All') {
    result = result.filter(v => v.category === selectedCategory);
  }

  if (searchQuery) {
    result = result.filter(v =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply sorting
  switch(sortBy) {
    case 'newest':
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    // ...
  }

  return result;
}, [videos, selectedCategory, searchQuery, sortBy]);

// Only recalculates when dependencies change
// Prevents unnecessary re-filtering on every render
```

---

## Admin Operations Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  Admin Operations Flow                       │
└──────────────────────────────────────────────────────────────┘

Admin User (AdminPanel.js)
     │
     ▼
┌────────────────────────────────────────┐
│  Verify Admin Role                     │
│  if (currentUser.role !== 'admin')     │
│    → Access Denied                     │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Load Admin Dashboard Data             │
│  Parallel queries:                     │
│  ├─ All users                          │
│  ├─ All videos                         │
│  ├─ All schools                        │
│  └─ All evaluations                    │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Calculate Statistics                  │
│  ├─ Total users (by role)              │
│  ├─ Total videos (by status)           │
│  ├─ Pending approvals count            │
│  ├─ Total schools                      │
│  └─ Evaluation statistics              │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Display Dashboard Tabs                │
│  ├─ Videos (pending/active/rejected)   │
│  ├─ Users (all roles)                  │
│  ├─ Schools                            │
│  └─ Statistics                         │
└─────────┬──────────────────────────────┘
          │
          ▼
Admin Actions:

├─ Approve/Reject Video → [Video Approval Flow]
│
├─ Manage User
│  ├─ View profile
│  ├─ Change role (future)
│  └─ Deactivate (future)
│
├─ Manage School
│  ├─ Add new school
│  ├─ Edit school info
│  └─ View school statistics
│
└─ View Statistics
   ├─ User growth charts
   ├─ Video upload trends
   ├─ Evaluation metrics
   └─ School leaderboards
```

---

## Error Handling Flows

### General Error Handling Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                   Error Handling Flow                        │
└──────────────────────────────────────────────────────────────┘

Operation Attempt
     │
     ▼
┌────────────────────────────────────────┐
│  Try-Catch Block                       │
│  try {                                 │
│    // Operation                        │
│  } catch (error) {                     │
│    // Error handling                   │
│  }                                     │
└─────────┬──────────────────────────────┘
          │
          ▼
     Error Occurred
          │
          ▼
┌────────────────────────────────────────┐
│  Identify Error Type                   │
│  ├─ Firebase Auth Errors               │
│  │   - auth/user-not-found             │
│  │   - auth/wrong-password             │
│  │   - auth/email-already-in-use       │
│  │   - auth/weak-password              │
│  ├─ Firestore Errors                   │
│  │   - permission-denied               │
│  │   - not-found                       │
│  │   - unavailable                     │
│  ├─ Storage Errors                     │
│  │   - storage/unauthorized            │
│  │   - storage/canceled                │
│  │   - storage/unknown                 │
│  └─ Network Errors                     │
│      - ERR_INTERNET_DISCONNECTED       │
│      - ERR_CONNECTION_RESET            │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Map Error to User-Friendly Message    │
│  const errorMessages = {               │
│    'auth/user-not-found':              │
│      'No account found with this email'││
│    'auth/wrong-password':              │
│      'Incorrect password',             │
│    'permission-denied':                │
│      'You do not have permission'      │
│    ...                                 │
│  }                                     │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Log Error (Console/Future: Monitoring)│
│  console.error('Operation failed:', {  │
│    operation: 'videoUpload',           │
│    error: error.message,               │
│    code: error.code,                   │
│    timestamp: Date.now()               │
│  })                                    │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Display Error to User                 │
│  UI Methods:                           │
│  ├─ Toast notification (non-critical)  │
│  ├─ Alert dialog (critical)            │
│  ├─ Inline error message (forms)       │
│  └─ Error state in UI                  │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Determine Recovery Action             │
│  ├─ Retry operation (network errors)   │
│  ├─ Return to previous screen          │
│  ├─ Clear form and reset               │
│  └─ Logout (auth errors)               │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Enable User Recovery                  │
│  ├─ "Retry" button                     │
│  ├─ "Go Back" button                   │
│  └─ Clear error state on new attempt   │
└──────────────────────────────────────────┘
```

---

## Real-Time Data Synchronization

```
┌──────────────────────────────────────────────────────────────┐
│              Real-Time Sync Flow (Future)                    │
└──────────────────────────────────────────────────────────────┘

App Initialization
     │
     ▼
┌────────────────────────────────────────┐
│  Setup Firestore Listeners             │
│  onSnapshot(collection('videos'), ...) │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Listen for Changes                    │
│  ├─ Document added                     │
│  ├─ Document modified                  │
│  └─ Document deleted                   │
└─────────┬──────────────────────────────┘
          │
          ▼
     Change Detected
          │
          ▼
┌────────────────────────────────────────┐
│  Process Change                        │
│  snapshot.docChanges().forEach(change=>│
│    if (change.type === 'added') {      │
│      // Add to local state             │
│    }                                   │
│    if (change.type === 'modified') {   │
│      // Update in local state          │
│    }                                   │
│    if (change.type === 'removed') {    │
│      // Remove from local state        │
│    }                                   │
│  })                                    │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Update React State                    │
│  setVideos(updatedVideos)              │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Re-render UI                          │
│  ├─ VideoFeed updates                  │
│  ├─ Discovery updates                  │
│  └─ Admin panel updates                │
└─────────┬──────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  User Sees Updated Data                │
│  ✓ No manual refresh needed            │
└──────────────────────────────────────────┘

Benefits:
├─ Instant updates across all clients
├─ No polling required
├─ Collaborative experience
└─ Always up-to-date data
```

---

## Conclusion

This Data Flow documentation provides complete visibility into how data moves through the ScienceVerse platform for all major operations. Each flow shows:

- **User interactions** that trigger data operations
- **Validation steps** to ensure data integrity
- **Firebase operations** (Auth, Firestore, Storage)
- **Security checks** enforced by Firestore rules
- **Error handling** at every step
- **State updates** in React components
- **UI updates** reflecting data changes

These flows serve as:
1. **Development reference** for implementing features
2. **Debugging guide** for troubleshooting issues
3. **Documentation** for new team members
4. **Architecture validation** for design reviews
