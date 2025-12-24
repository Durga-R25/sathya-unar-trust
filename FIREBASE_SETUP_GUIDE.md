# Firebase Integration Guide - ScienceVerse

This guide provides complete instructions for setting up Firebase backend for the ScienceVerse competition platform.

## Table of Contents
1. [Firebase Project Setup](#1-firebase-project-setup)
2. [Firebase Authentication](#2-firebase-authentication)
3. [Firestore Database](#3-firestore-database)
4. [Firebase Storage](#4-firebase-storage)
5. [Cloud Functions](#5-cloud-functions)
6. [Environment Configuration](#6-environment-configuration)
7. [Deployment](#7-deployment)

---

## 1. Firebase Project Setup

### Step 1.1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `scienceverse-competition`
4. Disable Google Analytics (not needed for MVP)
5. Click **"Create project"**

### Step 1.2: Register Web App

1. In Firebase Console, click **"Add app"** → Select **Web** icon `</>`
2. App nickname: `ScienceVerse Web App`
3. Check **"Also set up Firebase Hosting"**
4. Click **"Register app"**
5. **Copy the Firebase config object** - you'll need this later

Example config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "scienceverse-competition.firebaseapp.com",
  projectId: "scienceverse-competition",
  storageBucket: "scienceverse-competition.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 1.3: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions
- ✅ Storage
- ✅ Hosting

---

## 2. Firebase Authentication

### Step 2.1: Enable Authentication Methods

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable these methods:
   - **Email/Password** (for Teachers, Judges, Admins)
   - **Anonymous** (optional - for public browsing)

### Step 2.2: Add Custom Claims for Roles

Create a Cloud Function to assign roles:

```javascript
// functions/src/setUserRole.js
const admin = require('firebase-admin');

exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Only admins can set roles
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set roles');
  }

  const { uid, role } = data;

  // Validate role
  const validRoles = ['student', 'teacher', 'judge', 'admin'];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
  }

  // Set custom claim
  await admin.auth().setCustomUserClaims(uid, { role });

  return { success: true, message: `Role ${role} assigned to user ${uid}` };
});
```

### Step 2.3: School ID System

Students authenticate using School IDs (format: `STATE-DISTRICT-SCHOOL-STUDENTID`)

**Implementation:**
```javascript
// Store School ID mapping in Firestore
// Collection: users/{userId}
{
  uid: "abc123",
  schoolId: "TN-TEN-GOV123-ST456",
  name: "Student Name",
  role: "student",
  schoolName: "Government High School",
  class: "9",
  district: "Tenkasi",
  state: "Tamil Nadu"
}
```

**Create Student Accounts (Teacher Function):**
```javascript
// Teachers can create student accounts
exports.createStudentAccount = functions.https.onCall(async (data, context) => {
  // Verify teacher role
  if (!context.auth || context.auth.token.role !== 'teacher') {
    throw new functions.https.HttpsError('permission-denied', 'Only teachers can create student accounts');
  }

  const { schoolId, studentName, studentClass, password } = data;

  // Create auth user
  const userRecord = await admin.auth().createUser({
    email: `${schoolId.toLowerCase().replace(/-/g, '')}@student.scienceverse.edu`,
    password: password,
    displayName: studentName
  });

  // Set student role
  await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'student' });

  // Create Firestore document
  await admin.firestore().collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    schoolId: schoolId,
    name: studentName,
    role: 'student',
    class: studentClass,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: context.auth.uid
  });

  return {
    success: true,
    uid: userRecord.uid,
    schoolId: schoolId
  };
});
```

---

## 3. Firestore Database

### Step 3.1: Database Structure

```
scienceverse-competition (Firestore Database)
│
├── users/
│   └── {userId}
│       ├── uid: string
│       ├── name: string
│       ├── role: "student" | "teacher" | "judge" | "admin"
│       ├── schoolId: string (for students)
│       ├── email: string (for non-students)
│       ├── schoolName: string
│       ├── district: string
│       ├── state: string
│       ├── class: string (for students)
│       └── createdAt: timestamp
│
├── videos/
│   └── {videoId}
│       ├── videoId: string
│       ├── title: string
│       ├── description: string
│       ├── category: string
│       ├── tags: string[]
│       ├── studentId: string (ref to users)
│       ├── studentName: string
│       ├── schoolId: string
│       ├── schoolName: string
│       ├── district: string
│       ├── uploadedAt: timestamp
│       ├── videoUrl: string (Storage path)
│       ├── thumbnailUrl: string
│       ├── duration: number
│       ├── views: number
│       ├── overallScore: number (calculated)
│       ├── evaluationCount: number
│       └── status: "pending" | "approved" | "rejected"
│
├── evaluations/
│   └── {evaluationId}
│       ├── evaluationId: string
│       ├── videoId: string (ref to videos)
│       ├── evaluatorId: string (ref to users)
│       ├── evaluatorName: string
│       ├── evaluatorRole: "student" | "teacher" | "judge"
│       ├── scientificClarity: number (1-5)
│       ├── humanityCare: number (1-5)
│       ├── realLifeImpact: number (1-5)
│       ├── originalThinking: number (1-5)
│       ├── averageScore: number
│       ├── comment: string
│       ├── evaluatedAt: timestamp
│       └── weightedScore: number (calculated by role)
│
├── categories/
│   └── {categoryId}
│       ├── categoryId: string
│       ├── name: string
│       ├── icon: string
│       ├── active: boolean
│       └── order: number
│
├── schools/
│   └── {schoolId}
│       ├── schoolId: string (e.g., "TN-TEN-GOV123")
│       ├── name: string
│       ├── district: string
│       ├── state: string
│       ├── coordinatorId: string (ref to users - teacher)
│       ├── studentCount: number
│       ├── videoCount: number
│       └── averageScore: number
│
└── settings/
    └── competition
        ├── name: string
        ├── startDate: timestamp
        ├── endDate: timestamp
        ├── videoDurationLimit: number
        ├── maxSubmissionsPerStudent: number
        ├── uploadsEnabled: boolean
        └── evaluationsEnabled: boolean
```

### Step 3.2: Security Rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return request.auth.token.role;
    }

    function isStudent() {
      return getUserRole() == 'student';
    }

    function isTeacher() {
      return getUserRole() == 'teacher';
    }

    function isJudge() {
      return getUserRole() == 'judge';
    }

    function isAdmin() {
      return getUserRole() == 'admin';
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      // Everyone can read user profiles
      allow read: if isAuthenticated();

      // Users can update their own profile
      allow update: if isOwner(userId);

      // Only admins and teachers can create users
      allow create: if isAdmin() || isTeacher();

      // Only admins can delete users
      allow delete: if isAdmin();
    }

    // Videos collection
    match /videos/{videoId} {
      // Everyone can read videos
      allow read: if isAuthenticated();

      // Students can create their own videos
      allow create: if isStudent() &&
                      request.resource.data.studentId == request.auth.uid;

      // Video owner can update their video
      allow update: if isOwner(resource.data.studentId) || isAdmin();

      // Only admins can delete videos
      allow delete: if isAdmin();
    }

    // Evaluations collection
    match /evaluations/{evaluationId} {
      // Everyone can read evaluations
      allow read: if isAuthenticated();

      // Teachers, judges, and students can create evaluations
      allow create: if (isTeacher() || isJudge() || isStudent()) &&
                      request.resource.data.evaluatorId == request.auth.uid;

      // Evaluator can update their own evaluation
      allow update: if isOwner(resource.data.evaluatorId) || isAdmin();

      // Only admins can delete evaluations
      allow delete: if isAdmin();
    }

    // Categories collection
    match /categories/{categoryId} {
      // Everyone can read categories
      allow read: if isAuthenticated();

      // Only admins can modify categories
      allow write: if isAdmin();
    }

    // Schools collection
    match /schools/{schoolId} {
      // Everyone can read schools
      allow read: if isAuthenticated();

      // Teachers can update their own school
      allow update: if isTeacher() &&
                      resource.data.coordinatorId == request.auth.uid;

      // Only admins can create/delete schools
      allow create, delete: if isAdmin();
    }

    // Settings collection
    match /settings/{document=**} {
      // Everyone can read settings
      allow read: if isAuthenticated();

      // Only admins can modify settings
      allow write: if isAdmin();
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Step 3.3: Indexes

Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "videos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "overallScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "videos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "uploadedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "videos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "district", "order": "ASCENDING" },
        { "fieldPath": "overallScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "evaluations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "videoId", "order": "ASCENDING" },
        { "fieldPath": "evaluatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "evaluations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "evaluatorId", "order": "ASCENDING" },
        { "fieldPath": "evaluatedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## 4. Firebase Storage

### Step 4.1: Storage Structure

```
scienceverse-competition.appspot.com
│
├── videos/
│   └── {userId}/
│       └── {videoId}.mp4
│
├── thumbnails/
│   └── {videoId}.jpg
│
└── temp/
    └── {uploadId}.mp4 (auto-deleted after 24 hours)
```

### Step 4.2: Storage Rules

Create `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isStudent() {
      return request.auth.token.role == 'student';
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidVideoSize() {
      // Max 100MB per video
      return request.resource.size < 100 * 1024 * 1024;
    }

    function isValidVideoType() {
      return request.resource.contentType.matches('video/.*');
    }

    // Videos folder
    match /videos/{userId}/{videoId} {
      // Anyone authenticated can read videos
      allow read: if isAuthenticated();

      // Only video owner (student) can upload
      allow create: if isStudent() &&
                      isOwner(userId) &&
                      isValidVideoSize() &&
                      isValidVideoType();

      // Owner or admin can delete
      allow delete: if isOwner(userId) ||
                      request.auth.token.role == 'admin';
    }

    // Thumbnails folder (generated by Cloud Functions)
    match /thumbnails/{videoId} {
      // Anyone authenticated can read thumbnails
      allow read: if isAuthenticated();

      // Only Cloud Functions can write thumbnails
      allow write: if false;
    }

    // Temp folder (auto-deleted after 24 hours)
    match /temp/{uploadId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only storage
```

### Step 4.3: Video Upload Implementation

```javascript
// src/services/firebase/storage.js
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export const uploadVideo = (videoFile, userId, onProgress) => {
  return new Promise((resolve, reject) => {
    const storage = getStorage();
    const videoId = `video_${Date.now()}`;
    const storageRef = ref(storage, `videos/${userId}/${videoId}.mp4`);

    const uploadTask = uploadBytesResumable(storageRef, videoFile);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          videoId,
          videoUrl: downloadURL,
          storagePath: uploadTask.snapshot.ref.fullPath
        });
      }
    );
  });
};
```

---

## 5. Cloud Functions

### Step 5.1: Initialize Functions

```bash
cd functions
npm install
```

Install dependencies:
```bash
npm install firebase-admin firebase-functions ffmpeg-static fluent-ffmpeg
```

### Step 5.2: Score Calculation Function

Create `functions/src/calculateVideoScore.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Trigger: When a new evaluation is created
 * Recalculates the overall score for a video using weighted averages
 * Weights: Judge 70%, Teacher 20%, Student 10%
 */
exports.calculateVideoScore = functions.firestore
  .document('evaluations/{evaluationId}')
  .onCreate(async (snap, context) => {
    const evaluation = snap.data();
    const videoId = evaluation.videoId;

    // Get all evaluations for this video
    const evaluationsSnapshot = await admin.firestore()
      .collection('evaluations')
      .where('videoId', '==', videoId)
      .get();

    // Group evaluations by role
    const roleScores = {
      judge: [],
      teacher: [],
      student: []
    };

    evaluationsSnapshot.forEach(doc => {
      const eval = doc.data();
      const avgScore = (
        eval.scientificClarity +
        eval.humanityCare +
        eval.realLifeImpact +
        eval.originalThinking
      ) / 4;

      roleScores[eval.evaluatorRole].push(avgScore);
    });

    // Calculate average scores by role
    const calculateAverage = (scores) => {
      if (scores.length === 0) return 0;
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    };

    const judgeAvg = calculateAverage(roleScores.judge);
    const teacherAvg = calculateAverage(roleScores.teacher);
    const studentAvg = calculateAverage(roleScores.student);

    // Calculate weighted overall score
    // Judge: 70%, Teacher: 20%, Student: 10%
    const overallScore = (judgeAvg * 0.7) + (teacherAvg * 0.2) + (studentAvg * 0.1);

    // Update video document
    await admin.firestore()
      .collection('videos')
      .doc(videoId)
      .update({
        overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
        evaluationCount: evaluationsSnapshot.size,
        judgeEvaluations: roleScores.judge.length,
        teacherEvaluations: roleScores.teacher.length,
        studentEvaluations: roleScores.student.length,
        lastEvaluatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log(`Updated score for video ${videoId}: ${overallScore.toFixed(1)}`);

    return { success: true, videoId, overallScore };
  });
```

### Step 5.3: Thumbnail Generation Function

Create `functions/src/generateThumbnail.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Trigger: When a new video is uploaded to Storage
 * Generates a thumbnail image at the 2-second mark
 */
exports.generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;

    // Only process videos in /videos/ folder
    if (!filePath.startsWith('videos/')) {
      return null;
    }

    const fileName = path.basename(filePath);
    const videoId = fileName.replace('.mp4', '');

    const bucket = admin.storage().bucket(object.bucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const thumbnailFileName = `${videoId}.jpg`;
    const thumbnailFilePath = path.join(os.tmpdir(), thumbnailFileName);

    // Download video to temp
    await bucket.file(filePath).download({ destination: tempFilePath });

    // Generate thumbnail at 2 seconds
    await new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .screenshots({
          timestamps: ['2'],
          filename: thumbnailFileName,
          folder: os.tmpdir(),
          size: '640x360'
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Upload thumbnail to Storage
    await bucket.upload(thumbnailFilePath, {
      destination: `thumbnails/${thumbnailFileName}`,
      metadata: {
        contentType: 'image/jpeg'
      }
    });

    // Get public URL
    const thumbnailUrl = `https://storage.googleapis.com/${object.bucket}/thumbnails/${thumbnailFileName}`;

    // Update video document with thumbnail URL
    const videoSnapshot = await admin.firestore()
      .collection('videos')
      .where('videoId', '==', videoId)
      .limit(1)
      .get();

    if (!videoSnapshot.empty) {
      await videoSnapshot.docs[0].ref.update({
        thumbnailUrl: thumbnailUrl,
        thumbnailGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Cleanup temp files
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(thumbnailFilePath);

    console.log(`Thumbnail generated for video ${videoId}`);

    return { success: true, videoId, thumbnailUrl };
  });
```

### Step 5.4: Deploy Functions

```bash
firebase deploy --only functions
```

---

## 6. Environment Configuration

### Step 6.1: Create Firebase Config File

Create `src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Your Firebase configuration (from Step 1.2)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
```

### Step 6.2: Environment Variables

Create `.env` (DO NOT commit to git):

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Create `.env.example` (commit to git):

```bash
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

Add to `.gitignore`:
```
.env
.env.local
```

---

## 7. Deployment

### Step 7.1: Build for Production

```bash
npm run build
```

### Step 7.2: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### Step 7.3: Deploy Everything

```bash
# Deploy all Firebase services at once
firebase deploy
```

This deploys:
- Firestore rules and indexes
- Storage rules
- Cloud Functions
- Hosting (web app)

### Step 7.4: Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `scienceverse.edu.in`)
4. Follow DNS configuration instructions
5. SSL certificate will be auto-provisioned

---

## Performance Optimization

### Firestore Query Optimization

```javascript
// Use pagination for large lists
const PAGE_SIZE = 20;

const getVideosPage = async (lastVisible = null) => {
  let query = db.collection('videos')
    .orderBy('uploadedAt', 'desc')
    .limit(PAGE_SIZE);

  if (lastVisible) {
    query = query.startAfter(lastVisible);
  }

  const snapshot = await query.get();
  const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1];

  return { videos, lastVisible: lastDoc };
};
```

### Storage Optimization

```javascript
// Compress video before upload (client-side)
import { VideoCompressor } from 'video-compressor';

const compressVideo = async (videoFile) => {
  const compressor = new VideoCompressor();
  const compressed = await compressor.compress(videoFile, {
    quality: 'medium',
    maxWidth: 1280,
    maxHeight: 720
  });
  return compressed;
};
```

---

## Monitoring & Analytics

### Enable Firebase Performance Monitoring

```bash
npm install firebase/performance
```

```javascript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

### Enable Crashlytics (Optional)

For production error tracking:

```bash
npm install firebase/analytics
```

---

## Security Checklist

- ✅ Firestore security rules configured
- ✅ Storage security rules configured
- ✅ Environment variables not committed to git
- ✅ API keys restricted to specific domains (Firebase Console → Settings → API Keys)
- ✅ User roles verified with custom claims
- ✅ File upload size limits enforced
- ✅ Rate limiting on Cloud Functions (Firebase Console → Functions)
- ✅ CORS configured for Storage
- ✅ HTTPS enforced (automatic with Firebase Hosting)

---

## Cost Estimation (20,000 students, 5,000 videos)

### Firestore
- **Reads:** ~2M/month → $0.36
- **Writes:** ~500K/month → $0.18
- **Storage:** ~1GB → $0.18
- **Total:** ~$0.72/month

### Storage
- **Videos:** 5,000 × 50MB = 250GB → $6.25/month
- **Thumbnails:** 5,000 × 100KB = 500MB → $0.01/month
- **Downloads:** 100K views × 50MB = 5TB → $200/month
- **Total:** ~$206/month

### Cloud Functions
- **Invocations:** ~100K/month → $0.40
- **Compute:** 100K × 1GB-sec → $0.25
- **Total:** ~$0.65/month

### Hosting
- **Storage:** 1GB → $0.026/month
- **Bandwidth:** 10GB/month → $0.15
- **Total:** ~$0.18/month

**Grand Total: ~$208/month** for 5,000 concurrent users

---

## Support & Troubleshooting

### Common Issues

**Issue: "Permission denied" errors**
- Check Firestore/Storage security rules
- Verify user authentication and custom claims
- Ensure indexes are deployed

**Issue: Video upload fails**
- Check file size (max 100MB)
- Verify storage rules allow upload
- Check network connection

**Issue: Thumbnail not generating**
- Check Cloud Function logs: `firebase functions:log`
- Ensure ffmpeg is installed in Functions
- Verify storage permissions

### Get Help

- Firebase Documentation: https://firebase.google.com/docs
- Stack Overflow: Tag `firebase`
- Firebase Support: https://firebase.google.com/support

---

**Last Updated:** 2024-01-15
**Version:** 1.0
**Author:** ScienceVerse Development Team
