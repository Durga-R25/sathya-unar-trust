# Firebase Console Data Viewing Guide

## Access Firebase Console

**Your Project URL**: https://console.firebase.google.com/project/scienceverse-competition/overview

## View Users (Teachers, Students, Judges, Admins)

### Method 1: Firestore Database View

1. **Open Firebase Console**:
   - Go to: https://console.firebase.google.com/project/scienceverse-competition/firestore

2. **Navigate to Collections**:
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Data" tab

3. **View Users Collection**:
   - Click on the `users` collection
   - You'll see all user documents listed with their IDs

4. **Filter by Role**:
   - Unfortunately, the Firebase Console doesn't have a built-in filter UI
   - You'll see all users mixed together
   - Click on each document to see its `role` field

5. **View Pending Activations**:
   - Click on the `pendingActivations` collection
   - These are students who haven't activated their accounts yet

### Method 2: Using Firebase CLI to Query Data

You can run queries from your terminal to view specific user types:

#### View All Students:
```bash
# This requires Firebase CLI and proper setup
firebase firestore:get users --where 'role==student' --project scienceverse-competition
```

#### View All Teachers:
```bash
firebase firestore:get users --where 'role==teacher' --project scienceverse-competition
```

#### View All Judges:
```bash
firebase firestore:get users --where 'role==judge' --project scienceverse-competition
```

### Method 3: Create a Quick Query in Firebase Console

1. Go to Firestore Database
2. Click on `users` collection
3. Click "Start collection"
4. Manually scroll through and look at the `role` field

### Method 4: Export Data

1. **In Firebase Console** > Firestore Database
2. Click the three dots (⋮) menu
3. Select "Import/Export"
4. Export to Cloud Storage
5. Download and view in Excel/CSV

## Better Way: Create Admin Scripts

I can create a Node.js script that you can run to view/export data easily:

```javascript
// scripts/viewUsers.js
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function viewUsers(role) {
  const snapshot = await db.collection('users')
    .where('role', '==', role)
    .get();

  console.log(`\n=== ${role.toUpperCase()}S ===\n`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Name: ${data.name}`);
    console.log(`Email: ${data.email || data.schoolId}`);
    console.log(`Created: ${data.createdAt?.toDate()}`);
    console.log('---');
  });
  console.log(`Total: ${snapshot.size}\n`);
}

// Run it
viewUsers('student');
viewUsers('teacher');
viewUsers('judge');
viewUsers('admin');
```

## Quick Summary: Current Data Structure

### Collections:

1. **users** - All activated users
   - Fields: `uid`, `role`, `name`, `email`, `schoolId`, `createdBy`, `createdAt`
   - Roles: `student`, `teacher`, `judge`, `admin`

2. **pendingActivations** - Students waiting to activate
   - Fields: `schoolId`, `name`, `activationCode`, `teacherId`, `activated`, `createdAt`

3. **videos** - Video submissions
4. **evaluations** - Video ratings
5. **schools** - School information
6. **judgeAssignments** - Video assignments for judges

## Useful Firebase Console Links:

- **Firestore Database**: https://console.firebase.google.com/project/scienceverse-competition/firestore
- **Authentication**: https://console.firebase.google.com/project/scienceverse-competition/authentication
- **Storage**: https://console.firebase.google.com/project/scienceverse-competition/storage
- **Functions**: https://console.firebase.google.com/project/scienceverse-competition/functions
- **Indexes**: https://console.firebase.google.com/project/scienceverse-competition/firestore/indexes
